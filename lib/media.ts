import type { MediaGalleryItem } from "@crevio/sdk/models";

export function isImageMedia(item: MediaGalleryItem) {
	return item.type !== "external/youtube" && item.type !== "external/vimeo";
}
