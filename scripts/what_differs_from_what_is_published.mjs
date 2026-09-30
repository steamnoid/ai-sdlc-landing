/** Read the state this run made, ask the live site what is already published, and say
 * whether the run is worth publishing.
 *
 * **The live site is the previous state.** That is what makes the answer need no previous
 * run, no token and no deployment history — and it is also what makes it checkable by hand:
 * a reader who wants to know why the page did or did not update can ask the same question
 * the workflow asked.
 *
 * **A state that cannot be read is a change, never agreement.** A site with nothing published
 * yet, a 404, a rate limit — every one of those means the comparison did not happen, and
 * reporting it as "no change" is how a page quietly stops updating while everything it
 * describes keeps moving. Publishing again is cheap and being wrong is not.
 *
 * **The verdict goes to `$GITHUB_OUTPUT` and to stdout**, because a run on a laptop should
 * say the same thing as a run on a runner, and the reason goes to stderr so it is not
 * mistaken for the verdict.
 */

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { what_differs_between } from "./compare_the_states.mjs";

/** Where the state is, and where the live page keeps the one it was built from. */
const THE_STATE = "src/state/the_family.json";
const WHAT_IS_PUBLISHED_AT = "https://steamnoid.github.io/ai-sdlc-landing/the_family.json";

/**
 * What each project's own list gained and lost since the state the site already publishes.
 *
 * **A difference is not a movement.** `what_differs_between` answers "is this the same page",
 * and it answers it about suites, licences, commit pins and the date a tree was read — most of
 * which change on every run. A reader asking what got finished is asking a narrower question,
 * and this is the answer to it: the only thing on this page that moves when somebody does the
 * work.
 *
 * **An item is its own words, and not the number of the row it sits in.** Every project inserts
 * a row above the others at some point, and a comparison keyed on the number would report
 * nothing below that insertion — which is where the new work is.
 *
 * **Both directions, because a page that prints only progress is a bias.** A strikethrough taken
 * back out of a document is a thing that happened and the page says nothing about it, which is
 * how a page becomes a place where bad news does not appear.
 *
 * **A project with no previous reading says so and names nothing.** Everything in it is new, and
 * a page that reported a whole project as having got things done on its first appearance would
 * be right by accident and wrong on every run after.
 */
export function what_became_done_between(the_state_now, what_was_published) {
	const what_was_there = what_the_projects_hold(what_was_published);
	return what_the_projects_hold(the_state_now).map((a_project) => {
		const the_before = what_was_there.find((a_previous) => a_previous.name === a_project.name);
		const now = the_items_a_project_holds(a_project);
		const before = the_before === undefined ? undefined : the_items_a_project_holds(the_before);

		// **Absent and unread are the same answer, and both arrive as different values.** A project
		// the previous read did not hold gives `undefined`; a project whose backlog was not readable
		// gives `null`. Checking one of them let the other through into a `Map` built on nothing.
		if (now === null || before === null || before === undefined) {
			return { name: a_project.name, was_in_the_previous_read: false, became_done: [], became_owed: [] };
		}

		const was_it_done_before = new Map(before.map((an_item) => [an_item.the_slice, an_item.is_done]));
		return {
			name: a_project.name,
			was_in_the_previous_read: true,
			became_done: now
				.filter((an_item) => an_item.is_done && was_it_done_before.get(an_item.the_slice) !== true)
				.map((an_item) => an_item.the_slice),
			became_owed: now
				.filter((an_item) => !an_item.is_done && was_it_done_before.get(an_item.the_slice) === true)
				.map((an_item) => an_item.the_slice),
		};
	});
}

const what_the_projects_hold = (a_state) =>
	Array.isArray(a_state?.the_family) ? a_state.the_family : [];

/**
 * Every item of a project's own list, or `null` when the project has no list to read.
 *
 * A backlog the reader could not find is not an empty backlog, and the difference decides whether
 * a project is reported as one that did not move or as one nobody has ever read.
 */
function the_items_a_project_holds(a_project) {
	const the_phases = a_project?.what_its_documents_say?.phases;
	if (the_phases?.verdict !== "read" || !Array.isArray(the_phases.phases)) {
		return null;
	}
	const the_items = the_phases.phases.flatMap((a_phase) =>
		Array.isArray(a_phase.the_items) ? a_phase.the_items : [],
	);
	return the_items.length === 0 ? null : the_items;
}

