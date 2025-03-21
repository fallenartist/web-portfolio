// D3.js Treemap Node Types
export interface TreemapNode {
  data: {
	id: string;
	slug: string;
	title: string;
	desc?: string;
	thumb?: string;
	image?: string;
	priority?: number;
	featured?: boolean;
	children?: TreemapNode[];
	idx?: number; // Used for sorting
  };
  depth: number;
  height: number;
  parent: TreemapNode | null;
  value: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  children?: TreemapNode[];
  ancestors(): TreemapNode[];
  descendants(): TreemapNode[];
}

// Lightbox types
export interface LightboxImage {
  data: {
	id: string;
	title?: string;
	image: string;
	desc?: string;
	tags?: string;
  };
}

export interface LightboxOptions {
  containerSelector?: string;
  imagePathPrefix?: string;
  transitionDuration?: number;
  dragThreshold?: number;
  preloadImages?: boolean;
  doubleTapDelay?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface LightboxInterface {
  open: (clickedImage: LightboxImage, allImages: LightboxImage[]) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setImages: (imgArray: LightboxImage[]) => void;
}