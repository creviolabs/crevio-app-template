import { describe, expect, test } from "bun:test";
import { checkSource } from "../scripts/check-form-ids";

describe("checkSource", () => {
	test("flags empty string literal", () => {
		const problems = checkSource(`<CrevioForm formId="" />`, "a.tsx");
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("empty string");
	});

	test("flags empty literal in braces", () => {
		expect(checkSource(`<CrevioForm formId={""} />`, "a.tsx")).toHaveLength(1);
	});

	test("flags constant resolving to empty string", () => {
		const source = `
			const FORM_ID: string = "";
			export function Cta() {
				return <CrevioForm formId={FORM_ID} heading="Hi" />;
			}
		`;
		const problems = checkSource(source, "cta.tsx");
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("FORM_ID");
	});

	test("flags literal that is not a form prefix id", () => {
		const problems = checkSource(`<CrevioForm formId="12345" />`, "a.tsx");
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("not a Form prefix id");
	});

	test("accepts a valid form prefix id literal", () => {
		expect(
			checkSource(`<CrevioForm formId="form_abc123" />`, "a.tsx"),
		).toHaveLength(0);
	});

	test("accepts a constant resolving to a valid prefix id", () => {
		const source = `
			const FORM_ID = "form_abc123";
			const el = <CrevioForm formId={FORM_ID} />;
		`;
		expect(checkSource(source, "a.tsx")).toHaveLength(0);
	});

	test("handles multi-line JSX attributes", () => {
		const source = `
			const FORM_ID: string = "";
			<CrevioForm
				formId={FORM_ID}
				heading={heading}
				description={description}
				submitLabel="Subscribe"
			/>
		`;
		expect(checkSource(source, "a.tsx")).toHaveLength(1);
	});

	test("skips identifiers it cannot resolve, like forwarded props", () => {
		const source = `
			export function Wrapper({ formId }: { formId: string }) {
				return <CrevioForm formId={formId} />;
			}
		`;
		expect(checkSource(source, "a.tsx")).toHaveLength(0);
	});

	test("flags only the problematic usage when several exist", () => {
		const source = `
			const A = "form_ok";
			const B = "";
			<CrevioForm formId={A} />
			<CrevioForm formId={B} />
		`;
		const problems = checkSource(source, "a.tsx");
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("B");
	});
});
