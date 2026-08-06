import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	partialPrefetching: true,
	devIndicators: false,
	allowedDevOrigins: ["*.crevio.link", "*.crevio.app"],
	images: {
		remotePatterns: [{ protocol: "https", hostname: "**" }],
	},
	headers: async () => [
		{
			source: "/:path*",
			headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
		},
	],
};

export default nextConfig;
