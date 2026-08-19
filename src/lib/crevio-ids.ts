/**
 * Prefixed ids for the Crevio records the embeddable components bind to.
 *
 * Typed rather than lint-checked: a static scan only recognises a literal or a
 * same-file `const`, so a ternary, an imported id, or a prop passed through a
 * wrapper slips past it silently. These types make the compiler reject an empty
 * or wrong-prefix id wherever it comes from, in the editor.
 *
 * Create the record first via the `crevio_api` MCP and paste the id it returns.
 */

/** A Form id from `POST /v1/forms`. */
export type FormId = `form_${string}`;

/** An EventType id from `POST /v1/event-types`. */
export type EventTypeId = `etype_${string}`;
