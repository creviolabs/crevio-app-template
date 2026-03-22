import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	devIndicators: false,
	images: {
		remotePatterns: [{ protocol: "https", hostname: "**" }],
	},
};

export default nextConfig;
