import type { PriceVariant, Product } from "@crevio/sdk/models";
import Image from "next/image";
import { crevio } from "@/lib/crevio";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(variant: PriceVariant): string {
	if (!variant.amount || variant.amount === 0) return "Free";
	const amount = variant.amount / 100;
	const currency = (variant.currency ?? "usd").toUpperCase();
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
		amount,
	);
}

function billingLabel(variant: PriceVariant): string {
	if (variant.billingType === "subscription") return "/ mo";
	return "";
}

// The API returns experiences nested in priceVariants but the SDK PriceVariant type is simplified
interface PriceVariantWithExperiences extends PriceVariant {
	experiences?: Array<{ typeForDisplay?: string }>;
}

function productType(product: Product): string {
	const variant = product.priceVariants?.[0] as
		| PriceVariantWithExperiences
		| undefined;
	return variant?.experiences?.[0]?.typeForDisplay ?? "Product";
}

function productImageSrc(product: Product): string | null {
	const images = (
		product as Product & { galleryImages?: { id: string; url: string }[] }
	).galleryImages;
	return images?.[0]?.url ?? null;
}

// ─── Components ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
	const colors: Record<string, string> = {
		Course: "#065f46",
		"Digital Download": "#1e3a5f",
		Link: "#3b1f5e",
		Embed: "#4a1f3a",
	};
	const bg = colors[type] ?? "#1a2f1f";
	return (
		<span
			style={{
				display: "inline-block",
				padding: "2px 8px",
				borderRadius: 4,
				fontSize: 10,
				fontWeight: 700,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				background: bg,
				color: "#34d399",
				border: "1px solid rgba(52,211,153,0.15)",
			}}
		>
			{type}
		</span>
	);
}

function ProductCard({ product, index }: { product: Product; index: number }) {
	const defaultVariant = product.priceVariants?.[0];
	const imgSrc = productImageSrc(product);
	const type = productType(product);
	const delay = `${(index % 9) * 0.08}s`;

	return (
		<a
			href={product.url ?? "#"}
			target="_blank"
			rel="noopener noreferrer"
			style={{
				display: "flex",
				flexDirection: "column",
				background: "#0d2818",
				borderRadius: 16,
				overflow: "hidden",
				border: "1px solid rgba(255,255,255,0.07)",
				textDecoration: "none",
				transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
				animation: `fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) ${delay} both`,
			}}
		>
			{/* Image area */}
			<div
				style={{
					position: "relative",
					aspectRatio: "16/9",
					background: "linear-gradient(135deg, #0d2818 0%, #071a0e 100%)",
					overflow: "hidden",
				}}
			>
				{imgSrc ? (
					<Image
						src={imgSrc}
						alt={product.name ?? ""}
						fill
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						style={{ objectFit: "cover", opacity: 0.88 }}
					/>
				) : (
					<div
						style={{
							position: "absolute",
							inset: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg
							aria-hidden="true"
							width="44"
							height="44"
							viewBox="0 0 44 44"
							fill="none"
							style={{ opacity: 0.18 }}
						>
							<rect
								x="4"
								y="9"
								width="36"
								height="26"
								rx="4"
								stroke="#10b981"
								strokeWidth="1.5"
							/>
							<circle
								cx="15"
								cy="18"
								r="3.5"
								stroke="#10b981"
								strokeWidth="1.5"
							/>
							<path
								d="M4 29l10-8 8 7 6-5 12 10"
								stroke="#10b981"
								strokeWidth="1.5"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				)}
				<div style={{ position: "absolute", top: 12, left: 12 }}>
					<TypeBadge type={type} />
				</div>
			</div>

			{/* Content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 8,
					padding: "18px 20px 20px",
					flex: 1,
				}}
			>
				<h3
					style={{
						fontFamily: "var(--font-cormorant)",
						fontSize: 21,
						fontWeight: 600,
						color: "#f7f3eb",
						lineHeight: 1.25,
						margin: 0,
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{product.name}
				</h3>

				{product.description && (
					<p
						style={{
							fontSize: 13,
							lineHeight: 1.55,
							color: "#7a7367",
							margin: 0,
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
						}}
					>
						{product.description}
					</p>
				)}

				{(product.reviews?.length ?? 0) > 0 && (
					<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
						<span style={{ color: "#fbbf24", fontSize: 12 }}>
							{"★".repeat(5)}
						</span>
						<span style={{ fontSize: 12, color: "#7a7367" }}>
							({product.reviews?.length})
						</span>
					</div>
				)}

				{/* Price row */}
				<div
					style={{
						marginTop: "auto",
						paddingTop: 14,
						display: "flex",
						alignItems: "flex-end",
						justifyContent: "space-between",
						borderTop: "1px solid rgba(255,255,255,0.07)",
					}}
				>
					{defaultVariant ? (
						<div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
							<span
								style={{
									fontFamily: "var(--font-cormorant)",
									fontSize: 26,
									fontWeight: 700,
									color: "#f7f3eb",
									lineHeight: 1,
								}}
							>
								{formatPrice(defaultVariant)}
							</span>
							{billingLabel(defaultVariant) && (
								<span style={{ fontSize: 12, color: "#7a7367" }}>
									{billingLabel(defaultVariant)}
								</span>
							)}
						</div>
					) : (
						<span style={{ fontSize: 14, color: "#7a7367" }}>—</span>
					)}
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: 32,
							height: 32,
							borderRadius: "50%",
							border: "1px solid rgba(255,255,255,0.07)",
							color: "#10b981",
							fontSize: 15,
						}}
					>
						→
					</span>
				</div>
			</div>
		</a>
	);
}

