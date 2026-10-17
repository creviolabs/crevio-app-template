/**
 * Pre-deploy guard: boots the built worker in a local workerd (via `wrangler
 * dev`) and confirms it starts. Catches module-scope throws — e.g. reading an
 * env binding at module load, which only exists per-request in the Workers
 * runtime — that pass `bun run build` and `wrangler --dry-run` (neither runs the
 * worker) and otherwise only surface as an opaque Cloudflare 500 at deploy.
 *
 * Run AFTER `bun run build`, BEFORE deploying. Exits 1 only on a CONFIRMED
 * startup failure; a ready worker, a timeout, or a spawn hiccup exit 0, so the
 * check never wrongly blocks a deploy — the real deploy stays the final arbiter.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const TIMEOUT_MS = 90_000;
const STOP_GRACE_MS = 3_000;
const STOP_POLL_MS = 100;

function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			server.close(() =>
				typeof address === "object" && address
					? resolve(address.port)
					: reject(new Error("no port")),
			);
		});
	});
}

function groupAlive(pgid: number): boolean {
	try {
		process.kill(-pgid, 0);
		return true;
	} catch {
		return false;
	}
}

function signalGroup(pgid: number, signal: NodeJS.Signals): void {
	try {
		process.kill(-pgid, signal);
	} catch {}
}

async function stopGroup(pgid: number): Promise<void> {
	signalGroup(pgid, "SIGTERM");
	const deadline = Date.now() + STOP_GRACE_MS;
	while (groupAlive(pgid) && Date.now() < deadline)
		await Bun.sleep(STOP_POLL_MS);
	signalGroup(pgid, "SIGKILL");
}

function failureMessage(log: string): string {
	const detail = log
		.split("\n")
		.filter((l) =>
			/invalid url|is not set|uncaught|TypeError|ReferenceError|Error:|throw| at .+\.(tsx|ts|js)/i.test(
				l,
			),
		)
		.filter((l) => !/KiB|newer version|workers-sdk|create an issue/i.test(l))
		.slice(-15)
		.join("\n");

	return [
		"✗ preflight — the worker throws while starting up (Workers runtime failed to start).",
		"",
		"Most common cause: reading an env binding at module scope — e.g. a top-level",
		"`export const metadata = { metadataBase: new URL(getAppUrl()) }`. Env bindings only",
		"exist per-request in Workers, so this throws at startup and fails the deploy with an",
		"opaque Cloudflare 500. Fix: move it into request-time code such as `generateMetadata()`.",
		"See AGENTS.md → Cloudflare Workers runtime.",
		detail ? `\n--- error ---\n${detail}` : "",
	].join("\n");
}

if (import.meta.main) {
	const port = await freePort().catch(() => process.exit(0));
	// wrangler (bunx → node → node) starts workerd grandchildren that outlive a killed parent; a group kill reaches them all.
	const child = spawn(
		"bunx",
		["wrangler", "dev", "--local", "--port", String(port), "--ip", "127.0.0.1"],
		{ stdio: ["ignore", "pipe", "pipe"], detached: true },
	);

	let log = "";
	let settled = false;

	const finish = async (code: number, message?: string): Promise<void> => {
		if (settled) return;
		settled = true;
		clearTimeout(timer);
		if (child.pid) await stopGroup(child.pid);
		if (message) console.error(message);
		else console.log("✓ preflight — worker boots cleanly in workerd");
		process.exit(code);
	};

	const onData = (buf: Buffer): void => {
		log += buf.toString();
		if (/Ready on http/.test(log)) finish(0);
		else if (/Workers runtime failed to start/i.test(log))
			finish(1, failureMessage(log));
	};

	child.stdout.on("data", onData);
	child.stderr.on("data", onData);
	child.on("error", () => finish(0));
	child.on("exit", () =>
		/Workers runtime failed to start/i.test(log)
			? finish(1, failureMessage(log))
			: finish(0),
	);
	process.on("SIGINT", () => finish(130, "✗ preflight interrupted"));
	process.on("SIGTERM", () => finish(143, "✗ preflight terminated"));

	const timer = setTimeout(() => finish(0), TIMEOUT_MS);
}
