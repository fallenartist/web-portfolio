import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createVideoWatchTracker } from '../src/lib/video-analytics'
import { parseAnalyticsReport } from '../src/lib/analytics-report'
import type { AnalyticsEventName, AnalyticsProperties } from '../src/lib/analytics'

function viewing(duration = 100) {
  let time = 0
  const events: { name: AnalyticsEventName; properties: AnalyticsProperties }[] = []
  const tracker = createVideoWatchTracker(
    { viewing_id: 'view-1', video_key: '/project:hero:123', autoplay: true },
    (name, properties) => events.push({ name, properties }),
    () => time,
  )
  const data = (seconds: number) => ({ seconds, duration })
  const advance = (from: number, to: number) => {
    for (let seconds = from + 1; seconds <= to; seconds++) {
      time += 1000
      tracker.update(data(seconds))
    }
  }
  return {
    tracker,
    events,
    data,
    advance,
    wait: (milliseconds: number) => {
      time += milliseconds
    },
  }
}

test('actual playback starts once, checkpoints at watched milestones and completes once', () => {
  const { tracker, events, data, advance } = viewing()
  tracker.update(data(0))
  assert.equal(events.length, 0)
  tracker.play(data(0))
  tracker.play(data(0))
  advance(0, 100)
  tracker.ended(data(100))
  tracker.ended(data(100))
  tracker.leave()
  tracker.leave()
  assert.equal(events.filter((event) => event.name === 'video_started').length, 1)
  assert.equal(events[0].properties.autoplay, true)
  assert.deepEqual(
    events
      .filter((event) => event.name === 'video_progress')
      .map((event) => event.properties.milestone),
    [25, 50, 75, 90],
  )
  assert.equal(events.filter((event) => event.name === 'video_completed').length, 1)
  assert.equal(events.filter((event) => event.name === 'video_left').length, 1)
  assert.equal(events.at(-1)?.properties.watch_seconds, 100)
  assert.equal(events.at(-1)?.properties.watched_percent, 100)
})

test('seeking to the end does not count skipped sections as watched', () => {
  const { tracker, events, data, advance } = viewing()
  tracker.play(data(0))
  advance(0, 10)
  tracker.seeking(data(95))
  tracker.seeked(data(95))
  advance(95, 100)
  tracker.ended(data(100))
  tracker.leave()
  const final = events.at(-1)?.properties
  assert.equal(final?.watch_seconds, 15)
  assert.equal(final?.watched_percent, 15)
  assert.equal(final?.position_percent, 100)
  assert.equal(events.filter((event) => event.name === 'video_completed').length, 0)
  assert.equal(events.filter((event) => Number(event.properties.milestone) > 0).length, 0)
})

test('pauses and hidden playback do not add watch time; repeated ranges count once', () => {
  const { tracker, events, data, advance, wait } = viewing()
  tracker.play(data(0))
  advance(0, 20)
  tracker.pause(data(20))
  tracker.pause(data(20))
  wait(60_000)
  tracker.play(data(20))
  tracker.visibility(false)
  advance(20, 60)
  tracker.visibility(true)
  tracker.seeking(data(0))
  tracker.seeked(data(0))
  advance(0, 20)
  tracker.leave()
  assert.equal(events.at(-1)?.properties.watch_seconds, 40)
  assert.equal(events.at(-1)?.properties.watched_percent, 20)
  assert.equal(events.filter((event) => event.properties.reason === 'pause').length, 1)
  assert.equal(events.filter((event) => event.properties.milestone === 25).length, 0)
})

test('looping backgrounds complete once and continue without inflating starts or coverage', () => {
  const { tracker, events, data, advance } = viewing(10)
  tracker.play(data(0))
  advance(0, 10)
  tracker.update(data(0))
  advance(0, 10)
  tracker.update(data(0))
  tracker.leave()
  assert.equal(events.filter((event) => event.name === 'video_completed').length, 1)
  assert.equal(events.filter((event) => event.name === 'video_started').length, 1)
  assert.equal(events.at(-1)?.properties.watched_percent, 100)
  assert.equal(events.at(-1)?.properties.watch_seconds, 20)
})

test('a skipped ending can later become a completion after watching the video', () => {
  const { tracker, events, data, advance } = viewing()
  tracker.play(data(0))
  tracker.seeking(data(95))
  tracker.seeked(data(95))
  advance(95, 100)
  tracker.ended(data(100))
  tracker.seeking(data(0))
  tracker.seeked(data(0))
  tracker.play(data(0))
  advance(0, 100)
  tracker.ended(data(100))
  assert.equal(events.filter((event) => event.name === 'video_completed').length, 1)
  assert.equal(events.at(-1)?.properties.watched_percent, 100)
})

test('never-played videos do not report exits and back-forward cache restores a viewing', () => {
  const { tracker, events, data, advance } = viewing()
  tracker.leave()
  assert.equal(events.length, 0)
  tracker.play(data(0))
  advance(0, 10)
  tracker.leave()
  tracker.resume()
  advance(10, 20)
  tracker.leave()
  assert.equal(events.filter((event) => event.name === 'video_started').length, 1)
  assert.equal(events.at(-1)?.properties.watch_seconds, 20)
})

test('video reporting merges unordered rows, preserves no-exit state and ignores legacy play clicks', () => {
  const report = parseAnalyticsReport(
    [
      ['video_details', 'one', 'Hero', 8, 2, 6, 42.5],
      ['video_progress', 'one', 'Hero', 9, 7, 5, 4],
      ['videos', 'two', 'Story', 2, 0, 0, 0],
      ['video_details', 'two', 'Story', 2, 0, 0, null],
      ['videos', 'one', 'Hero', 10, 3, 25.3, 65.4],
    ],
    7,
  )
  assert.equal(report.videos.length, 2)
  assert.deepEqual(report.videos[0], {
    key: 'one',
    label: 'Hero',
    starts: 10,
    completions: 3,
    averageWatchSeconds: 25.3,
    averageWatchedPercent: 65.4,
    manualStarts: 8,
    autoplayStarts: 2,
    leftEarly: 6,
    averageExitPercent: 42.5,
    milestones: [9, 7, 5, 4],
  })
  assert.equal(report.videos[1].averageExitPercent, null)
  assert.deepEqual(parseAnalyticsReport([], 7).videos, [])
})
