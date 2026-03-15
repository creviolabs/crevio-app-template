import { Hono } from "hono";
import { render } from "../entry-server";

const app = new Hono<{ Bindings: Env }>();

// API routes
app.get("/api/health", (c) => c.json({ status: "ok" }));

// SSR: all other routes render the React app
app.get("*", async (c) => {
	// Fetch index.html from Cloudflare's asset binding
	const assetUrl = new URL("/index.html", c.req.url);
	const assetResponse = await c.env.ASSETS.fetch(assetUrl);
	const template = await assetResponse.text();

	const { html, head } = render(c.req.path);

	const page = template
		.replace("<!--app-head-->", head)
		.replace("<!--app-html-->", html);

	return c.html(page);
});

export default app;
