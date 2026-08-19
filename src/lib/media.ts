import type { MediaGalleryItem } from "@crevio/sdk/models";

// The SDK types `type` as a plain string (it's an open-ended content-type:
// "image/png", "video/mp4", …) or "external/{youtube,vimeo,wistia}" for embeds.
// `url` is the public file URL, or the raw watch URL for external embeds.
// Tied to the SDK shape (minus `id`) so it can't silently drift if the SDK changes.
type Media = Pick<MediaGalleryItem, "type" | "url">;

export function isImageMedia(item: Media) {
	return item.type.startsWith("image/");
}

// Natively-hosted video (uploaded or AI-generated). Must render with a <video>
// element — an <img> pointed at a video blob shows a blank box.
export function isVideoMedia(item: Media) {
	return item.type.startsWith("video/");
}

// Embedded YouTube/Vimeo/Wistia link. Renders as an <iframe> via embedUrl().
export function isExternalVideo(item: Media) {
	return item.type.startsWith("external/");
}

// Everything the gallery can render inline: hosted images/videos, plus embeds
// we can actually build an iframe src for (skips blank/unknown providers).
export function isDisplayableMedia(item: Media) {
	if (isImageMedia(item) || isVideoMedia(item)) return true;
	return isExternalVideo(item) && embedUrl(item) !== null;
}

// Turns an external video's watch URL into an embeddable iframe src.
// Returns null if the type isn't external or the id can't be parsed.
export function embedUrl(item: Media): string | null {
	if (item.type === "external/youtube") {
		const id =
			item.url.match(/youtu\.be\/([^?&]+)/)?.[1] ??
			item.url.match(/(?:v=|embed\/)([^?&]+)/)?.[1];
		return id ? `https://www.youtube.com/embed/${id}` : null;
	}
	if (item.type === "external/vimeo") {
		const id = item.url.match(/vimeo\.com\/(\d+)/)?.[1];
		return id ? `https://player.vimeo.com/video/${id}` : null;
	}
	if (item.type === "external/wistia") {
		const id = item.url.match(/wistia\.com\/medias\/([a-z0-9]+)/i)?.[1];
		return id ? `https://fast.wistia.net/embed/iframe/${id}` : null;
	}
	return null;
}
