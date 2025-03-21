import { Payload } from 'payload';

/**
 * Transforms category and project data from Payload CMS into a hierarchical structure
 * suitable for the D3.js treemap visualization
 */
export function transformDataForTreemap(categories: any[], projects: any[], settings: any = null) {
  // Create a lookup map of categories by ID
  const categoryMap = new Map();
  categories.forEach(category => {
	categoryMap.set(category.id, {
	  slug: category.slug,
	  title: category.title,
	  priority: category.priority || 100,
	  // Add category color for treemap visualization
	  color: category.color || null,
	  thumb: category?.thumbnail?.sizes?.thumbnail?.url || null,
	  children: []
	});
  });

  // Add projects to their respective categories
  projects.forEach(project => {
	const categoryId = typeof project.category === 'string' ? project.category : project.category.id;
	const category = categoryMap.get(categoryId);

	if (category) {
	  // Create project node
		const projectNode = {
		  slug: project.slug,
		  title: project.title,
		  priority: project.priority || 100,
		  desc: project.description,
		  // Add excerpt for SEO
		  excerpt: project.excerpt || '',
		  // For level 2, just store the thumbnail (PNG/SVG with transparency)
		  thumb: project?.thumbnail?.url || null,
		  children: []
		};

	  // Add gallery images as children to the project
	  if (project.gallery && project.gallery.length > 0) {
		project.gallery.forEach((item: any, index: number) => {
		  const image = item.image;
		  projectNode.children.push({
			  slug: `image-${index}`,
			  title: item.title || '',
			  id: image.id,
			  priority: 100,
			  featured: item.featured || false,
			  // Store full image URL
			  image: image.url,
			  // Store all available sizes for dynamic resolution selection
			  sizes: {
				thumbnail: image.sizes?.thumbnail,
				small: image.sizes?.small,
				medium: image.sizes?.medium,
				large: image.sizes?.large
			  }
			});
		});
	  }

	  category.children.push(projectNode);
	}
  });

  // Create root node with categories as children
  const rootNode = {
	  slug: settings?.rootCategorySlug || 'work',
	  title: settings?.rootCategoryTitle || 'WORK',
	  children: Array.from(categoryMap.values()),
	  // Add settings for the treemap
	  settings: {
		enableAutoplay: settings?.enableAutoplay !== false,
		autoplayDelay: settings?.autoplayDelay || 5000,
		autoplayInterval: settings?.autoplayInterval || 3000,
		siteTitle: settings?.siteTitle || 'Design Portfolio',
		rootCategoryTitle: settings?.rootCategoryTitle || 'WORK',
		rootCategorySlug: settings?.rootCategorySlug || 'work'
	  }
	};

  return rootNode;
}

/**
 * Converts rich text content from Payload CMS to HTML
 */
export function richTextToHtml(content: any) {
  if (!content) return '';

  // For real implementation, use Payload's built-in serializers
  // This is a simple placeholder implementation

  return content;
}

/**
 * Fetches all data needed for the treemap
 */
export async function fetchTreemapData(payload: Payload) {
   try {
	 // Fetch categories and projects
	 const { docs: categories } = await payload.find({
	   collection: 'categories',
	   depth: 1,
	 });

	 const { docs: projects } = await payload.find({
	   collection: 'projects',
	   depth: 2,
	   limit: 100,
	 });

	 // Fetch settings from globals
	 let settings = null;
	 try {
	   const settingsResponse = await payload.findGlobal({
		 slug: 'settings',
	   });

	   if (settingsResponse) {
		 settings = settingsResponse;
	   }
	 } catch (error) {
	   console.warn('No settings found, using defaults');
	 }

	 // Transform data for treemap
	 const treemapData = transformDataForTreemap(categories, projects, settings);

	 return {
	   treemapData,
	   categories,
	   projects,
	   settings
	 };
   } catch (error) {
	 console.error('Error fetching treemap data:', error);
	 throw error;
   }
 }