const the_flags_in = (process_arguments) => {
	const what_was_asked_for = {};
	for (let where_it_is = 0; where_it_is < process_arguments.length; where_it_is += 1) {
		if (!process_arguments[where_it_is].startsWith("--")) {
			continue;
		}
		what_was_asked_for[process_arguments[where_it_is].slice(2).replace(/-/g, "_")] =
			process_arguments[where_it_is + 1] ?? true;
		where_it_is += 1;
	}
	return what_was_asked_for;
};

async function main() {
	const what_was_asked_for = the_flags_in(process.argv.slice(2));
	const where_the_state_is = resolve(what_was_asked_for.state ?? THE_STATE);
	const where_the_state_is_published = what_was_asked_for.published_at ?? WHAT_IS_PUBLISHED_AT;
	const the_state = JSON.parse(readFileSync(where_the_state_is, "utf8"));

	const the_previous = await (async () => {
		try {
			const the_answer = await fetch(where_the_state_is_published, { headers: { accept: "application/json" } });
			if (!the_answer.ok) {
				return { was_read: false, why_not: `the site answered ${the_answer.status}` };
			}
			return { was_read: true, why_not: null, the_state: await the_answer.json() };
		} catch (the_problem) {
			return { was_read: false, why_not: `the site could not be reached: ${the_problem.message}` };
		}
	})();

	let has_changed;
	let why;
	if (!the_previous.was_read) {
		has_changed = true;
		why = `no comparison was possible — ${the_previous.why_not} — so this is published rather than skipped`;
	} else {
		const the_differences = what_differs_between(the_previous.the_state, the_state);
		has_changed = the_differences.length > 0;
		why =
			the_differences.length === 0
				? "every fact on the page is the fact already published"
				: `${the_differences.length} fact${the_differences.length === 1 ? "" : "s"} differ, starting with ${the_differences[0]}`;
	}

	process.stdout.write(`has_changed=${has_changed}\n`);
	process.stderr.write(`${why}\n`);
	if (process.env.GITHUB_OUTPUT !== undefined) {
		appendFileSync(process.env.GITHUB_OUTPUT, `has_changed=${has_changed}\n`);
	}

	write_what_moved_beside_the_state(what_was_asked_for, the_state, the_previous);
	return 0;
}

/**
 * The movement, written beside the state so the page can print it.
 *
 * **One comparison, two answers, and that is why it is here rather than in a second script.**
 * Whether to publish and what moved are both answers to "how does this state differ from the one
 * the site publishes", and asking twice would mean fetching twice — with a deployment landing
 * between the two calls and the page then describing a change against a state that is no longer
 * on the site.
 *
 * **A file next to the state, and not a field inside it.** The state is a reading of four
 * repositories and a field about the page's own history does not belong in it; a comparison that
 * wrote into the state would make every run a difference from the last, because the file now
 * describes the previous run as well as the family.
 *
 * **A comparison that could not be made is written down as one.** The page prints nothing about
 * movement, and the file says why, so the absence is a recorded fact rather than a state a reader
 * has to guess at.
 */
function write_what_moved_beside_the_state(what_was_asked_for, the_state, the_previous) {
	const where_it_should_land = resolve(what_was_asked_for.moved ?? "src/state/what_moved.json");
	const what_to_write =
		the_previous.was_read === true
			? {
					was_compared: true,
					why_not: null,
					compared_with: {
						read_at: the_previous.the_state?.the_build?.read_at ?? null,
						where: WHAT_IS_PUBLISHED_AT,
					},
					the_projects: what_became_done_between(the_state, the_previous.the_state),
				}
			: { was_compared: false, why_not: the_previous.why_not, compared_with: null, the_projects: [] };

	mkdirSync(dirname(where_it_should_land), { recursive: true });
	writeFileSync(where_it_should_land, `${JSON.stringify(what_to_write, null, "\t")}\n`);
	process.stderr.write(`wrote ${where_it_should_land}\n`);
}

process.exitCode = await main().catch((the_refusal) => {
	process.stderr.write(`${the_refusal.name ?? "Error"}: ${the_refusal.message}\n`);
	return 1;
});
