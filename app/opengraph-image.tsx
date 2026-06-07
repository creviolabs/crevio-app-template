import { ImageResponse } from "next/og";
import { getAccount } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";

/**
 * Site-wide Open Graph image — the social card shown when any page is shared,
 * unless a more specific `opengraph-image` overrides it deeper in the tree
 * (e.g. app/blog/[slug]/opengraph-image.tsx for per-post cards).
 *
 * This is a TEMPLATE styled to match the storefront: the warm light theme from
 * app/app.css, a rounded avatar like the header, and a primary pill echoing the
 * store's buttons. The colors below are the app.css oklch tokens converted to
 * hex — Satori can't read oklch() or CSS variables, so they're inlined. If you
 * restyle the store, update these to keep the card on-brand.
 */

// app.css theme tokens (oklch → hex). Keep in sync with app/app.css.
const COLORS = {
	background: "#FBFAF7", // --background
	foreground: "#211C16", // --foreground
	muted: "#79716A", // --muted-foreground
	border: "#E7E3DD", // --border
	primary: "#2C2620", // --primary
	primaryForeground: "#FAFAF8", // --primary-foreground
};

// 1200×630 is the universal social-card size. Keep it.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Falls back to og:image for platforms without their own card. Override per
// route by exporting `alt` from a deeper opengraph-image file.
export const alt = "Social sharing image";

export default async function Image() {
	// Reuse the same cached loader the pages use — no extra API round-trips.
	const account = await getAccount().catch(() => null);

	const name = account?.name ?? "Crevio";
	// TEMPLATE: swap `description` for a fixed tagline if you want the same line
	// on every share (e.g. "The easiest way to sell what you make").
	const tagline = account?.description ?? "";
	const host = getAppUrl().replace(/^https?:\/\//, "");

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: 72,
				background: COLORS.background,
				color: COLORS.foreground,
				// TEMPLATE: the store uses Geist. Satori can't parse the bundled
				// woff2, so this falls back to a neutral sans. To use Geist exactly,
				// fetch a Geist .woff/.ttf and pass it via the `fonts` option below.
				fontFamily: "system-ui, sans-serif",
			}}
		>
			{/* Top row: avatar + name, mirroring the storefront header. */}
			<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
				{account?.avatarUrl ? (
					// biome-ignore lint/performance/noImgElement: Satori/ImageResponse only renders plain <img>, not next/image.
					<img
						src={account.avatarUrl}
						width={56}
						height={56}
						style={{ borderRadius: 999, objectFit: "cover" }}
						alt=""
					/>
				) : null}
				<div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
					{name}
				</div>
			</div>

			{/* Headline. TEMPLATE: this is the line that sells the click — make it
			    the strongest value proposition of what this site offers. */}
			<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
				<div
					style={{
						display: "flex",
						fontSize: 72,
						fontWeight: 700,
						lineHeight: 1.05,
						letterSpacing: -1.5,
						maxWidth: 960,
					}}
				>
					{tagline || name}
				</div>
				{tagline ? (
					<div
						style={{
							display: "flex",
							fontSize: 28,
							color: COLORS.muted,
							lineHeight: 1.35,
							maxWidth: 880,
						}}
					>
						{name}
					</div>
				) : null}
			</div>

			{/* Footer: a primary pill (echoes the store's buttons) + the domain,
			    separated from the content by a hairline like the header border. */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					paddingTop: 32,
					borderTop: `1px solid ${COLORS.border}`,
				}}
			>
				<div
					style={{
						display: "flex",
						background: COLORS.primary,
						color: COLORS.primaryForeground,
						fontSize: 24,
						fontWeight: 600,
						padding: "14px 28px",
						borderRadius: 10,
					}}
				>
					Shop now
				</div>
				<div style={{ display: "flex", fontSize: 24, color: COLORS.muted }}>
					{host}
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
