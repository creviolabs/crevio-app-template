import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import App from "./app.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
	const app = (
		<BrowserRouter>
			<App />
			<Sonner />
		</BrowserRouter>
	);

	if (root.childElementCount > 0) {
		hydrateRoot(root, app);
	} else {
		createRoot(root).render(app);
	}
}
