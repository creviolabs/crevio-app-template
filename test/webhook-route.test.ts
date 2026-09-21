import { afterEach, describe, expect, test } from "bun:test";
import { Webhook } from "standardwebhooks";
import { POST } from "../app/api/webhooks/crevio/route";

const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
const BODY = JSON.stringify({
	id: "whev_123",
	object: "event",
	type: "order.paid",
	api_version: "v1",
	created_at: "2026-09-21T10:00:00Z",
	data: { object: { id: "ord_1", object: "order" } },
});

function delivery(body = BODY, signedBody = BODY) {
	const sentAt = new Date();
	return new Request("https://site.test/api/webhooks/crevio", {
		method: "POST",
		body,
		headers: {
			"webhook-id": "whev_123",
			"webhook-timestamp": String(Math.floor(sentAt.getTime() / 1000)),
			"webhook-signature": new Webhook(SECRET).sign(
				"whev_123",
				sentAt,
				signedBody,
			),
		},
	});
}

afterEach(() => {
	delete process.env.CREVIO_WEBHOOK_SECRET;
});

describe("POST /api/webhooks/crevio", () => {
	test("acknowledges a delivery Crevio signed", async () => {
		process.env.CREVIO_WEBHOOK_SECRET = SECRET;

		expect((await POST(delivery())).status).toBe(204);
	});

	test("refuses a body that was changed after signing", async () => {
		process.env.CREVIO_WEBHOOK_SECRET = SECRET;

		const response = await POST(delivery(BODY.replace("ord_1", "ord_2")));

		expect(response.status).toBe(401);
	});

	test("refuses a request with no signature", async () => {
		process.env.CREVIO_WEBHOOK_SECRET = SECRET;

		const unsigned = new Request("https://site.test/api/webhooks/crevio", {
			method: "POST",
			body: BODY,
		});

		expect((await POST(unsigned)).status).toBe(401);
	});

	test("says so when the signing secret has not been set", async () => {
		expect((await POST(delivery())).status).toBe(503);
	});
});
