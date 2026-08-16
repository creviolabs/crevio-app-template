import { describe, expect, test } from "bun:test";
import { checkSource } from "../scripts/check-wiring";

const BOOKING = {
	tag: "CrevioBooking",
	prop: "eventTypeId",
	startsWith: "etype_",
	feature: "bookings",
	how: "",
};

describe("checkSource", () => {
	test("flags an empty id, inline or via a same-file const", () => {
		expect(checkSource(`<CrevioForm formId="" />`, "a.tsx")).toHaveLength(1);
		expect(
			checkSource(
				`const FORM_ID = "";\n<CrevioForm formId={FORM_ID} />`,
				"a.tsx",
			),
		).toHaveLength(1);
	});

	test("flags an id that is not a real one", () => {
		expect(checkSource(`<CrevioForm formId="12345" />`, "a.tsx")[0]).toContain(
			"needs a real",
		);
	});

	test("accepts a real id", () => {
		expect(
			checkSource(`<CrevioForm formId="form_abc" />`, "a.tsx"),
		).toHaveLength(0);
		expect(
			checkSource(
				`<CrevioBooking eventTypeId="etype_abc" />`,
				"a.tsx",
				BOOKING,
			),
		).toHaveLength(0);
	});

	test("skips ids it cannot resolve statically", () => {
		expect(
			checkSource(`<CrevioForm formId={props.id} />`, "a.tsx"),
		).toHaveLength(0);
	});
});
