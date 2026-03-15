import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("products/:slug", "routes/products/$slug.tsx"),
	route("blog", "routes/blog/index.tsx"),
	route("blog/:slug", "routes/blog/$slug.tsx"),
] satisfies RouteConfig;
