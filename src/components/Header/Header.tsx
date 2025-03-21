'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.scss';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  title?: string;
  menu?: any;
}

export default function Header({ title = 'Design Portfolio', menu = null }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when clicking outside
  useEffect(() => {
	const handleClickOutside = (e: MouseEvent) => {
	  const target = e.target as HTMLElement;
	  if (!target.closest(`.${styles.nav}`) && !target.closest(`.${styles.hamburger}`)) {
		setMenuOpen(false);
	  }
	};

	document.addEventListener('mousedown', handleClickOutside);
	return () => {
	  document.removeEventListener('mousedown', handleClickOutside);
	};
  }, []);

  // Close menu when changing routes
  useEffect(() => {
	setMenuOpen(false);
  }, [pathname]);

  return (
	<header className={`${styles.header} ${menuOpen ? styles.menuOpen : ''}`}>
	  {/* Logo */}
	  <div className={styles.logo}>
		<Link href="/">
		  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img">
			<path d="M32,16.05c0-0.02,0-0.03,0-0.05c0-8.81-7.19-16-16-16C7.19,0,0,7.19,0,16c0,8.81,7.19,16,16,16
			c8.02,0,14.69-5.95,15.83-13.66c-2.41-0.75-6.4-1.28-9.44-0.32c0.13,3.58-1.29,9.28-4.95,9.8c-3.01,0.43-3.64-2.54-2.77-4.67
			c0.97-2.37,3.05-4.23,5.94-5.39c-0.49-4.34-3.03-9.06-7.44-10.41c-4.78-1.46-6.49,4.46-1.59,5.26l-0.09,0.59
			c-7.54-0.52-5.07-10.31,2.2-8.16c5.26,1.55,8.14,7.48,8.64,12.11C25.39,16.18,28.78,15.84,32,16.05L32,16.05z M15.61,23.46
			c-1.12,3.34,1.63,4.26,3.45,1.93c1.39-1.78,1.72-5.07,1.64-6.75C18.19,19.7,16.3,21.42,15.61,23.46L15.61,23.46z"/>
		  </svg>
		</Link>
	  </div>

	  {/* Hamburger Menu Button */}
	  <button
		className={`${styles.hamburger} ${menuOpen ? styles.active : ''}`}
		onClick={() => setMenuOpen(!menuOpen)}
		aria-label="Toggle Menu"
	  >
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		  <rect className={styles.line1} y="5" width="24" height="2" rx="1" fill="currentColor"/>
		  <rect className={styles.line2} y="11" width="24" height="2" rx="1" fill="currentColor"/>
		  <rect className={styles.line3} y="17" width="24" height="2" rx="1" fill="currentColor"/>
		</svg>
	  </button>

	  {/* Menu from CMS */}
	  <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`} aria-label="Main Navigation">
		{menu && menu.items && menu.items.length > 0 ? (
		  <ul>
			{menu.items.map((item: any, index: number) => (
			  <li key={`menu-item-${index}`}>
				{item.type === 'internal' && item.internalLink ? (
				  <Link href={getInternalLinkHref(item.internalLink)}>
					{item.title}
				  </Link>
				) : (
				  <a
					href={item.externalLink || '#'}
					target={item.openInNewTab ? "_blank" : undefined}
					rel={item.openInNewTab ? "noopener noreferrer" : undefined}
				  >
					{item.title}
				  </a>
				)}
			  </li>
			))}
		  </ul>
		) : (
		  // If no menu items, show empty nav
		  <ul></ul>
		)}
	  </nav>
	</header>
  );
}

// Helper function to construct internal link paths
function getInternalLinkHref(link: any): string {
  if (!link) return '/';

  const collection = typeof link.relationTo === 'string' ? link.relationTo : 'categories';
  const doc = typeof link.value === 'object' ? link.value : link;

  switch (collection) {
	case 'categories':
	  return `/work/${doc.slug}`;
	case 'projects':
	  // Find the parent category if possible
	  const categorySlug = doc.category?.slug || '';
	  return `/work/${categorySlug}/${doc.slug}`;
	default:
	  return '/';
  }
}