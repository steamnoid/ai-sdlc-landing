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

import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { what_differs_between } from "./compare_the_states.mjs";

/** Where the state is, and where the live page keeps the one it was built from. */
const THE_STATE = "src/state/the_family.json";
const WHAT_IS_PUBLISHED_AT = "https://steamnoid.github.io/ai-sdlc-landing/the_family.json";

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
	const where_it_is_published = what_was_asked_for.published_at ?? WHAT_IS_PUBLISHED_AT;
	const the_state = JSON.parse(readFileSync(where_the_state_is, "utf8"));

	const the_previous = await (async () => {
		try {
			const the_answer = await fetch(where_it_is_published, { headers: { accept: "application/json" } });
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
	return 0;
}

process.exitCode = await main().catch((the_refusal) => {
	process.stderr.write(`${the_refusal.name ?? "Error"}: ${the_refusal.message}\n`);
	return 1;
});
