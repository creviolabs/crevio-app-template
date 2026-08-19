import { Skeleton } from "@/components/ui/skeleton";
import { useServerValue } from "@/hooks/use-server-value";

interface CrevioEmbedProps<T> {
	/** The `form_…` / `etype_…` id the embed is bound to. Empty renders the fallback. */
	id: string;
	/** Fetches the record for `id`. Runs in the browser — see useServerValue. */
	load: (id: string) => Promise<T | null>;
	/** What the visitor came here to do, e.g. "sign up", for the fallback copy. */
	intent: string;
	skeletonClassName?: string;
	className?: string;
	children: (record: T) => React.ReactNode;
}

/**
 * Shared shell for the droppable Crevio embeds (`<CrevioForm>`,
 * `<CrevioBooking>`): fetch the bound record, show a skeleton while it loads,
 * and render one "not available" fallback when it can't be had — so the two
 * embeds can't drift apart on any of that.
 */
export function CrevioEmbed<T>({
	id,
	load,
	intent,
	skeletonClassName = "h-48 w-full rounded-xl",
	className,
	children,
}: CrevioEmbedProps<T>) {
	const { data, loading } = useServerValue(
		() => (id ? load(id) : Promise.resolve(null)),
		id,
	);

	if (loading) {
		return (
			<div className={className}>
				<Skeleton className={skeletonClassName} />
			</div>
		);
	}

	if (!data) {
		return (
			<div className={className}>
				<div className="flex flex-col items-center gap-2 text-center">
					<p className="text-sm font-medium">This isn't available right now.</p>
					<p className="text-xs text-muted-foreground">
						If you came here to {intent}, please let the site owner know so they
						can fix it.
					</p>
				</div>
			</div>
		);
	}

	return <div className={className}>{children(data)}</div>;
}
