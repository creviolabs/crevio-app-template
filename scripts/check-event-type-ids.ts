/**
 * Build-time guard: fails the build when a <CrevioBooking> is wired to an
 * empty eventTypeId or one that isn't an EventType prefix id ("etype_...").
 * An unwired scheduler builds fine but silently renders the "booking isn't
 * available" fallback in production — this turns that into a hard build error.
 *
 * Static check only: inline string literals and same-file consts. Anything
 * else (imports, props) is skipped.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const USAGE_RE =
	/<CrevioBooking\b[^>]*?eventTypeId=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/gs;
const STRING_LITERAL = /^["'`]([^"'`$]*)["'`]$/;

export function checkSource(source: string, file: string): string[] {
	const problems: string[] = [];

	for (const [, expr] of source.matchAll(USAGE_RE)) {
		const inner = expr
			.trim()
			.replace(/^\{([\s\S]*)\}$/, "$1")
			.trim();
		const literal =
			inner.match(STRING_LITERAL)?.[1] ??
			(/^[A-Za-z_$][\w$]*$/.test(inner)
				? source.match(
						new RegExp(
							`const\\s+${inner}\\s*(?::[^=]*)?=\\s*["'\`]([^"'\`$]*)["'\`]`,
						),
					)?.[1]
				: undefined);

		if (literal === undefined) continue;
		if (literal === "") {
			problems.push(
				`${file}: <CrevioBooking eventTypeId=${inner}> resolves to an empty string`,
			);
		} else if (!literal.startsWith("etype_")) {
			problems.push(
				`${file}: <CrevioBooking eventTypeId=${inner}> is "${literal}" — not an EventType prefix id ("etype_...")`,
			);
		}
	}

	return problems;
}

if (import.meta.main) {
	const root = path.resolve(import.meta.dir, "..");

	const features = readFileSync(path.join(root, "config/features.ts"), "utf8");
	if (!/\bbookings:\s*true\b/.test(features)) {
		console.log(
			"✓ CrevioBooking eventTypeId check skipped (bookings feature off)",
		);
		process.exit(0);
	}

	const problems: string[] = [];

	for (const file of new Bun.Glob(
		"{app,components,lib}/**/*.{ts,tsx}",
	).scanSync(root)) {
		problems.push(
			...checkSource(readFileSync(path.join(root, file), "utf8"), file),
		);
	}

	if (problems.length > 0) {
		console.error(
			"✗ Build blocked: <CrevioBooking> with a missing or invalid eventTypeId.\n",
		);
		for (const problem of problems) console.error(`  ${problem}`);
		console.error(`
Fix: create the EventType via the crevio_api MCP (POST /v1/event-types — define
its duration, location, and pricing there), then paste the returned prefix_id
("etype_...") into the eventTypeId binding. If the page should not offer a
booking, remove the <CrevioBooking> usage. If the site needs no bookings at
all, set \`bookings: false\` in config/features.ts and this check skips.
`);
		process.exit(1);
	}

	console.log("✓ CrevioBooking eventTypeId check passed");
}
