import { Suspense } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireFeature } from "@/config/features";
import { getAccount } from "@/lib/data";
import { getViewer, requireSession } from "@/lib/session";

// The whole /dashboard group is gated here, once, at the layout — pages inside
// never repeat auth. The auth-dependent shell lives in <Suspense> because it
// reads request headers (cacheComponents requires dynamic APIs to be suspended).
export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	requireFeature("auth");
	return (
		<TooltipProvider>
			<SidebarProvider>
				<Suspense fallback={null}>
					<GatedShell>{children}</GatedShell>
				</Suspense>
			</SidebarProvider>
		</TooltipProvider>
	);
}

async function GatedShell({ children }: { children: React.ReactNode }) {
	await requireSession("/dashboard"); // redirects if not signed in
	const [account, viewer] = await Promise.all([
		getAccount().catch(() => null),
		getViewer(),
	]);

	return (
		<>
			<AppSidebar
				storeName={account?.name ?? "Members"}
				supportEmail={account?.supportEmail}
				user={{
					name: viewer?.name?.trim() || "Member",
					email: viewer?.email ?? "",
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
				<div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
			</SidebarInset>
		</>
	);
}
