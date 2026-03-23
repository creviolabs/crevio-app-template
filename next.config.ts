import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	devIndicators: false,
	// Allow preview proxy domains so vinext's cross-origin check doesn't block
	// CORS requests (ES modules, fonts) when accessed through the vanity URL.
	allowedDevOrigins: ["*.crevio.link", "*.crevio.app"],
	images: {
		remotePatterns: [{ protocol: "https", hostname: "**" }],
	},
};

export default nextConfig;
