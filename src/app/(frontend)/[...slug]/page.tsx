import { getPayload } from 'payload';
import config from '@payload-config';
import { notFound } from 'next/navigation';
import Treemap from '@/components/Treemap/Treemap';
import { fetchTreemapData } from '@/lib/transformers';

interface SlugPageProps {
  params: {
	slug: string[];
  };
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = params;

  try {
	// Initialize Payload
	const payload = await getPayload({ config });

	// Fetch all data for the treemap
	const { treemapData, categories, projects } = await fetchTreemapData(payload);

	// Check if the requested path exists
	const lastSlug = slug[slug.length - 1];

	const categoryExists = categories.some((cat: any) => cat.slug === lastSlug);
	const projectExists = projects.some((proj: any) => proj.slug === lastSlug);

	if (!categoryExists && !projectExists) {
	  return notFound();
	}

	return (
	  <main className="min-h-screen">
		<Treemap
		  data={treemapData}
		  baseUrl="/"
		/>
	  </main>
	);
  } catch (error) {
	console.error('Error fetching data:', error);
	return notFound();
  }
}

// Generate static params for all possible routes
export async function generateStaticParams() {
  try {
	// Initialize Payload
	const payload = await getPayload({ config });

	// Fetch categories and projects
	const { docs: categories } = await payload.find({
	  collection: 'categories',
	  limit: 100,
	});

	const { docs: projects } = await payload.find({
	  collection: 'projects',
	  limit: 100,
	});

	const paths: { slug: string[] }[] = [];

	// Add category paths
	categories.forEach((category: any) => {
	  paths.push({ slug: [category.slug] });
	});

	// Add project paths
	projects.forEach((project: any) => {
	  // Get category slug
	  const categorySlug = typeof project.category === 'string'
		? categories.find((c: any) => c.id === project.category)?.slug
		: project.category?.slug;

	  if (categorySlug) {
		paths.push({ slug: [categorySlug, project.slug] });
	  }
	});

	return paths;
  } catch (error) {
	console.error('Error generating static params:', error);
	return [];
  }
}