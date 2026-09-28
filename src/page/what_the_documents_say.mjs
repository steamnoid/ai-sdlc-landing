/** What a project's own documents say, and the reading of them the page may print.
 *
 * **A shell, so this cycle's tests can fail on a document rather than on a file.**
 *
 * The first RED of this cycle failed on `Cannot find module`, which says nothing about any
 * project's backlog. Every test here is about what a phase's mark means and what a
 * licence file states, so the module has to load and refuse before any of them can ask.
 *
 * **The two halves of this file are the claim and the finding, and they are not the same
 * thing.** A phase row saying `**done**` is a claim made by a document. The reader's
 * verdict is a finding about that claim. Keeping them apart is what stops a document's
 * own word from becoming the page's conclusion without a reader being able to see both.
 */

export class TheDocumentIsNotReadableError extends Error {
	constructor(why) {
		super(why);
		this.name = "TheDocumentIsNotReadableError";
	}
}

const the_backlog_table_was_not_found = "there is no backlog table";

/** How a slice says its phase is done, or that it does not say. */
export function how_the_documents_mark_a_phase_as_done(a_slice) {
	throw new TheDocumentIsNotReadableError(
		"the reader cannot yet read how a slice marks its phase as done. The mark is the whole " +
			"question here, and reading it wrongly is the one failure this module exists to prevent.",
	);
}

/** Every phase a backlog table declares, with the mark on each. */
export function what_the_phases_say(a_document, where_it_was_read) {
	throw new TheDocumentIsNotReadableError(
		`the reader cannot yet read a backlog table out of ${where_it_was_read}.`,
	);
}

/** The first line of a licence file, or `null` when there is no licence file. */
export function what_the_licence_says(the_text_of_the_licence) {
	throw new TheDocumentIsNotReadableError(
		"the reader cannot yet read a licence. Three of the four projects here are not open source " +
			"and the fourth is MIT, so an empty string would be a claim about a licence nobody stated.",
	);
}
