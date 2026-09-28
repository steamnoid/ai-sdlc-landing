/** Which project came from which, and what the file that says so is worth.
 *
 * **A shell, so this cycle's tests can fail on an edge rather than on a file.**
 *
 * The sharpest finding in this repository so far is an asymmetry: three of the four
 * projects write about "the sibling project" and never name it, and one records two
 * named repositories in a file with a commit, a branch and a date for each. A reader who
 * drew a lineage graph from the prose would be drawing one nothing can check.
 *
 * **A pin is a promise about a moment, and the moment is what is printed.** This page
 * reads one repository and cannot re-hash a sibling's tree, so what it says is the pin
 * and not the agreement — "read from this commit" is a different claim from "still matches
 * it", and a reader of a family overview is exactly the person who needs the difference.
 */

export class TheLineageIsNotReadableError extends Error {
	constructor(why) {
		super(why);
		this.name = "TheLineageIsNotReadableError";
	}
}

/** The edges a project records, or the reason it records none. */
export function what_the_lineage_says(a_project) {
	if (!a_project || a_project.name === undefined) {
		return { verdict: "not read", the_edges: [], why_not: null };
	}
	throw new TheLineageIsNotReadableError(`the reader cannot yet read the lineage of ${a_project.name}.`);
}
