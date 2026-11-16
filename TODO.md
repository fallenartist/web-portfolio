# TO DO

## General

- [ ] Review remaining dependency advisories and remove scoped overrides when upstream supports fixed versions.
- [ ] Finalize privacy details and link the published page from Cookies settings before deploying cookie analytics and session recordings.

- [x] Add cookie banner and menu settings icon with consent-gated PostHog cookies, click capture and masked session recordings.

## Admin

- [x] Add localized Cookies settings and a shared Media icon for the banner/menu.
- [ ] Give production PostHog analytics a clean starting point (reset data).
- [x] Exclude internal visits by IP on the website, before cookieless tracking starts; retain the admin-cookie exclusion.
- [x] Fix information tiles flex division - divide all tiles when reflowing into multiple lines.
- [x] Add geo-location sources to analytics dashboard.
- [ ] Configure an email adapter for admin password-reset delivery.
- [x] Add frontpage link in side panel.

## Layout

- [x] Don't animate whole Treemap on refresh. Fade in each cell on load.
- [x] Implement better handling and visibility of project titles on touch devices.
- [x] Add more delay when animating between projects using Prev/Next.
- [x] Ensure next/prev project treemap images are preloaded when scrolled to prev/next in a project.
- [x] Fix top alignment of elements when using images in columns.

## Typography

- [x] Add small caps and other styles to Pages. Make the styles uniform across the site, including admin.
- [x] Keep conjunctions with next word using non-breaking space in Polish.

## SEO

- [ ] Explore options to add SEO analysis to the site (per page).
- [ ] Ensure relevant images and description is used when sharing links to social media (root should use the treemap snapshot).
