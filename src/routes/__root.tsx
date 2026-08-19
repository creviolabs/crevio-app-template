import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ErrorPage } from "@/components/error-page";
import { useIframeNavigation } from "@/hooks/use-iframe-navigation";
import { seo } from "@/lib/seo";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			// Site-wide social card, rendered by src/routes/api/og.tsx. A route can
			// override it by passing `image` to seo() in its own head().
			...seo({ image: "/api/og" }),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	shellComponent: RootDocument,
	errorComponent: ErrorPage,
});

// Minimal root: html/body + global concerns only. Layout routes own their
// chrome — _marketing renders Header/Footer, dashboard renders the members shell.
function RootDocument({ children }: { children: React.ReactNode }) {
	useIframeNavigation();

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
