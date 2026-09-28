/** What a project's own documents say, and the reading of them the page may print.
 *
 * **The facts on this page come from two kinds of place: a project's code and a project's
 * own documents.** The documents are the dangerous half, because prose drifts silently
 * while a stage added to an enumeration breaks the build. So every reader here takes a
 * document's word for a claim *the document makes* and never for a claim it does not —
 * and the two are kept apart, which is the rule the page this one grew out of calls a
 * finding against a claim.
 *
 * **A phase's `done` is the sharpest case in the family, and it is why this file
 * exists.** Two of the four projects strike a finished phase through with `~~…~~` and
 * two mark nothing at all. A reader that reads "done" from a strikethrough would print
 * ten phases as "not done" for the two that mark nothing, while phases 0 and 1 of both
 * are demonstrably delivered — and it would be wrong in the one direction a reader is
 * least likely to check. So the marker is reported, whatever it is, and a phase with no
 * marker says so rather than being classified.
 *
 * | what a slice carries | what the page may say |
 * |---|---|
 * | a `~~struck~~` slice | `done`, marked by the strike |
 * | a `**done**` word in the slice | `done`, marked by the word |
 * | both | `done`, marked by both |
 * | no marker at all | `in neither way` — which is what the document says |
 *
 * **Only the slice is searched.** A gate column is prose written to be hard, and one
 * reading "each ships a real-agent e2e test" would be a phase marked delivered by a
 * sentence about what the phase will require.
 */

export class TheDocumentIsNotReadableError extends Error {
	constructor(why) {
		super(why);
		this.name = "TheDocumentIsNotReadableError";
	}
}

const NOTHING_IS_FOUND = "in neither way";

/**
 * How a slice marks its phase as done, or that it does not mark it.
 *
 * **The order is the strike first, then the word, because a slice can carry both** and
 * the answer then names both rather than picking one.
 */
export function how_the_documents_mark_a_phase_as_done(a_slice) {
	const is_struck = a_slice.includes("~~");
	const says_done = /\bdone\b/i.test(a_slice.replace(/~~/g, ""));

	if (is_struck && says_done) {
		return "a strikethrough and the word done";
	}
	if (is_struck) {
		return "a strikethrough";
	}
	if (says_done) {
		return "the word done";
	}
	return NOTHING_IS_FOUND;
}

/** The rows of a markdown table, without the header or the separator under it. */
function the_rows_of_a_table(a_document) {
	const the_lines = a_document.split("\n").filter((a_line) => a_line.trim().startsWith("|"));
	const rows = the_lines
		.map((a_line) => a_line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((a_cell) => a_cell.trim()))
		.filter((a_row) => !a_row.every((a_cell) => /^:?-{2,}:?$/.test(a_cell)));
	return rows.slice(1);
}

/**
 * Every phase a backlog table declares, with the mark on each and a verdict from it.
 *
 * **A document with no table is refused by name rather than answered with no phases.**
 * "This project has no phases" and "this project keeps its phases somewhere this reader
 * did not look" are different facts, and only one of them is a fact about the project.
 */
export function what_the_phases_say(a_document, where_it_was_read) {
	const the_rows = the_rows_of_a_table(a_document);
	const the_phases = the_rows
		.map((a_row) => ({
			// A number rather than the string a markdown cell holds. A phase's number is what
			// the page sorts and prints, and `"10" < "9"` is a truth about strings and not about
			// the order any of these projects writes its phases in.
			number: Number(a_row[0]),
			the_slice: a_row[1] ?? "",
			the_gate: a_row[2] ?? "",
		}))
		.filter((a_phase) => Number.isInteger(a_phase.number));

	if (the_phases.length === 0) {
		return {
			verdict: "there is no backlog table",
			phases: [],
			why_not:
				`no table in ${where_it_was_read} has a column of phase numbers, so nothing says what ` +
				"this project has planned. That is not the same as a project with no phases: a project " +
				"that keeps its backlog in a file this reader was not told about is a project with " +
				"phases and no page.",
		};
	}

	return {
		verdict: "read",
		phases: the_phases.map((a_phase) => {
			const the_mark = how_the_documents_mark_a_phase_as_done(a_phase.the_slice);
			return {
				...a_phase,
				how_it_was_marked: the_mark,
				verdict: the_mark === NOTHING_IS_FOUND ? NOTHING_IS_FOUND : "done",
				where_it_was_read: where_it_was_read,
			};
		}),
		why_not: null,
	};
}

/**
 * The first line of a licence file, or `null` when there is no licence file.
 *
 * **`null` and not an empty string**, because a page that prints an empty licence reads
 * as a licence nobody could read rather than as a licence that does not exist — and three
 * of the four projects here are not open source while the fourth is MIT, so the difference
 * is the whole of what a reader of a licence is looking for.
 */
export function what_the_licence_says(the_text_of_the_licence) {
	if (typeof the_text_of_the_licence !== "string") {
		return null;
	}
	const the_first_line = the_text_of_the_licence.split("\n")[0].trim();
	return the_first_line.length === 0 ? null : the_first_line;
}
