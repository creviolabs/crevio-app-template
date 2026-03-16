import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Handles soft-navigation requests from the parent window.
 * Navigation reporting is handled by the @crevio/vite-plugins preview-iframe-history plugin.
 *
 * No-ops when the app isn't running inside an iframe.
 */
export function useIframeNavigation() {
	const navigate = useNavigate();

	useEffect(() => {
		if (window.parent === window) return;

		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "navigate" && typeof event.data.pathname === "string") {
				navigate(event.data.pathname);
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [navigate]);
}
