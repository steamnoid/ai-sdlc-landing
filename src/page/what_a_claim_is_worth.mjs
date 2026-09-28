/** What a claim a project's documents make is worth, judged against its tree.
 *
 * **A claim in prose is either checkable or it is decoration.** "There is no production code
 * here yet" is a claim about a tree, and a tree is countable — which is the only reason a
 * reader of a hand-written document can hold it to anything. This file is what makes the
 * document in `docs/` checkable.
 *
 * **The verdict is one of four, and the fourth is the important one.**
 *
 * | verdict | what it means |
 * |---|---|
 * | `true` | the tree holds what the document says |
 * | `refuted` | the tree holds something else |
 * | `not checked` | the shape of the claim is one this reader does not judge |
 * | `the project is not on this machine` | nothing could be said about it at all |
 *
 * **The last is not `not checked`, and the difference matters.** A claim about a project that
 * is not checked out here is not a claim that has been examined and found unjudgeable — it is
 * a claim nobody looked at, and a green run that reported it as fine would be the exact lie
 * this repository exists to refuse.
 *
 * **A claim about a count is compared by counting, and a claim about emptiness by looking.**
 * Those are the two shapes the family actually makes, and they are the two this file judges;
 * anything else is `not checked` rather than a guess.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Directories a build leaves behind, which are never the project's own source. */
const NOT_SOURCE = new Set(["target", ".git", "node_modules", "build", "dist", ".astro", ".venv", "docs"]);

/** Every file under a project, skipping what a build and a checkout leave behind. */
function every_file_under(a_directory) {
	const found = [];
	for (const an_entry of readdirSync(a_directory, { withFileTypes: true })) {
		if (NOT_SOURCE.has(an_entry.name)) {
			continue;
		}
		const its_path = join(a_directory, an_entry.name);
		if (an_entry.isDirectory()) {
			found.push(...every_file_under(its_path));
			continue;
		}
		found.push(its_path);
	}
	return found;
}

/** The directories a Rust project's crates live in, when it has any. */
const the_places_its_code_lives = (a_project) =>
	[join(a_project, "src"), join(a_project, "crates")].filter((a_place) => existsSync(a_place));

/** How many lines of a project's own code it holds, which is the thing "no code" denies. */
function the_lines_of_code(a_project) {
	return the_places_its_code_lives(a_project)
		.flatMap((a_place) => every_file_under(a_place))
		.filter((a_path) => a_path.endsWith(".py") || a_path.endsWith(".rs"))
		.reduce((a_total, a_path) => a_total + readFileSync(a_path, "utf8").split("\n").length, 0);
}

/** How many of a project's own test functions it holds. */
function the_tests_it_holds(a_project) {
	const the_places_tests_live = [join(a_project, "tests"), join(a_project, "src")];
	const the_test_files = the_places_tests_live
		.filter((a_place) => existsSync(a_place))
		.flatMap((a_place) => every_file_under(a_place))
		.filter((a_path) => /(^|[\\/])(tests?[\\/])/.test(a_path) || a_path.includes("/tests."));
	const what_it_declares = the_test_files
		.map((a_path) => readFileSync(a_path, "utf8").match(/^\s*(?:async )?(?:def test_|fn )/gm) ?? [])
		.flat();
	return what_it_declares.length;
}

/**
 * The shapes of claim that say a tree is empty, which is the one the family keeps making.
 *
 * **Three wordings, because three projects word it three ways**: "no production code here
 * yet", "nothing to run", and "still empty on purpose". All three are claims about a tree
 * and all three are countable, which is the only reason a reader can hold any of them to
 * anything.
 */
const A_CLAIM_THAT_NOTHING_IS_BUILT =
	/\bno (?:production )?code\b|\bnothing to \*?run\b|\bnot built yet\b|\bstill empty\b|\bis empty\b/i;
const A_CLAIM_OF_A_COUNT = /\b(\d+)\s+(tests?|modules?|files?|crates?|gates?)\b/i;

/** What a claim is worth, judged against the tree of the project it is about. */
export function what_a_claim_is_worth(a_project_name, what_the_document_says, where_the_projects_are) {
	const the_project = join(where_the_projects_are, a_project_name);
	if (!existsSync(the_project) || !statSync(the_project).isDirectory()) {
		return "the project is not on this machine";
	}

	if (A_CLAIM_THAT_NOTHING_IS_BUILT.test(what_the_document_says)) {
		const it_holds = the_lines_of_code(the_project);
		return it_holds === 0 ? "true" : "refuted";
	}

	const a_count = A_CLAIM_OF_A_COUNT.exec(what_the_document_says);
	if (a_count !== null) {
		const what_of_them = a_count[2];
		const it_holds =
			what_of_them.startsWith("test")
				? the_tests_it_holds(the_project)
				: every_file_under(the_project).filter((a_path) => /\.(py|rs)$/.test(a_path)).length;
		return Number(a_count[1]) === it_holds ? "true" : "refuted";
	}

	return "not checked";
}
