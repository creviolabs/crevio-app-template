import { Webhook } from "standardwebhooks";

export const dynamic = "force-dynamic";

interface CrevioEvent {
	id: string;
	type: string;
	api_version: string;
	created_at: string;
	data: { object: Record<string, unknown> } & Record<string, unknown>;
}

// Add a case per event type the endpoint subscribes to. `event.data.object` is the
// resource exactly as its GET endpoint returns it, and `event.id` is identical on
// every retry and redelivery, so dedupe on it before doing anything that must
// happen once (charging, fulfilling, emailing).
async function handleEvent(event: CrevioEvent): Promise<void> {
	switch (event.type) {
		default:
			return;
	}
}

export async function POST(request: Request) {
	const secret = process.env.CREVIO_WEBHOOK_SECRET;
	if (!secret) {
		return Response.json(
			{ error: "CREVIO_WEBHOOK_SECRET is not set" },
			{ status: 503 },
		);
	}

	const rawBody = await request.text();

	let event: CrevioEvent;
	try {
		event = new Webhook(secret).verify(
			rawBody,
			Object.fromEntries(request.headers),
		) as CrevioEvent;
	} catch {
		return Response.json({ error: "invalid signature" }, { status: 401 });
	}

	await handleEvent(event);
	return new Response(null, { status: 204 });
}
