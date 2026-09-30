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

/** The word a document writes to mark a phase done, and nothing else — four letters, to be sliced past. */
const THE_MARKER = "done";

/**
 * The things a phase's slice is made of, and which of them are done.
 *
 * **A phase is often more than one thing, and a document says so inside one cell.**
 * `~~`github.clone_repository`, the filesystem tools~~ **done**; **exposure through MCP is not**`
 * is a row that reports three tools delivered and one exposure owed. Reading it as a single
 * thing threw away the half that was owed, and the page then counted the row as done — on the
 * same row that said the exposure was not.
 *
 * | a segment | what it is |
 * |---|---|
 * | between `~~` and `~~` | done — the document struck it |
 * | before the word `done` | done — the document said so |
 * | after the word `done` | not done |
 * | a segment with neither | not done |
 *
 * **The strike is the rule and the word is a second rule inside what the strike left.** The
 * word is found after the emphasis is taken off, so `**done**` and `done` mean the same thing,
 * which is what `how_the_documents_mark_a_phase_as_done` already believed. The page marking a
 * phase by the word alone and this function marking it not-done would be a contradiction
 * printed on the page, in the one place nobody is checking.
 *
 * **Emphasis is taken off and nothing else is.** A backtick is a backtick: it is a word the
 * project wrote, and `the_items_of` is not the place that decides a word does not matter.
 *
 * **An odd number of `~~` is refused.** That is a cell edited halfway, and guessing where the
 * strike ends reports as owed whatever the author had not finished typing — a fact about this
 * page rather than about the project. Every refusal in this file is by name for the same
 * reason: `refuses a document with no backlog at all, rather than borrowing another table`.
 */
export function the_items_of(a_slice) {
	const how_many_strikes = (a_slice.match(/~~/g) ?? []).length;
	if (how_many_strikes % 2 !== 0) {
		throw new TheDocumentIsNotReadableError(
			`this slice carries ${how_many_strikes} strikethrough marks, which is an odd number, so the ` +
				`cell was edited halfway: "${a_slice}". Every strikethrough in this family is written as a ` +
				"pair, and reading half of one would report as owed whatever the author had not finished " +
				"writing.",
		);
	}

	const the_items = [];
	const the_segments = a_slice.split("~~");
	the_segments.forEach((a_segment, where_it_is) => {
		const without_emphasis = a_segment.replace(/\*\*/g, "").trim();
		const is_inside_a_strike = where_it_is % 2 === 1;

		if (is_inside_a_strike) {
			add_an_item(the_items, without_emphasis, true);
			return;
		}

		const where_the_marker_is = without_emphasis.search(/\bdone\b/i);
		if (where_the_marker_is === -1) {
			add_an_item(the_items, without_emphasis, false);
			return;
		}
		add_an_item(the_items, without_emphasis.slice(0, where_the_marker_is), true);
		// **From after the word, and not from its start.** The marker is a mark; printing it as the
		// first word of the outstanding half would put an item called `done` among the work that is
		// left, which is the one label on this page that cannot be wrong by accident.
		add_an_item(the_items, without_emphasis.slice(where_the_marker_is + THE_MARKER.length), false);
	});
	return the_items;
}

/** One item, with the punctuation a cell uses to join two clauses taken off its ends. */
function add_an_item(the_items, some_text, is_done) {
	const the_slice = some_text.replace(/^[\s;,—–-]+|[\s;,—–-]+$/g, "").replace(/\s+/g, " ").trim();
	if (the_slice !== "") {
		the_items.push({ the_slice, is_done });
	}
}

/**
 * What a phase amounts to, from the things it is made of.
 *
 * **A mark used to decide this and the half-done row said otherwise.** The mark is still
 * reported — `how_it_was_marked` — because a reader who wants to know what the document did is
 * entitled to it, and because two of the four projects mark nothing at all and saying so is a
 * finding. What no longer decides is the verdict, because a strikethrough and the word `done`
 * are both capable of appearing beside work that is not finished.
 *
 * | the items | the phase is |
 * |---|---|
 * | all done | `done` |
 * | some done, some not | `partly` |
 * | none done | `not started` |
 * | none at all | `not started` — a row with no text in it is not a row that is finished |
 */
export function the_verdict_of(the_items) {
	if (the_items.length === 0 || the_items.every((an_item) => !an_item.is_done)) {
		return "not started";
	}
	if (the_items.every((an_item) => an_item.is_done)) {
		return "done";
	}
	return "partly";
}

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

/**
 * The lines of the section a document puts under a heading.
 *
 * **The heading is what makes a table a backlog.** A document with two numbered tables is
 * the normal case here — three of the four carry a table of owed defects above their
 * backlog, and it has the same shape, a number and a sentence — so a reader that took the
 * first table it found with a number in it reported `_recording_with is never called` as
 * phase 1 of `ai-sdlc-app-rs`, and the page showed it. A section runs to the next heading of
 * any level, so a document that reorganises its backlog is refused rather than half-read.
 */
function the_lines_under(a_document, a_heading) {
	const the_lines = a_document.split("\n");
	const where_it_starts = the_lines.findIndex((a_line) =>
		a_line.trim().replace(/^#+\s*/, "").toLowerCase().startsWith(a_heading),
	);
	if (where_it_starts === -1) {
		return [];
	}
	const the_rest = the_lines.slice(where_it_starts + 1);
	const where_it_ends = the_rest.findIndex((a_line) => /^#{1,6}\s/.test(a_line));
	return where_it_ends === -1 ? the_rest : the_rest.slice(0, where_it_ends);
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
	const the_rows = the_rows_of_a_table(the_lines_under(a_document, "backlog").join("\n"));
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
			const the_items = the_items_of(a_phase.the_slice);
			return {
				...a_phase,
				how_it_was_marked: how_the_documents_mark_a_phase_as_done(a_phase.the_slice),
				verdict: the_verdict_of(the_items),
				the_items,
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
