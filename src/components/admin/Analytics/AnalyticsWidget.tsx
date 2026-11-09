import type { WidgetServerProps } from 'payload'
import { getAnalyticsReport } from '@/lib/analytics-server'
import { analyticsPeriod } from '@/lib/analytics-report'
import AnalyticsSummary from './AnalyticsSummary'

export default async function AnalyticsWidget({ req, widgetData }: WidgetServerProps) {
  if (!req.user) return null
  const report = await getAnalyticsReport(analyticsPeriod(widgetData?.period))
  return <AnalyticsSummary initialReport={report} />
}
