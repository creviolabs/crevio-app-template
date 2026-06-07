"use client";

import Image from "next/image";
import { useState } from "react";
import { embedUrl, isExternalVideo, isVideoMedia } from "@/lib/media";

type Media = { url: string; type: string };

// One media item. Videos MUST use <video> — a video blob in <Image> renders blank.
function Frame({
	item,
	alt,
	hero,
}: {
	item: Media;
	alt: string;
	hero?: boolean;
}) {
	if (isExternalVideo(item)) {
		const src = embedUrl(item);
		if (!src) return null;
		return (
			<iframe
				src={src}
				title={alt || "Video"}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
				className={`size-full ${hero ? "" : "pointer-events-none"}`}
			/>
		);
	}
	if (isVideoMedia(item)) {
		return (
			<video
				key={item.url}
				src={item.url}
				controls={hero}
				muted={!hero}
				playsInline
				preload="metadata"
				className={`size-full ${hero ? "object-contain bg-black" : "object-cover"}`}
			>
				<track kind="captions" />
			</video>
		);
	}
	return (
		<Image
			src={item.url}
			alt={alt}
			width={hero ? 1200 : 64}
			height={hero ? 900 : 64}
			priority={hero}
			sizes={hero ? "(min-width: 1024px) 50vw, 100vw" : "64px"}
			className="size-full object-cover"
		/>
	);
}

export function ProductImageGallery({
	media,
	productName,
}: {
	media: Media[];
	productName: string;
}) {
	const [selected, setSelected] = useState(0);
	const current = media[selected];

	return (
		<>
			<div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
				{current ? (
					<Frame item={current} alt={productName} hero />
				) : (
					<span className="absolute inset-0 flex items-center justify-center text-6xl font-extralight text-muted-foreground/15 select-none">
						{productName.charAt(0)}
					</span>
				)}
			</div>

			{media.length > 1 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{media.map((item, idx) => (
						<button
							key={item.url}
							type="button"
							onClick={() => setSelected(idx)}
							className={`shrink-0 size-16 overflow-hidden rounded-lg bg-muted transition-opacity ${idx === selected ? "ring-2 ring-foreground/20" : "opacity-60 hover:opacity-100"}`}
						>
							<Frame item={item} alt="" />
						</button>
					))}
				</div>
			)}
		</>
	);
}
