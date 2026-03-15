import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/index.tsx";
import NotFound from "./pages/not-found.tsx";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Routes>
				<Route path="/" element={<Index />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