function StatsBar({ products }: { products: Product[] }) {
	const totalReviews = products.reduce(
		(sum, p) => sum + (p.reviews?.length ?? 0),
		0,
	);
	const types = [...new Set(products.map(productType))];

	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "16px 32px",
				padding: "20px 0",
				borderTop: "1px solid rgba(255,255,255,0.07)",
				borderBottom: "1px solid rgba(255,255,255,0.07)",
				marginBottom: 48,
			}}
		>
			{[
				{ label: "Products", value: products.length },
				{ label: "Reviews", value: totalReviews },
			].map(({ label, value }) => (
				<div key={label}>
					<div
						style={{
							fontFamily: "var(--font-cormorant)",
							fontSize: 34,
							fontWeight: 700,
							color: "#f7f3eb",
							lineHeight: 1,
						}}
					>
						{value}
					</div>
					<div
						style={{
							fontSize: 11,
							color: "#7a7367",
							marginTop: 4,
							letterSpacing: "0.06em",
							textTransform: "uppercase",
						}}
					>
						{label}
					</div>
				</div>
			))}

			{/* Divider */}
			<div
				style={{ width: 1, height: 32, background: "rgba(255,255,255,0.07)" }}
			/>

			{/* Type badges */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
				{types.map((type) => (
					<TypeBadge key={type} type={type} />
				))}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
	const [productsResponse, account] = await Promise.all([
		crevio.products.list(),
		crevio.account.get(),
	]);
	const products: Product[] = productsResponse.data ?? [];

	const avatarSrc: string | undefined = undefined;

	return (
		<>
			<style>{`
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(24px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`}</style>

			<div style={{ minHeight: "100vh", background: "#071a0e" }}>
				{/* Header */}
				<header
					style={{
						position: "sticky",
						top: 0,
						zIndex: 100,
						background: "rgba(7,26,14,0.85)",
						backdropFilter: "blur(16px)",
						WebkitBackdropFilter: "blur(16px)",
						borderBottom: "1px solid rgba(255,255,255,0.07)",
					}}
				>
					<div
						style={{
							maxWidth: 1120,
							margin: "0 auto",
							padding: "0 24px",
							height: 64,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
							{avatarSrc && (
								<div
									style={{
										width: 30,
										height: 30,
										borderRadius: "50%",
										overflow: "hidden",
										border: "1px solid rgba(255,255,255,0.14)",
										position: "relative",
										flexShrink: 0,
									}}
								>
									<Image
										src={avatarSrc}
										alt={account.name ?? ""}
										fill
										sizes="30px"
										style={{ objectFit: "cover" }}
									/>
								</div>
							)}
							<span
								style={{
									fontFamily: "var(--font-cormorant)",
									fontSize: 20,
									fontWeight: 600,
									color: "#f7f3eb",
									letterSpacing: "-0.01em",
								}}
							>
								{account.name ?? "Store"}
							</span>
						</div>

						<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
							<a
								href="#products"
								style={{
									fontSize: 13,
									color: "#7a7367",
									textDecoration: "none",
								}}
							>
								Products
							</a>
						</div>
					</div>
				</header>

				{/* Hero */}
				<section
					style={{
						maxWidth: 1120,
						margin: "0 auto",
						padding: "80px 24px 64px",
					}}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: avatarSrc ? "1fr auto" : "1fr",
							gap: 48,
							alignItems: "end",
						}}
					>
						<div>
							<div
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 6,
									fontSize: 11,
									fontWeight: 700,
									letterSpacing: "0.12em",
									textTransform: "uppercase",
									color: "#10b981",
									marginBottom: 20,
									animation:
										"fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both",
								}}
							>
								<span
									style={{
										width: 6,
										height: 6,
										borderRadius: "50%",
										background: "#10b981",
										display: "inline-block",
									}}
								/>
								Creator Store
							</div>

							<h1
								style={{
									fontFamily: "var(--font-cormorant)",
									fontSize: "clamp(52px, 7vw, 88px)",
									fontWeight: 600,
									color: "#f7f3eb",
									lineHeight: 1.04,
									margin: "0 0 20px",
									letterSpacing: "-0.025em",
									animation:
										"fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.13s both",
								}}
							>
								{account.name ?? "Welcome"}
							</h1>

							<p
								style={{
									fontSize: 16,
									lineHeight: 1.65,
									color: "#c8c2b4",
									maxWidth: 500,
									margin: "0 0 32px",
									animation:
										"fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.21s both",
								}}
							>
								Explore exclusive products — courses, downloads, and more.
								Instant access after purchase.
							</p>

							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 16,
									animation:
										"fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.29s both",
								}}
							>
								<a
									href="#products"
									style={{
										display: "inline-flex",
										alignItems: "center",
										gap: 8,
										background: "#10b981",
										color: "#071a0e",
										fontWeight: 700,
										fontSize: 14,
										padding: "12px 22px",
										borderRadius: 100,
										textDecoration: "none",
										letterSpacing: "0.01em",
									}}
								>
									Browse {products.length} product
									{products.length !== 1 ? "s" : ""}
									<span>↓</span>
								</a>
							</div>
						</div>

						{/* Avatar */}
						{avatarSrc && (
							<div
								style={{
									textAlign: "center",
									animation: "fadeIn 0.8s ease 0.2s both",
								}}
							>
								<div
									style={{
										width: 128,
										height: 128,
										borderRadius: "50%",
										overflow: "hidden",
										border: "2px solid rgba(255,255,255,0.14)",
										position: "relative",
										margin: "0 auto 14px",
										boxShadow: "0 0 48px rgba(16,185,129,0.12)",
									}}
								>
									<Image
										src={avatarSrc}
										alt={account.name ?? ""}
										fill
										sizes="128px"
										style={{ objectFit: "cover" }}
									/>
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Products section */}
				<section
					id="products"
					style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 96px" }}
				>
					<StatsBar products={products} />

					{products.length === 0 ? (
						<div
							style={{
								textAlign: "center",
								padding: "80px 0",
								color: "#7a7367",
							}}
						>
							<p style={{ fontSize: 16 }}>No products yet.</p>
						</div>
					) : (
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
								gap: 20,
							}}
						>
							{products.map((product, i) => (
								<ProductCard key={product.id} product={product} index={i} />
							))}
						</div>
					)}
				</section>

				{/* Footer */}
				<footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
					<div
						style={{
							maxWidth: 1120,
							margin: "0 auto",
							padding: "28px 24px",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
							gap: 12,
						}}
					>
						<span style={{ fontSize: 13, color: "#7a7367" }}>
							© {new Date().getFullYear()} {account.name}
						</span>
						<a
							href="https://crevio.co"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								fontSize: 12,
								color: "#7a7367",
								textDecoration: "none",
							}}
						>
							<span
								style={{
									width: 16,
									height: 16,
									borderRadius: 4,
									background: "#10b981",
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 9,
									fontWeight: 900,
									color: "#071a0e",
								}}
							>
								C
							</span>
							Powered by Crevio
						</a>
					</div>
				</footer>
			</div>
		</>
	);
}
