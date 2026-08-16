/**
 * Build guard: every Crevio component a route renders must be wired to a real
 * record. An unwired one (`<CrevioForm formId="">`) builds fine and then renders
 * the "not available" fallback in production, so this turns it into a build
 * error instead.
 *
 * Add a component by adding a row to CHECKS.
 *
 * Static only — inline literals and same-file consts. Anything else is skipped
 * rather than guessed at.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const CHECKS = [
	{
		tag: "CrevioForm",
		prop: "formId",
		startsWith: "form_",
		feature: "forms",
		how: "POST /v1/forms",
	},
	{
		tag: "CrevioBooking",
		prop: "eventTypeId",
		startsWith: "etype_",
		feature: "bookings",
		how: "POST /v1/event-types",
	},
];

export function checkSource(
	source: string,
	file: string,
	check = CHECKS[0],
): string[] {
	const usage = new RegExp(
		`<${check.tag}\\b[^>]*?${check.prop}=\\s*(\\{[^}]*\\}|"[^"]*"|'[^']*')`,
		"gs",
	);
	const problems: string[] = [];

	for (const [, expr] of source.matchAll(usage)) {
		const inner = expr
			.trim()
			.replace(/^\{([\s\S]*)\}$/, "$1")
			.trim();
		const id =
			inner.match(/^["'`]([^"'`$]*)["'`]$/)?.[1] ??
			source.match(
				new RegExp(
					`const\\s+${inner}\\s*(?::[^=]*)?=\\s*["'\`]([^"'\`$]*)["'\`]`,
				),
			)?.[1];

		if (id === undefined) continue;
		if (!id.startsWith(check.startsWith)) {
			problems.push(
				`${file}: <${check.tag} ${check.prop}=${inner}> is "${id}" — needs a real "${check.startsWith}..." id`,
			);
		}
	}
	return problems;
}

if (import.meta.main) {
	const root = path.resolve(import.meta.dir, "..");
	const features = readFileSync(path.join(root, "config/features.ts"), "utf8");
	const sources = new Map<string, string>();
	for (const file of new Bun.Glob(
		"{app,components,lib}/**/*.{ts,tsx}",
	).scanSync(root)) {
		sources.set(file, readFileSync(path.join(root, file), "utf8"));
	}

	// A component nothing imports cannot render, so an unwired one the site has
	// outgrown must not block the build — that pushed sites into switching the
	// whole feature off, which switches this check off with it. Matched on
	// filename, and an unresolved import counts as a use: erring toward blocking
	// is the right side for a guard.
	const imported = new Set(
		[...sources.values()].flatMap((s) =>
			[...s.matchAll(/["'][^"']*?([\w.-]+)["']/g)].map((m) => m[1]),
		),
	);
	const rendered = (file: string) =>
		file.startsWith("app/") ||
		imported.has(path.basename(file).replace(/\.\w+$/, ""));

	const blocking: string[] = [];
	for (const check of CHECKS) {
		if (!new RegExp(`\\b${check.feature}:\\s*true\\b`).test(features)) continue;
		for (const [file, source] of sources) {
			const found = checkSource(source, file, check);
			if (!found.length) continue;
			if (rendered(file))
				blocking.push(
					...found,
					`  ↳ create it (${check.how} via the crevio_api MCP) and paste the id it returns.`,
				);
			else
				console.warn(
					`! unwired <${check.tag}> in ${file} — no route imports it, so not blocking. Delete it or wire it up.`,
				);
		}
	}

	if (blocking.length) {
		console.error("✗ Build blocked:\n");
		for (const line of blocking) console.error(`  ${line}`);
		console.error(
			"\nIf the site needs none, set the feature to false in config/features.ts.\n",
		);
		process.exit(1);
	}
	console.log("✓ Crevio components are wired");
}
