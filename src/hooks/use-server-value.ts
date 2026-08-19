import { useEffect, useState } from "react";

export interface ServerValue<T> {
	data: T | null;
	loading: boolean;
}

/**
 * Fetch a value from a server function once, keyed by `key`.
 *
 * For components that are dropped into a page rather than owned by a route —
 * `<CrevioForm>`, `<CrevioBooking>` — where the record they render isn't known
 * to any loader. Anything a route owns should load in that route's `loader`
 * instead, so it server-renders.
 */
export function useServerValue<T>(
	load: () => Promise<T>,
	key: string,
): ServerValue<T> {
	const [state, setState] = useState<ServerValue<T>>({
		data: null,
		loading: true,
	});

	// Keyed on `key`, not `load` — callers rebuild the closure every render, so
	// depending on it would refetch forever.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		let cancelled = false;
		setState((prev) => ({ ...prev, loading: true }));

		load()
			.then((data) => {
				if (!cancelled) setState({ data, loading: false });
			})
			.catch(() => {
				if (!cancelled) setState({ data: null, loading: false });
			});

		return () => {
			cancelled = true;
		};
	}, [key]);

	return state;
}
