import type { Metadata } from 'next';
import '@/app/globals.css';
import '@/styles/lightbox.scss';
import Header from '@/components/Header/Header';
import { getPayload } from 'payload';
import config from '@payload-config';

export const metadata: Metadata = {
  title: 'Design Portfolio',
  description: 'A portfolio of design work',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch menu data
  let mainMenu = null;
  try {
	const payload = await getPayload({ config });
	const { docs } = await payload.find({
	  collection: 'menus',
	  where: {
		slug: {
		  equals: 'main-menu',
		},
	  },
	  limit: 1,
	});

	if (docs.length > 0) {
	  mainMenu = docs[0];
	}
  } catch (error) {
	console.warn('Could not fetch menu data:', error);
  }

  // Fetch site settings
  let siteSettings = null;
  try {
	const payload = await getPayload({ config });
	const settings = await payload.findGlobal({
	  slug: 'settings',
	});

	if (settings) {
	  siteSettings = settings;
	}
  } catch (error) {
	console.warn('Could not fetch site settings:', error);
  }

  return (
	<html lang="en">
	  <head>
		{/* Typotheque font - October */}
		<link
		  rel="stylesheet"
		  href="https://fonts.typotheque.com/WF-004891-002394.css"
		  type="text/css"
		/>
		{/* Update page title from settings if available */}
		{siteSettings?.siteTitle && (
		  <title>{siteSettings.siteTitle}</title>
		)}
		{/* Update meta description from settings if available */}
		{siteSettings?.metaDescription && (
		  <meta name="description" content={siteSettings.metaDescription} />
		)}
	  </head>
	  <body>
		<Header
		  title={siteSettings?.siteTitle || 'Design Portfolio'}
		  menu={mainMenu}
		/>
		{children}
	  </body>
	</html>
  );
}