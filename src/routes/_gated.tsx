import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { featureRoute } from "@/config/features";
import { getAccountOrNull } from "@/lib/data";
import { seo } from "@/lib/seo";
import { requireViewer } from "@/lib/session";

// Every gated page lives under this pathless layout, which owns the members
// shell and the auth gate — so a new signed-in-only page is gated by where it
// sits, not by remembering to call anything.
//
// It MUST be `beforeLoad`: that phase runs parent-to-child and halts the chain
// on a redirect, so no child loader runs for a logged-out visitor. In a
// `loader` the gate and the child's loaders would race under Promise.all.
const authFeature = featureRoute("auth");

export const Route = createFileRoute("/_gated")({
	staticData: authFeature.staticData,
	beforeLoad: async () => {
		authFeature.beforeLoad();
		return {
			viewer: await requireViewer({ data: { returnTo: "/dashboard" } }),
		};
	},
	loader: async ({ context }) => ({
		viewer: context.viewer,
		account: await getAccountOrNull(),
	}),
	head: () => ({ meta: seo({ title: "Members area", noindex: true }) }),
	component: DashboardLayout,
});

function DashboardLayout() {
	const { viewer, account } = Route.useLoaderData();

	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar
					storeName={account?.name ?? "Members"}
					supportEmail={account?.supportEmail}
					user={{
						name: viewer.name?.trim() || "Member",
						email: viewer.email ?? "",
						avatar: "",
					}}
				/>
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-vertical:h-4 data-vertical:self-auto"
						/>
						<span className="font-medium">Members area</span>
					</header>
					<div className="flex flex-1 flex-col gap-4 p-4">
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
