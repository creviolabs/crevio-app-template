/**
 * Build-time guard: fails the build when a <CrevioForm> is wired to an
 * empty formId or one that isn't a Form prefix id ("form_..."). An unwired
 * form builds fine but silently renders the "form isn't available" fallback
 * in production — this turns that into a hard build error.
 *
 * Static check only: inline string literals and same-file consts. Anything
 * else (imports, props) is skipped.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const USAGE_RE = /<CrevioForm\b[^>]*?formId=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/gs;
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
				`${file}: <CrevioForm formId=${inner}> resolves to an empty string`,
			);
		} else if (!literal.startsWith("form_")) {
			problems.push(
				`${file}: <CrevioForm formId=${inner}> is "${literal}" — not a Form prefix id ("form_...")`,
			);
		}
	}

	return problems;
}

if (import.meta.main) {
	const root = path.resolve(import.meta.dir, "..");

	const features = readFileSync(path.join(root, "config/features.ts"), "utf8");
	if (!/\bforms:\s*true\b/.test(features)) {
		console.log("✓ CrevioForm formId check skipped (forms feature off)");
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
			"✗ Build blocked: <CrevioForm> with a missing or invalid formId.\n",
		);
		for (const problem of problems) console.error(`  ${problem}`);
		console.error(`
Fix: create the Form via the crevio_api MCP (POST /v1/forms — define its fields
there), then paste the returned prefix_id ("form_...") into the formId binding.
If the page should not have a form, remove the <CrevioForm>/<CtaSection> usage.
If the site needs no forms at all, set \`forms: false\` in config/features.ts —
feature-gated pages drop their form sections and this check skips.
`);
		process.exit(1);
	}

	console.log("✓ CrevioForm formId check passed");
}
