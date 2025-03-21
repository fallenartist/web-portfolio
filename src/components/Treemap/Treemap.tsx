'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { createD3Lightbox } from '@/lib/lightbox';
import { TreemapNode } from '@/types';
import styles from './Treemap.module.scss';

interface TreemapProps {
  data: any;
  baseUrl?: string;
}

export default function Treemap({ data, baseUrl = '' }: TreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const infoWrapperRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const showInfoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [currentNode, setCurrentNode] = useState<TreemapNode | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  // Store refs in a ref object to avoid recreation
	const refs = useRef({
	  lightbox: null as any,
	  nodes: null as any,
	  zoomToNode: null as ((node: TreemapNode) => void) | null,
	  redraw: null as (() => void) | null,
	  resizeTimer: null as NodeJS.Timeout | null,
	  idleTimer: null as NodeJS.Timeout | null,
	  isAutoPlaying: false,
	  featuredNodes: [] as TreemapNode[],
	  currentFeaturedIndex: 0,
	});

  useEffect(() => {
	// Create lightbox
	refs.current.lightbox = createD3Lightbox({
	  containerSelector: 'body',
	  imagePathPrefix: '', // /media/
	  transitionDuration: 400
	});

	// Initialize D3 treemap
	initTreemap();

	// Store redraw function in refs for access from event handlers
	refs.current.redraw = () => {
	  console.log("Redrawing treemap");
	  if (currentNode && refs.current.zoomToNode) {
		refs.current.zoomToNode(currentNode);
	  }
	};

	// Window resize handler
	const handleResize = () => {
	  if (refs.current.resizeTimer) {
		clearTimeout(refs.current.resizeTimer);
	  }
	  refs.current.resizeTimer = setTimeout(() => {
		if (refs.current.redraw) {
		  refs.current.redraw();
		}
	  }, 250);
	};

	// User activity handlers for auto-playing feature
	const resetIdleTimer = () => {
	  if (refs.current.idleTimer) {
		clearTimeout(refs.current.idleTimer);
	  }

	  if (refs.current.isAutoPlaying) {
		stopAutoPlay();
	  }

	  // Only start auto-play if it's enabled in settings
	  if (data.settings?.enableAutoplay !== false) {
		refs.current.idleTimer = setTimeout(() => {
		  startAutoPlay();
		}, data.settings?.autoplayDelay || 5000); // Use the autoplay delay from settings
	  }
	};

	// Setup event listeners
	window.addEventListener('resize', handleResize);
	window.addEventListener('mousemove', resetIdleTimer);
	window.addEventListener('mousedown', resetIdleTimer);
	window.addEventListener('touchstart', resetIdleTimer);
	window.addEventListener('keypress', resetIdleTimer);
	window.addEventListener('scroll', resetIdleTimer);

	// Initialize idle timer
	resetIdleTimer();

	return () => {
	  // Clean up
	  window.removeEventListener('resize', handleResize);
	  window.removeEventListener('mousemove', resetIdleTimer);
	  window.removeEventListener('mousedown', resetIdleTimer);
	  window.removeEventListener('touchstart', resetIdleTimer);
	  window.removeEventListener('keypress', resetIdleTimer);
	  window.removeEventListener('scroll', resetIdleTimer);

	  if (refs.current.resizeTimer) {
		clearTimeout(refs.current.resizeTimer);
	  }
	  if (refs.current.idleTimer) {
		clearTimeout(refs.current.idleTimer);
	  }
	};
  }, [data]);

  // Helper function to determine appropriate image size based on cell dimensions
  const getAppropriateImageSize = (d: any, cellWidth: number, cellHeight: number) => {
	  // Calculate the approximate display size needed (using the larger dimension)
	  const maxDimension = Math.max(cellWidth, cellHeight);

	  // Choose appropriate size based on the cell dimensions
	  // We use a step-up approach: smallest image first, then progressively larger
	  // as needed to match the display size
	  if (maxDimension <= 400) {
		return d.sizes?.thumbnail?.url || d.image;
	  } else if (maxDimension <= 800) {
		return d.sizes?.small?.url || d.sizes?.thumbnail?.url || d.image;
	  } else if (maxDimension <= 1600) {
		return d.sizes?.medium?.url || d.sizes?.small?.url || d.sizes?.thumbnail?.url || d.image;
	  } else {
		return d.sizes?.large?.url || d.sizes?.medium?.url || d.sizes?.small?.url || d.image;
	  }
	};

  // Auto-play functionality
	const startAutoPlay = () => {
	  if (refs.current.isAutoPlaying) return;

	  // Find all featured nodes
	  if (refs.current.featuredNodes.length === 0) {
		collectFeaturedNodes(refs.current.nodes);
	  }

	  if (refs.current.featuredNodes.length === 0) return;

	  refs.current.isAutoPlaying = true;
	  autoPlayNext();
	};

	const stopAutoPlay = () => {
	  refs.current.isAutoPlaying = false;
	  refs.current.currentFeaturedIndex = 0;
	};

	const autoPlayNext = () => {
	  if (!refs.current.isAutoPlaying) return;

	  const featuredNodes = refs.current.featuredNodes;
	  if (featuredNodes.length === 0) return;

	  const index = refs.current.currentFeaturedIndex;
	  const nextNode = featuredNodes[index];

	  // Zoom to this node - using the stored zoomToNode function
	  if (refs.current.zoomToNode) {
		refs.current.zoomToNode(nextNode);
	  }

	  // Schedule next zoom out and then zoom to next featured
	  setTimeout(() => {
		if (!refs.current.isAutoPlaying) return;

		// Zoom out to parent
		if (nextNode.parent && refs.current.zoomToNode) {
		  refs.current.zoomToNode(nextNode.parent);
		}

		// Update index for next time
		refs.current.currentFeaturedIndex = (index + 1) % featuredNodes.length;

		// Schedule next zoom in
		setTimeout(() => {
		  if (refs.current.isAutoPlaying) {
			autoPlayNext();
		  }
		}, 3000);
	  }, data.settings?.autoplayInterval || 5000);
	};

  const collectFeaturedNodes = (node: TreemapNode) => {
	if (node.data.featured) {
	  refs.current.featuredNodes.push(node);
	}

	if (node.children) {
	  node.children.forEach(child => {
		collectFeaturedNodes(child);
	  });
	}
  };

  const initTreemap = () => {
	  if (!svgRef.current || !containerRef.current || !data) return;

	  const svg = d3.select(svgRef.current);
	  const width = containerRef.current.clientWidth;
	  const height = containerRef.current.clientHeight;
	  const rectPadding = window.innerWidth < 640 ? 2 : 4;

	  console.log('Treemap initialization:', {
		width,
		height,
		rectPadding,
		containerRef: containerRef.current,
		svgRef: svgRef.current
	  });

	  const gridRes = 32;
	  const transTime = 600; // CSS transition time

	  const x = d3.scaleLinear()
		.domain([0, width])
		.rangeRound([0, width + rectPadding]);

	  const y = d3.scaleLinear()
		.domain([0, height])
		.rangeRound([0, height + rectPadding]);

	  const color = d3.scaleOrdinal()
		.range(d3.schemeDark2);

	  const treemap = d3.treemap<any>()
		.size([width, height])
		.tile(d3.treemapSquarify)
		.paddingInner(0)
		.round(true);

	  // Create hierarchy with priority values instead of random
	  const nodes = d3.hierarchy(data)
		.eachBefore(d => d.data.id = (d.parent ? d.parent.data.id + "-" : "") + d.data.slug)
		.sum(d => d.image ? (d.priority || 100) : 0)
		.sort((a, b) => b.height - a.height || b.value - a.value);

	  treemap(nodes);

	  // Store nodes in ref
	  refs.current.nodes = nodes;

	  // Set initial current node
	  setCurrentNode(nodes);

	  svg
		.attr("width", width)
		.attr("height", height);

	  // Create cells
	  const cells = svg
		.selectAll("g")
		.data(nodes.descendants())
		.join("g")
		.attr("class", d => `${styles.node} ${styles['level' + d.depth]}`)
		.attr("transform", d => `translate(${x(d.x0)},${y(d.y0)})`);

	  // Add rectangles
	  cells
		.append("rect")
		.attr("id", d => d.data.id)
		//.attr("width", d => x(d.x1) - x(d.x0) - rectPadding)
		.attr("width", d => {
			const width = x(d.x1) - x(d.x0) - rectPadding;
			if (width < 0) {
			  console.log('Negative width detected:', {
				node: d.data.id,
				x0: d.x0,
				x1: d.x1,
				rectPadding,
				width,
				scaledX0: x(d.x0),
				scaledX1: x(d.x1),
				difference: x(d.x1) - x(d.x0),
				containerWidth: containerRef.current?.clientWidth
			  });
			}
			return width;
		  })
		//.attr("height", d => y(d.y1) - y(d.y0) - rectPadding)
		.attr("height", d => {
			const height = y(d.y1) - y(d.y0) - rectPadding;
			if (height < 0) {
			  console.log('Negative height detected:', {
				node: d.data.id,
				y0: d.y0,
				y1: d.y1,
				rectPadding,
				height,
				scaledY0: y(d.y0),
				scaledY1: y(d.y1),
				difference: y(d.y1) - y(d.y0),
				containerHeight: containerRef.current?.clientHeight
			  });
			}
			return height;
		  })
		.style("fill", d => {
			// If we have a category with a specific color, use it directly
			// This supports any valid CSS color format
			if (d.depth === 1 && d.data.color) {
			  return d.data.color; // Direct pass-through of CSS color value
			}

			// For sub-elements of a category, inherit the parent's color
			if (d.depth > 1 && d.parent?.data.color) {
			  return d.parent.data.color;
			}

			// Otherwise, use the D3 color scheme as fallback
			let node = d;
			while (node.depth > 1) node = node.parent;
			return color(node.data.slug);
		  });

	  // Add clip paths
	  cells
		.append("clipPath")
		.attr("id", d => "clip-" + d.data.id)
		.append("use")
		.attr("xlink:href", d => "#" + d.data.id);

	  // Add labels for level 0, 1, 2
	  cells
		.filter(d => d.depth < 3)
		.append("text")
		.attr("clip-path", d => "url(#clip-" + d.data.id + ")")
		.attr("class", styles.label)
		.attr("x", d => (x(d.x1) - x(d.x0)) / 2)
		.attr("y", d => (y(d.y1) - y(d.y0)) / 2)
		.text(d => d.data.title || "?");

	  // Add click handlers for level 0, 1, 2
	  cells
		.filter(d => d.depth < 3)
		.on("click", (event, d) => {
		  const loc = d.ancestors().map(d => d.data.slug).reverse();
		  // Construct a proper URL path that starts with a slash
		  const locURL = loc.length > 1 ? `${baseUrl}${loc.slice(1).join("/")}` : baseUrl;

		  // Update URL - ensure it starts with / to avoid the origin error
		  if (typeof window !== 'undefined') {
			window.history.pushState({}, '', locURL);
		  }

		  zoomToNode(d);
		});

	  // Add thumbnails for level 2
	  cells
		.filter(d => d.depth == 2)
		.append("svg")
		.attr("width", d => x(d.x1) - x(d.x0))
		.attr("height", d => y(d.y1) - y(d.y0))
		.append("image")
		.attr("href", d => d.data.thumb || null)
		.attr("class", styles.thumb)
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("preserveAspectRatio", "xMidYMid meet");

	  // Add images for level 3 (project images)
	  cells
		.filter(d => d.depth == 3)
		.append("svg")
		.attr("width", d => x(d.x1) - x(d.x0))
		.attr("height", d => y(d.y1) - y(d.y0))
		.append("image")
		.attr("clip-path", d => "url(#clip-" + d.data.id + ")")
		// Dynamically choose image size based on cell dimensions
		.attr("href", d => {
		  const cellWidth = x(d.x1) - x(d.x0);
		  const cellHeight = y(d.y1) - y(d.y0);
		  // Default to smallest size initially to speed up loading
		  return d.data.sizes?.thumbnail?.url || d.data.image;
		})
		.attr("class", styles.lores)
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("preserveAspectRatio", "xMidYMid slice")
		// Add lightbox click handler
		.on("click", function(event, d) {
		  const projectImages = d.parent.children || [];
		  refs.current.lightbox.open(d, projectImages);
		});

	  // Set reverse order for proper stacking
	  cells
		.each((d, i) => d.data.idx = i)
		.sort((a, b) => b.data.idx - a.data.idx);

	  // Set initial view
	  zoomToNode(nodes);

	  // Function to redraw the treemap
	  function redraw() {
		console.log("Redrawing treemap");
		zoomToNode(currentNode);
	  }

	  // Store redraw and zoom functions in refs for access elsewhere
	  refs.current.redraw = redraw;
	  refs.current.zoomToNode = zoomToNode;

	  // Zoom function
	  function zoomToNode(d: TreemapNode) {
		console.log(`Zooming to: ${d.data.slug}, depth: ${d.depth}`);

		// Update document title and metadata
		  if (typeof document !== 'undefined') {
			const siteTitle = data.settings?.siteTitle || 'Design Portfolio';
			document.title = `${d.data.title} — ${siteTitle}`;

			const metaDesc = document.head.querySelector('meta[name="description"]');
			if (metaDesc) {
			  // Use the excerpt field if available, otherwise fall back to description or title
			  const description = d.data.excerpt || d.data.desc || d.data.title || 'Design Portfolio';
			  metaDesc.setAttribute("content", description);
			}
		  }

		// Update breadcrumb
		updateBreadcrumb(d.ancestors());

		// Track current depth
		const currentDepth = d.depth;

		// Handle project info panel for level 2
		if (currentDepth === 2) {
		  // If window is wider than mobile breakpoint, auto-show info
		  if (window.innerWidth > 768) {
			// Get all images for this project
			const cImages = [];
			for (const c of d.children || []) {
			  cImages.push(c.data.id);
			}

			// Switch to high-res images
			cells
			.filter(d => cImages.includes(d.data.id))
			.selectAll("image")
			.filter(`.${styles.lores}`)
			// Use appropriately sized image based on the new cell dimensions
			.each(function(d: any) {
			  const cellDimensions = this.parentNode.getBoundingClientRect();
			  const cellWidth = cellDimensions.width;
			  const cellHeight = cellDimensions.height;

			  // Choose the appropriate size
			  const imageUrl = getAppropriateImageSize(d.data, cellWidth, cellHeight);

			  // Update image with higher resolution
			  d3.select(this)
				.attr("href", imageUrl)
				.attr("class", styles.hires);
			});

			// Show info panel
			if (showInfoRef.current) {
			  showInfoRef.current.classList.add(styles.show);
			}

			// Add info content
			if (infoWrapperRef.current) {
			  infoWrapperRef.current.innerHTML = d.data.desc || `<h1>${d.data.title}</h1>`;
			  setInfoVisible(true);
			}
		  } else {
			// On mobile, show the info toggle button
			if (showInfoRef.current) {
			  showInfoRef.current.classList.add(styles.show);

			  // Add click handler for info toggle
			  showInfoRef.current.onclick = () => {
				if (!infoVisible) {
				  if (infoWrapperRef.current) {
					infoWrapperRef.current.innerHTML = d.data.desc || `<h1>${d.data.title}</h1>`;
				  }
				  setInfoVisible(true);
				} else {
				  setInfoVisible(false);
				}

				// Re-zoom after transition completes
				setTimeout(() => {
				  zoomToNode(d);
				}, transTime + 5);
			  };
			}
		  }
		} else {
		  // Hide info panel for other levels
		  if (showInfoRef.current) {
			showInfoRef.current.classList.remove(styles.show);
		  }
		  setInfoVisible(false);
		}

		// Get dimensions
		if (!containerRef.current) return;
		const width = containerRef.current.clientWidth;
		const height = containerRef.current.clientHeight;

		// Update treemap size
		treemap.size([width, height]);

		// Update scales
		x.domain([d.x0, d.x1]).range([0, width + rectPadding]);
		y.domain([d.y0, d.y1]).range([0, height + rectPadding]);

		// Create transition
		const t = d3.transition()
		  .duration(transTime)
		  .ease(d3.easeExpInOut);

		// Apply transition to cells
		cells.transition(t)
		  .attr("transform", d => `translate(${x(d.x0)},${y(d.y0)})`)
		  .select("rect")
		  .attr("width", d => x(d.x1) - x(d.x0) - rectPadding)
		  .attr("height", d => y(d.y1) - y(d.y0) - rectPadding);

		// Update text positions
		cells.transition(t)
		  .select("text")
		  .attr("x", d => (x(d.x1) - x(d.x0)) / 2)
		  .attr("y", d => (y(d.y1) - y(d.y0)) / 2);

		// Update SVG sizes
		cells.transition(t)
		  .select("svg")
		  .attr("width", d => x(d.x1) - x(d.x0))
		  .attr("height", d => y(d.y1) - y(d.y0));

		// Hide cells not at current level or below
		cells
		  .classed(styles.hide, false); // Reset first

		// Hide all cells not directly relevant to current view
		cells.filter(d => d.depth < currentDepth)
		  .classed(styles.hide, true);

		// CHANGE 2: Make all other cells at this level transparent
		// Except for the selected cell
		cells.filter(d => d.depth === currentDepth && d !== currentNode)
		  .classed(styles.transparent, true);

		// Show cells at current level and below
		cells.filter(d => d.depth >= currentDepth && isDescendantOf(d, currentNode))
		  .classed(styles.hide, false)
		  .classed(styles.transparent, false);

		// Update current node reference
		setCurrentNode(d);
	  }

	  // Helper function to check if a node is a descendant of another
	  function isDescendantOf(node: TreemapNode, ancestor: TreemapNode | null) {
		if (!ancestor) return false;

		let current = node;
		while (current.parent) {
		  if (current.parent === ancestor) {
			return true;
		  }
		  current = current.parent;
		}
		return false;
	  }

	  // Function to update breadcrumb
	  function updateBreadcrumb(ancestors: TreemapNode[]) {
		if (!breadcrumbRef.current) return;

		const breadcrumb = d3.select(breadcrumbRef.current);

		// Clear existing content first to avoid event binding issues
		  breadcrumb.html("");

		// Create breadcrumb items
		const path = breadcrumb
		  .selectAll("h1")
		  .data(ancestors.map(d => d).reverse());

		// Remove old items
		path.exit().remove();

		// Update existing items
		path
			.html(d => d.data.title || "?");

		// Add new items
		path.enter()
		  .append("h1")
		  .html(d => d.data.title || "?")
		  .on("click", (event, d) => {
			const loc = ancestors.map(d => d.data.slug).reverse();
			// Ensure proper URL path
			const locURL = loc.length > 1 ? `${baseUrl}${loc.slice(1).join("/")}` : baseUrl;

			// Update URL with proper path
			if (typeof window !== 'undefined') {
			  window.history.pushState({}, '', locURL);
			}

			// Use the zoomToNode function from refs
			  if (refs.current.zoomToNode) {
				refs.current.zoomToNode(d);
			  }
		  });
	  }
	};

  return (
	<div className={styles.treemapContainer} ref={containerRef}>
	  {/* Show info toggle button */}
	  <div
		ref={showInfoRef}
		className={`${styles.showInfo} ${currentNode?.depth === 2 ? styles.show : ''}`}
	  >
		i
	  </div>

	  {/* Breadcrumb navigation */}
	  <nav ref={breadcrumbRef} className={styles.breadcrumb} aria-label="Breadcrumb"></nav>

	  {/* Info panel */}
	  <div className={`${styles.info} ${infoVisible ? styles.visible : ''}`}>
		<div ref={infoWrapperRef} className={styles.infoWrapper}></div>
	  </div>

	  {/* Main treemap */}
	  <svg
		ref={svgRef}
		className={`${styles.treemap} ${infoVisible ? styles.infoVisible : ''}`}
		xmlns="http://www.w3.org/2000/svg"
		version="1.1"
	  ></svg>
	</div>
  );
}