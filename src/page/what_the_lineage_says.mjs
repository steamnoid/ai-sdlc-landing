/** Which project came from which, and what the file that says so is worth.
 *
 * **The family is related, and only one file in four repositories says so.** Three of the
 * four write about "the sibling project" and do not name it; one — `ai-sdlc-app-rs` —
 * names two repositories in `SOURCES.lock`, with a commit, a branch and a date for each,
 * and a licence header that names a third. That asymmetry is the finding, and it is why
 * this file exists: a page that drew a lineage graph from the prose would be drawing one
 * it cannot check, and there is a test here that says an edge is not invented out of the
 * words "the sibling project".
 *
 * **A pin is a promise about a moment, and the moment is what is printed.** `SOURCES.lock`
 * records the commit a port was read from, and a test in the port re-hashes every pinned
 * file to catch a source that moved. This page cannot re-hash a sibling's tree from here,
 * so what it says is the pin and not the agreement — the difference between "read from this
 * commit" and "still matches it", which is a distinction a reader of a family overview is
 * exactly the person to need.
 *
 * **An edge with no file behind it is an absence with a reason.** "This project names no
 * other" is a fact worth printing; "this project's lineage is unknown" is a thing this
 * reader must not say, because it is not true and it is not what the file's absence means.
 */

export class TheLineageIsNotReadableError extends Error {
	constructor(why) {
		super(why);
		this.name = "TheLineageIsNotReadableError";
	}
}

/** Why a pin's standing is never reported either way, in the words the page prints. */
const WHY_A_PIN_MAY_BE_STALE =
	"this page read one repository and did not re-hash the other's tree, so whether the pin still " +
	"holds is not known here. The project that was ported from runs that check itself.";

/** The last repository in a path, which is the name a page can print. */
function the_name_in(a_path) {
	return a_path.trim().split("/").filter((a_part) => a_part.length > 0).pop() ?? null;
}

/** The `owner/name` a path or an address ends in, when it looks like one. */
function the_owner_and_name_in(a_path) {
	const a_match = /github\.com[/:]([^/\s]+)\/([^/\s]+)/.exec(a_path) ?? null;
	if (a_match !== null) {
		return { owner: without_the_sentences_punctuation(a_match[1]), name: without_the_sentences_punctuation(a_match[2]) };
	}
	const the_name = the_name_in(a_path);
	return the_name === null ? null : { owner: null, name: the_name };
}

/**
 * A name without the punctuation of the sentence it was found in.
 *
 * **The real licence reads "a port of https://github.com/steamnoid/ai-sdlc-os," and the comma
 * is the sentence's.** An edge pointing at `ai-sdlc-os,` is a link to nothing, and a page
 * drawing one is drawing a project that does not exist.
 */
function without_the_sentences_punctuation(a_name) {
	return a_name.replace(/[.,;:)\]]+$/, "");
}

/** A short form of a commit, because a full sha is a thing nobody reads aloud. */
function the_shortest_commit_that_identifies(a_commit) {
	return a_commit === null ? null : a_commit.slice(0, 7);
}

/** An edge, or `null` for a line that recorded nothing a page could print. */
function the_edge_a_line_records(a_line, how_it_is_recorded) {
	const the_project = the_owner_and_name_in(a_line);
	if (the_project === null) {
		return null;
	}
	return {
		points_at: the_project.name,
		owner: the_project.owner,
		how_it_is_recorded,
		at_the_commit: null,
		on_the_branch: null,
		read_on: null,
		is_the_pin_still_held: null,
		why_the_pin_may_be_stale: null,
	};
}

/**
 * The edges a project records in a `SOURCES.lock`, and the commit each was read at.
 *
 * **Two kinds of line, and they are told apart by their own key.** `ported-from` is a
 * project this one was built from; `design-from` is a project whose interface it was
 * written against. A page that merged them would draw a port out of a design reference,
 * and the difference is the whole of how a reader decides what to trust.
 */
function the_edges_a_pin_records(the_text_of_a_sources_lock) {
	const what_a_line_says = (a_key) => {
		const a_found = new RegExp(`^#\\s*${a_key}:\\s*(\\S+)\\s*$`, "m").exec(the_text_of_a_sources_lock);
		return a_found?.[1] ?? null;
	};
	const the_edges = [];
	for (const a_line of the_text_of_a_sources_lock.split("\n")) {
		const a_source = /^#\s*ported-from:\s*(\S+)/.exec(a_line);
		const a_design = /^#\s*design-from:\s*(\S+)/.exec(a_line);
		if (a_source === null && a_design === null) {
			continue;
		}
		const is_it_a_port = a_source !== null;
		const the_edge = the_edge_a_line_records(
			a_line,
			is_it_a_port ? "a pin in SOURCES.lock" : "a design reference in SOURCES.lock",
		);
		if (the_edge === null) {
			continue;
		}
		the_edge.at_the_commit = the_shortest_commit_that_identifies(
			what_a_line_says(is_it_a_port ? "commit" : "design-commit"),
		);
		the_edge.on_the_branch = is_it_a_port ? what_a_line_says("branch") : null;
		the_edge.read_on = what_a_line_says(is_it_a_port ? "read-on" : "design-read-on");
		the_edge.is_the_pin_still_held = null;
		the_edge.why_the_pin_may_be_stale = WHY_A_PIN_MAY_BE_STALE;
		the_edges.push(the_edge);
	}
	return the_edges;
}

/** The edges a project's own licence names, which is a document like any other. */
function the_edges_a_licence_names(the_text_of_its_licence) {
	const the_edges = [];
	for (const a_line of the_text_of_its_licence.split("\n")) {
		if (!a_line.includes("github.com")) {
			continue;
		}
		const the_edge = the_edge_a_line_records(a_line, "a line in its own licence");
		if (the_edge !== null) {
			the_edges.push(the_edge);
		}
	}
	return the_edges;
}

/**
 * The edges a project records, and the reason it records none.
 *
 * **A project nothing was read about is `not read`**, which is not the same as a project
 * with no lineage: the first is this page's failure and the second is a fact about the
 * project worth printing.
 */
export function what_the_lineage_says(a_project) {
	if (!a_project || typeof a_project.name !== "string") {
		return { verdict: "not read", the_edges: [], why_not: null };
	}

	const the_edges = [
		...the_edges_a_pin_records(a_project.the_text_of_a_sources_lock ?? ""),
		...the_edges_a_licence_names(a_project.the_text_of_its_licence ?? ""),
	];

	if (the_edges.length > 0) {
		return { verdict: "read", the_edges, why_not: null };
	}

	const the_prose_mentions_a_sibling = /sibling project/i.test(a_project.the_prose_that_mentions_a_sibling ?? "");
	return {
		verdict: "names no other project",
		the_edges: [],
		why_not: the_prose_mentions_a_sibling
			? `${a_project.name} has no SOURCES.lock and its licence names no repository, and the documents of ` +
				`this project write about a sibling project without saying which one. The resemblance to the ` +
				"rest of the family is therefore asserted in prose and recorded in no file, which is a fact " +
				"about this project and not a gap in this page."
			: `${a_project.name} has no SOURCES.lock, its licence names no repository, and none of its ` +
				"documents name another project — so there is no file here that says where it came from.",
	};
}
