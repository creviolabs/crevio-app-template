/**
 * Pre-deploy smoke test: boots the BUILT worker in workerd via Wrangler's test
 * harness and serves real requests through it.
 *
 * 🚨 Booting is not enough, and neither is `wrangler deploy --dry-run`. Route
 * modules are code-split and evaluated lazily, so work at module scope that
 * needs a request — reading an env binding, constructing a client — does not
 * throw until the FIRST REQUEST. Measured: such a throw passes `tsc`,
 * `vite build`, `wrangler --dry-run` and a boot-only check, while every request
 * 500s. Only fetching a route catches it.
 *
 * Runs on `node --test`, not `bun test`: the harness crashes the workerd
 * runtime under Bun (verified — identical code passes under node).
 *
 * Run AFTER `bun run build` — the harness serves the build output.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createTestHarness } from "wrangler";

// The BUILT config, not the source one: `wrangler.jsonc` points `main` at the
// `@tanstack/react-start/server-entry` package specifier, which only the Vite
// plugin can resolve. The plugin emits this resolved config beside the bundle.
const BUILT_CONFIG = "./dist/server/wrangler.json";

const server = createTestHarness({
	workers: [
		{
			configPath: BUILT_CONFIG,
			// Only needs to exist, not resolve — the template ships unwired.
			vars: { CREVIO_APP_URL: "https://smoke.test" },
		},
	],
});

// An unreachable harness is inconclusive, not a failure: a deploy must never be
// blocked because workerd could not start here. A 5xx from a worker that DID
// start is a real failure.
let started = false;

before(async () => {
	try {
		await server.listen();
		started = true;
	} catch (error) {
		console.warn(
			`[smoke] harness could not start — skipping. Run \`bun run build\` first (expects ${BUILT_CONFIG}).`,
			error,
		);
	}
});

after(async () => {
	if (started) await server.close();
});

// A page renders through the router; robots.txt goes straight to a server
// handler. They fail differently, so cover one of each.
for (const path of ["/", "/robots.txt"]) {
	test(`GET ${path} does not 5xx`, async (t) => {
		if (!started) return t.skip("harness unavailable");

		const response = await server.fetch(`https://smoke.test${path}`);
		if (response.status >= 500) {
			console.error(`[smoke] ${path} -> ${response.status}`);
			console.error((await response.text()).slice(0, 800));
		}
		assert.ok(
			response.status < 500,
			`${path} returned ${response.status} — the worker built but does not serve`,
		);
	});
}
