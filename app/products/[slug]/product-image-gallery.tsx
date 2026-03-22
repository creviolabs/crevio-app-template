"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageGalleryProps {
	images: Array<{ url: string; type: string }>;
	productName: string;
}

export function ProductImageGallery({
	images,
	productName,
}: ProductImageGalleryProps) {
	const [selectedImage, setSelectedImage] = useState(0);
	const currentImage = images[selectedImage];

	return (
		<>
			{currentImage ? (
				<div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
					<Image
						src={currentImage.url}
						alt={productName}
						fill
						className="object-cover"
					/>
				</div>
			) : (
				<div className="aspect-4/3 rounded-xl bg-muted flex items-center justify-center">
					<span className="text-6xl font-extralight text-muted-foreground/15 select-none">
						{productName.charAt(0)}
					</span>
				</div>
			)}

			{/* Thumbnail strip */}
			{images.length > 1 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{images.map((img, idx) => (
						<button
							key={img.url}
							type="button"
							onClick={() => setSelectedImage(idx)}
							className={`relative shrink-0 size-16 rounded-lg overflow-hidden bg-muted transition-opacity ${
								idx === selectedImage
									? "ring-2 ring-foreground/20"
									: "opacity-60 hover:opacity-100"
							}`}
						>
							<Image src={img.url} alt="" fill className="object-cover" />
						</button>
					))}
				</div>
			)}
		</>
	);
}
