/**
 * D3 Lightbox - Improved version
 *
 * Features:
 * - Mobile touch gestures (swipe, pinch-zoom)
 * - Elastic pinch zoom with natural panning
 * - Image captions, infinite looping
 * - No controls on mobile
 * - No double-click on desktop
 */

import * as d3 from 'd3';
import type { LightboxOptions, LightboxInterface, LightboxImage } from '../types';

export function createD3Lightbox(options: LightboxOptions = {}): LightboxInterface {
  // Configuration with defaults
  const config = {
	containerSelector: options.containerSelector || 'body',
	imagePathPrefix: options.imagePathPrefix || '/img/',
	transitionDuration: options.transitionDuration || 400,
	dragThreshold: options.dragThreshold || 100,
	preloadImages: options.preloadImages !== false,
	doubleTapDelay: options.doubleTapDelay || 100, // Reduced delay for mobile touch
	minZoom: options.minZoom || 0.5,  // Minimum zoom level
	maxZoom: options.maxZoom || 5     // Maximum zoom level
  };

  // Create/select lightbox container and add a class for static styles
  const container = d3.select(config.containerSelector);
  let box = container.select("#lightbox");
  if (box.empty()) {
	box = container.append("div").attr("id", "lightbox");
  }
  // Use CSS (SCSS) for static styling; only dynamic changes will be applied in JS.
  box.classed("active", false);

  // Create/select image container
  let imageContainer = box.select(".lightbox-image-container");
  if (imageContainer.empty()) {
	imageContainer = box.append("div").attr("class", "lightbox-image-container");
  }

  // Create/select navigation controls container
  let controls = box.select(".lightbox-controls");
  if (controls.empty()) {
	controls = box.append("div").attr("class", "lightbox-controls");
  }

  // Append Close button if not present
  if (controls.select(".lightbox-close").empty()) {
	controls.append("button")
	  .attr("class", "lightbox-close")
	  .text("×")
	  .on("click", closeLightbox);
  }

  // Append Prev button if not present
  if (box.select(".lightbox-prev").empty()) {
	box.append("button")
	  .attr("class", "lightbox-prev")
	  .text("‹")
	  .on("click", function(event) {
		event.stopPropagation();
		transitionToImage((currentIndex > 0 ? currentIndex - 1 : images.length - 1), 'prev');
	  });
  }

  // Append Next button if not present
  if (box.select(".lightbox-next").empty()) {
	box.append("button")
	  .attr("class", "lightbox-next")
	  .text("›")
	  .on("click", function(event) {
		event.stopPropagation();
		transitionToImage((currentIndex < images.length - 1 ? currentIndex + 1 : 0), 'next');
	  });
  }

  // State variables
  let images: LightboxImage[] = [];
  let currentIndex = 0;
  let startX: number, startY: number, currentX: number, currentY: number;
  let lastTapTime = 0;
  let isDragging = false;
  let transformX = 0;
  // Current transform state
  let currentScale = 1;
  let currentTranslateX = 0;
  let currentTranslateY = 0;
  const isMobile = typeof window !== 'undefined' ?
	('ontouchstart' in window || navigator.maxTouchPoints > 0) : false;

  // Hide controls on mobile
  if (isMobile) {
	controls.style("display", "none");
	box.select(".lightbox-prev").style("display", "none");
	box.select(".lightbox-next").style("display", "none");
  } else {
	// Show UI on mouse movement (desktop only)
	box.on("mousemove", function() {
	  controls.style("opacity", "0.7");
	  box.select(".lightbox-prev").style("opacity", "0.7");
	  box.select(".lightbox-next").style("opacity", "0.7");
	  clearTimeout(box.property("hideTimeout"));
	  box.property("hideTimeout", setTimeout(() => {
		controls.style("opacity", "0");
		box.select(".lightbox-prev").style("opacity", "0");
		box.select(".lightbox-next").style("opacity", "0");
	  }, 2000));
	});
  }

  // Touch event handling
  imageContainer.on("touchstart", function(event) {
	// Get touch position
	const touch = event.touches[0];
	startX = touch.clientX;
	startY = touch.clientY;
	currentX = touch.clientX;
	currentY = touch.clientY;

	// Check for pinch zoom (two fingers)
	if (event.touches.length === 2) {
	  event.preventDefault();

	  const img = imageContainer.select("img");
	  const imgNode = img.node();
	  if (!imgNode) return;

	  // Get current transform state
	  const transform = img.style("transform") || '';
	  const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
	  currentScale = scaleMatch && scaleMatch[1] ? parseFloat(scaleMatch[1]) : 1;

	  // Get initial distance between fingers
	  const dx = event.touches[0].clientX - event.touches[1].clientX;
	  const dy = event.touches[0].clientY - event.touches[1].clientY;
	  const initialDistance = Math.sqrt(dx * dx + dy * dy);

	  // Set transform origin to midpoint between touches
	  const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
	  const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
	  const imgRect = imgNode.getBoundingClientRect();

	  // Calculate relative to image position
	  const relativeX = ((centerX - imgRect.left) / imgRect.width) * 100;
	  const relativeY = ((centerY - imgRect.top) / imgRect.height) * 100;

	  // Only update transform origin when starting a fresh pinch
	  if (!img.classed("zoomed")) {
		img.style("transform-origin", `${relativeX}% ${relativeY}%`);
	  }

	  // Extract current translation if any
	  const translateMatch = transform.match(/translate\(([0-9.-]+)px,\s*([0-9.-]+)px\)/);
	  if (translateMatch) {
		currentTranslateX = parseFloat(translateMatch[1]);
		currentTranslateY = parseFloat(translateMatch[2]);
	  }

	  // Touch move handler for pinch zoom
	  const touchMoveHandler = function(moveEvent: TouchEvent) {
		if (moveEvent.touches.length !== 2) return;
		moveEvent.preventDefault();

		const mdx = moveEvent.touches[0].clientX - moveEvent.touches[1].clientX;
		const mdy = moveEvent.touches[0].clientY - moveEvent.touches[1].clientY;
		const newDistance = Math.sqrt(mdx * mdx + mdy * mdy);
		let scaleFactor = (newDistance / initialDistance) * currentScale;

		// Apply constraints but allow elastic overscroll
		if (scaleFactor < config.minZoom) {
		  // Allow elastic zoom out (slower as it gets smaller)
		  const elasticFactor = 0.5 + 0.5 * (scaleFactor / config.minZoom);
		  scaleFactor = config.minZoom * elasticFactor;
		} else if (scaleFactor > config.maxZoom) {
		  // Allow elastic zoom in (slower as it gets larger)
		  const elasticFactor = 1 - 0.5 * (1 - config.maxZoom / scaleFactor);
		  scaleFactor = config.maxZoom * elasticFactor;
		}

		// Apply transform immediately
		img.style("transition", "none")
		   .style("transform", `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${scaleFactor})`);
	  };

	  // Touch end handler for pinch zoom
	  const touchEndHandler = function() {
		d3.select(window).on("touchmove.pinchzoom", null);
		d3.select(window).on("touchend.pinchzoom", null);

		const transform = img.style("transform") || '';
		const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
		let finalScale = scaleMatch && scaleMatch[1] ? parseFloat(scaleMatch[1]) : 1;

		// Extract current translation
		const translateMatch = transform.match(/translate\(([0-9.-]+)px,\s*([0-9.-]+)px\)/);
		if (translateMatch) {
		  currentTranslateX = parseFloat(translateMatch[1]);
		  currentTranslateY = parseFloat(translateMatch[2]);
		}

		// Apply natural constraints
		if (finalScale < config.minZoom * 1.1) {
		  // Snap back to normal size if pinched out too far
		  img.style("transition", `transform ${config.transitionDuration / 2}ms cubic-bezier(0.2, 0, 0.1, 1)`)
			.style("transform", "translate(0, 0) scale(1)")
			.style("transform-origin", "center center")
			.classed("zoomed", false);

		  // Reset transform state
		  currentScale = 1;
		  currentTranslateX = 0;
		  currentTranslateY = 0;
		} else if (finalScale > config.maxZoom * 0.9) {
		  // Constrain to max zoom if stretched too far
		  img.style("transition", `transform ${config.transitionDuration / 2}ms cubic-bezier(0.2, 0, 0.1, 1)`)
			.style("transform", `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${config.maxZoom})`);

		  currentScale = config.maxZoom;
		  img.classed("zoomed", true);

		  // Constrain panning after zoom settles
		  setTimeout(constrainPanning, config.transitionDuration / 2);
		} else {
		  // Update current scale and maintain zoom state
		  currentScale = finalScale;
		  img.classed("zoomed", finalScale > 1.1);

		  // Constrain panning
		  constrainPanning();
		}
	  };

	  // Set up handlers
	  d3.select(window).on("touchmove.pinchzoom", touchMoveHandler as any);
	  d3.select(window).on("touchend.pinchzoom", touchEndHandler as any);
	  return;
	}

	// Single touch - handle swipe or double tap
	const currentTime = new Date().getTime();
	const tapLength = currentTime - lastTapTime;
	lastTapTime = currentTime;

	// Check for double tap
	if (tapLength < config.doubleTapDelay && tapLength > 0) {
	  event.preventDefault();

	  const img = imageContainer.select("img");
	  if (img.empty()) return;

	  const transform = img.style("transform") || '';
	  const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
	  currentScale = scaleMatch && scaleMatch[1] ? parseFloat(scaleMatch[1]) : 1;

	  if (currentScale > 1.2) {
		// Zoom out
		img.style("transition", `transform ${config.transitionDuration / 2}ms cubic-bezier(0.2, 0, 0.1, 1)`)
		  .style("transform", "translate(0, 0) scale(1)")
		  .style("transform-origin", "center center")
		  .classed("zoomed", false);

		// Reset transform state
		currentScale = 1;
		currentTranslateX = 0;
		currentTranslateY = 0;
	  } else {
		// Zoom in at tap position
		const imgRect = img.node()!.getBoundingClientRect();
		const touch = event.touches[0];
		const originX = ((touch.clientX - imgRect.left) / imgRect.width) * 100;
		const originY = ((touch.clientY - imgRect.top) / imgRect.height) * 100;

		img.style("transform-origin", `${originX}% ${originY}%`)
		  .style("transition", `transform ${config.transitionDuration / 2}ms cubic-bezier(0.2, 0, 0.1, 1)`)
		  .style("transform", "translate(0, 0) scale(2)")
		  .classed("zoomed", true);

		// Update transform state
		currentScale = 2;
		currentTranslateX = 0;
		currentTranslateY = 0;
	  }
	} else {
	  // Setup for potential swipe
	  isDragging = true;
	  transformX = 0;
	  const img = imageContainer.select("img");
	  img.style("transition", "none");

	  // Get current transform state
	  const transform = img.style("transform") || '';
	  const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
	  currentScale = scaleMatch && scaleMatch[1] ? parseFloat(scaleMatch[1]) : 1;

	  // Extract current translation if zoomed
	  if (img.classed("zoomed")) {
		const translateMatch = transform.match(/translate\(([0-9.-]+)px,\s*([0-9.-]+)px\)/);
		if (translateMatch) {
		  currentTranslateX = parseFloat(translateMatch[1]);
		  currentTranslateY = parseFloat(translateMatch[2]);
		}
	  }
	}
  });

  // Direct touchmove handler for swipe/pan
  imageContainer.on("touchmove", function(event) {
	if (!isDragging) return;
	event.preventDefault();

	const touch = event.touches[0];
	currentX = touch.clientX;
	currentY = touch.clientY;

	transformX = currentX - startX;
	const transformY = currentY - startY;

	const img = imageContainer.select("img");

	if (img.classed("zoomed")) {
	  // Handle panning when zoomed
	  // Calculate new translation
	  let newX = currentTranslateX + transformX;
	  let newY = currentTranslateY + transformY;

	  // Apply transform with current scale
	  img.style("transform", `translate(${newX}px, ${newY}px) scale(${currentScale})`);

	  // Update start position for next move
	  startX = currentX;
	  startY = currentY;
	  currentTranslateX = newX;
	  currentTranslateY = newY;
	  return;
	}

	// Handle swiping when not zoomed
	if (Math.abs(transformX) > Math.abs(transformY)) {
	  // Horizontal swipe - for changing images
	  img.style("transform", `translateX(${transformX}px)`);

	  // Add resistance at the edges
	  if ((currentIndex === 0 && transformX > 0) || (currentIndex === images.length - 1 && transformX < 0)) {
		img.style("transform", `translateX(${transformX * 0.7}px)`);
	  }
	} else {
	  // Vertical swipe - for closing lightbox
	  img.style("transform", `translateY(${transformY}px)`);
	  const opacity = Math.max(0, 1 - Math.abs(transformY) / (config.dragThreshold * 2));
	  img.style("opacity", opacity.toString());
	}
  });

  // Direct touchend handler for swipe/pan completion
  imageContainer.on("touchend", function(event) {
	if (!isDragging) return;

	const img = imageContainer.select("img");

	if (img.classed("zoomed")) {
	  // When zoomed, constrain panning
	  constrainPanning();
	  isDragging = false;
	  return;
	}

	// Handle swipe gestures for image navigation and closing
	img.style("transition", `transform ${config.transitionDuration}ms cubic-bezier(0.2, 0, 0.1, 1), opacity ${config.transitionDuration}ms ease`);

	const deltaX = currentX - startX;
	const deltaY = currentY - startY;

	if (Math.abs(deltaX) > Math.abs(deltaY)) {
	  // Horizontal swipe (next/previous image)
	  if (Math.abs(deltaX) >= config.dragThreshold) {
		if (deltaX > 0) {
		  // Swipe right - previous image
		  img.style("transform", `translateX(100%)`)
			.style("opacity", "0");
		  transitionToImage((currentIndex > 0 ? currentIndex - 1 : images.length - 1), 'prev');
		} else {
		  // Swipe left - next image
		  img.style("transform", `translateX(-100%)`)
			.style("opacity", "0");
		  transitionToImage((currentIndex < images.length - 1 ? currentIndex + 1 : 0), 'next');
		}
	  } else {
		// Not enough swipe distance - reset position
		img.style("transform", "translateX(0)")
		  .style("opacity", "1");
	  }
	} else if (Math.abs(deltaY) > config.dragThreshold) {
	  // Vertical swipe - close lightbox
	  img.style("transform", `translateY(${deltaY > 0 ? "100%" : "-100%"})`)
		.style("opacity", "0");
	  setTimeout(closeLightbox, config.transitionDuration / 2);
	} else {
	  // Not enough swipe distance - reset position
	  img.style("transform", "translateX(0)")
		.style("opacity", "1");
	}

	isDragging = false;
  });

  // Helper function to constrain panning within boundaries
  function constrainPanning() {
	const img = imageContainer.select("img");
	if (!img.node() || !img.classed("zoomed")) return;

	// Get current transform
	const transform = img.style("transform") || '';
	const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
	currentScale = scaleMatch && scaleMatch[1] ? parseFloat(scaleMatch[1]) : 1;

	// Extract current translation
	const translateMatch = transform.match(/translate\(([0-9.-]+)px,\s*([0-9.-]+)px\)/);
	if (translateMatch) {
	  currentTranslateX = parseFloat(translateMatch[1]);
	  currentTranslateY = parseFloat(translateMatch[2]);
	}

	// Calculate boundaries
	const imgRect = img.node()!.getBoundingClientRect();
	const containerRect = imageContainer.node()!.getBoundingClientRect();

	// Calculate the image's natural dimensions at current scale
	const imgNaturalWidth = imgRect.width / currentScale;
	const imgNaturalHeight = imgRect.height / currentScale;

	// Calculate how much the image overflows the container
	const overflowX = (imgNaturalWidth * currentScale - containerRect.width) / 2;
	const overflowY = (imgNaturalHeight * currentScale - containerRect.height) / 2;

	// Calculate maximum allowed translation
	let maxX = Math.max(0, overflowX / currentScale);
	let maxY = Math.max(0, overflowY / currentScale);

	// Constrain current translation
	let adjustedX = currentTranslateX;
	let adjustedY = currentTranslateY;

	if (maxX > 0) {
	  adjustedX = Math.max(-maxX, Math.min(maxX, currentTranslateX));
	} else {
	  adjustedX = 0;
	}

	if (maxY > 0) {
	  adjustedY = Math.max(-maxY, Math.min(maxY, currentTranslateY));
	} else {
	  adjustedY = 0;
	}

	// Apply constraints with animation if needed
	if (adjustedX !== currentTranslateX || adjustedY !== currentTranslateY) {
	  img.style("transition", `transform ${config.transitionDuration / 3}ms cubic-bezier(0.2, 0, 0.1, 1)`)
		.style("transform", `translate(${adjustedX}px, ${adjustedY}px) scale(${currentScale})`);

	  currentTranslateX = adjustedX;
	  currentTranslateY = adjustedY;
	}
  }

  // Keyboard navigation
  if (typeof window !== 'undefined') {
	d3.select("body").on("keydown.lightbox", function(event) {
	  if (box.style("opacity") === "0") return;
	  switch (event.key) {
		case "Escape":
		  closeLightbox();
		  break;
		case "ArrowLeft":
		  transitionToImage((currentIndex > 0 ? currentIndex - 1 : images.length - 1), 'prev');
		  break;
		case "ArrowRight":
		  transitionToImage((currentIndex < images.length - 1 ? currentIndex + 1 : 0), 'next');
		  break;
	  }
	});
  }

  // Helper: Transition to a new image (for prev/next)
  function transitionToImage(newIndex: number, direction: 'prev' | 'next') {
	if (imageContainer.select("img").empty()) return;
	const currentImg = imageContainer.select("img");
	const newImgData = images[newIndex];
	const offset = direction === 'prev' ? -100 : 100;
	const newImg = imageContainer.append("img")
	  .attr("src", config.imagePathPrefix + newImgData.data.image)
	  .attr("alt", newImgData.data.title || "Image")
	  .style("max-width", isMobile ? "100%" : "90%")
	  .style("max-height", isMobile ? "100%" : "90%")
	  .style("object-fit", "contain")
	  .style("position", "absolute")
	  .style("opacity", "0")
	  .style("transform", `translateX(${offset}%)`)
	  .style("transition", `transform ${config.transitionDuration}ms cubic-bezier(0.2, 0, 0.1, 1), opacity ${config.transitionDuration}ms ease`)
	  .on("click", function(event) {
		event.stopPropagation();
	  });
	void newImg.node()!.offsetWidth;
	newImg.style("transform", "translateX(0)")
	  .style("opacity", "1");
	currentImg.style("transform", `translateX(${-offset}%)`)
	  .style("opacity", "0");
	setTimeout(() => {
	  currentImg.remove();
	  currentIndex = newIndex;
	  showCaption(newImgData);
	  if (config.preloadImages) preloadAdjacentImages();

	  // Reset transform state for new image
	  currentScale = 1;
	  currentTranslateX = 0;
	  currentTranslateY = 0;
	}, config.transitionDuration);
  }

  // Update image when lightbox opens
  function updateImage() {
	imageContainer.selectAll("img").remove();
	const imageData = images[currentIndex];
	const img = imageContainer.append("img")
	  .attr("src", config.imagePathPrefix + imageData.data.image)
	  .attr("alt", imageData.data.title || "Image")
	  .style("max-width", isMobile ? "100%" : "90%")
	  .style("max-height", isMobile ? "100%" : "90%")
	  .style("object-fit", "contain")
	  .style("transform", "translateX(0)")
	  .style("transform-origin", "center center")
	  .style("opacity", "0")
	  .style("transition", `opacity ${config.transitionDuration}ms ease, transform ${config.transitionDuration}ms cubic-bezier(0.2, 0, 0.1, 1)`)
	  .on("click", function(event) {
		event.stopPropagation();
	  });
	img.on("load", function() {
	  d3.select(this).style("opacity", "1");
	  showCaption(imageData);
	});
	updateNavigationVisibility();

	// Reset transform state for new image
	currentScale = 1;
	currentTranslateX = 0;
	currentTranslateY = 0;
  }

  function updateNavigationVisibility() {
	if (!isMobile) {
	  box.select(".lightbox-prev").style("visibility", "visible");
	  box.select(".lightbox-next").style("visibility", "visible");
	}
  }

  function showCaption(imageData: LightboxImage) {
	const captionText = imageData.data.title || "";
	imageContainer.select(".image-caption").remove();
	if (captionText) {
	  const caption = imageContainer.append("div")
		.attr("class", "image-caption")
		.text(captionText);
	  // Animate caption entry after a short delay
	  setTimeout(() => {
		caption.style("opacity", "1")
		  .style("transform", "translateY(0)");
	  }, 100);
	}
  }

  function preloadAdjacentImages() {
	let preloadContainer = box.select(".preload-container");
	if (preloadContainer.empty()) {
	  preloadContainer = box.append("div").attr("class", "preload-container").style("display", "none");
	}
	preloadContainer.selectAll("*").remove();
	if (currentIndex > 0) {
	  preloadContainer.append("img")
		.attr("src", config.imagePathPrefix + images[currentIndex - 1].data.image);
	}
	if (currentIndex < images.length - 1) {
	  preloadContainer.append("img")
		.attr("src", config.imagePathPrefix + images[currentIndex + 1].data.image);
	}
  }

  function closeLightbox() {
	box.classed("active", false);
	d3.select("body").style("overflow", "auto")
	  .style("will-change", "auto");
	setTimeout(() => {
	  imageContainer.selectAll("img").remove();
	  imageContainer.select(".image-caption").remove();
	}, config.transitionDuration);
  }

  // Public API
  return {
	open: openLightbox,
	close: closeLightbox,
	next: () => transitionToImage((currentIndex < images.length - 1 ? currentIndex + 1 : 0), 'next'),
	prev: () => transitionToImage((currentIndex > 0 ? currentIndex - 1 : images.length - 1), 'prev'),
	setImages: function(imgArray: LightboxImage[]) { images = imgArray; }
  };

  function openLightbox(clickedImage: LightboxImage, allImages: LightboxImage[]) {
	images = allImages;
	currentIndex = images.findIndex(img => img.data.id === clickedImage.data.id);
	if (currentIndex === -1) currentIndex = 0;
	box.classed("active", true);
	d3.select("body").style("will-change", "transform")
	  .style("overflow", "hidden");
	updateImage();
	if (config.preloadImages) preloadAdjacentImages();
  }
}