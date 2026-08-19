import { createFileRoute } from "@tanstack/react-router";
import { getAccountOrNull } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";

/**
 * Site-wide Open Graph image — the social card shown when any page is shared.
 * `src/routes/__root.tsx` points og:image here; a route overrides it by passing
 * `image` to `seo()` in its own head().
 *
 * This is a TEMPLATE styled to match the storefront: the warm light theme from
 * styles/app.css, a rounded avatar like the header, and a primary pill echoing
 * the store's buttons. The colors below are the app.css oklch tokens converted
 * to hex — Satori can't read oklch() or CSS variables, so they're inlined. If
 * you restyle the store, update these to keep the card on-brand.
 */

// app.css theme tokens (oklch → hex). Keep in sync with styles/app.css.
const COLORS = {
	background: "#FBFAF7", // --background
	foreground: "#211C16", // --foreground
	muted: "#79716A", // --muted-foreground
	border: "#E7E3DD", // --border
	primary: "#2C2620", // --primary
	primaryForeground: "#FAFAF8", // --primary-foreground
};

// 1200×630 is the universal social-card size. Keep it.
const SIZE = { width: 1200, height: 630 };

// Satori needs real font data. Fetched once per worker instance rather than per
// render — a module-level `const` would fetch at startup, which the Workers
// runtime forbids.
let fontData: Promise<ArrayBuffer> | null = null;

// Imported lazily: `workers-og` statically pulls in ~1.5MB of resvg/yoga wasm,
// and a static import here would put it in the route-tree chunk every request
// loads. Only this handler ever needs it.
const og = () => import("workers-og");

async function font(): Promise<ArrayBuffer> {
	fontData ??= og().then((m) =>
		m.loadGoogleFont({ family: "Inter", weight: 600 }),
	);
	return fontData;
}

// Strip anything the loaded font can't render. For an uncovered glyph (emoji,
// stars, arrows, non-Latin scripts) Satori fetches a fallback font at render
// time — that fetch 400s in the Cloudflare Workers runtime and 500s the whole
// card. Store name/description are user-controlled, so sanitize them.
// Keep Latin + Latin-1 + Latin Extended; map common typographic glyphs to ASCII.
function ogSafe(text: string): string {
	return text
		.replace(/[‘’‚‛]/g, "'")
		.replace(/[“”„‟]/g, '"')
		.replace(/[–—―]/g, "-")
		.replace(/…/g, "...")
		.replace(/[→➡]/g, "->")
		.replace(/[^ -ɏ\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

export const Route = createFileRoute("/api/og")({
	server: {
		handlers: {
			GET: async () => {
				const { ImageResponse } = await og();
				// Reuse the same cached loader the pages use — no extra API round-trips.
				const account = await getAccountOrNull();

				const name = ogSafe(account?.name ?? "") || "Crevio";
				// TEMPLATE: swap `description` for a fixed tagline if you want the same
				// line on every share (e.g. "The easiest way to sell what you make").
				const tagline = ogSafe(account?.description ?? "");
				const host = ogSafe(getAppUrl().replace(/^https?:\/\//, ""));

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
							fontFamily: "Inter",
						}}
					>
						{/* Top row: avatar + name, mirroring the storefront header. */}
						<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
							{account?.avatarUrl ? (
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

						{/* Headline. TEMPLATE: this is the line that sells the click — make
						    it the strongest value proposition of what this site offers. */}
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
							<div
								style={{ display: "flex", fontSize: 24, color: COLORS.muted }}
							>
								{host}
							</div>
						</div>
					</div>,
					{
						...SIZE,
						fonts: [
							{
								name: "Inter",
								data: await font(),
								weight: 600,
								style: "normal",
							},
						],
					},
				);
			},
		},
	},
});
