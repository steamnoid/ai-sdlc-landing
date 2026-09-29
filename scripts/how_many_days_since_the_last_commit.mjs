/** How many days ago a commit was, as a whole number.
 *
 * **This exists because the line it replaced was wrong and nothing noticed for a day.** It
 * was an `awk` one-liner inside the workflow's own YAML: it called `mktime` with seven
 * arguments where gawk takes six, and the arithmetic failed on the first scheduled run that
 * reached it, with `6 is invalid as number of arguments for mktime` in the log. It had been
 * in the file since the repository was pushed and had never been executed by anything,
 * because a workflow only runs when a project moves.
 *
 * **A script can be run by a test on demand.** That is the whole difference, and it is why
 * the calculation is here rather than where it was.
 *
 * **Node rather than `date`, and that is not a preference.** `date -d` is GNU and macOS
 * spells it `-v`, so a shell version of this would be correct on the runner and broken on
 * the machine of anybody reading it — and a test that only passes in CI is a test that only
 * runs sometimes. The repository already depends on Node, the workflow installs it, and one
 * implementation then behaves identically in both places.
 *
 *     node scripts/how_many_days_since_the_last_commit            # the last commit of this checkout
 *     node scripts/how_many_days_since_the_last_commit 2026-01-01 # any date, for a test
 */

import { spawnSync } from "node:child_process";

const A_DAY_IN_SECONDS = 24 * 60 * 60;

/** The date the last commit of this checkout was made, or a refusal naming why there is none. */
export function the_date_of_the_last_commit(at) {
	const the_answer = spawnSync("git", ["log", "-1", "--format=%cI"], {
		cwd: at,
		encoding: "utf8",
	});
	if (the_answer.status !== 0) {
		return { was_read: false, why_not: `this directory is not a checkout: ${the_answer.stderr.trim()}` };
	}
	return { was_read: true, why_not: null, the_date: the_answer.stdout.trim() };
}

/**
 * How many whole days ago a date was, and a refusal rather than a number if it cannot be read.
 *
 * **A refusal and not a zero, because both of the wrong answers are silent.** A keepalive that
 * counts days from something unparseable and answers zero never pushes a commit; one that
 * answers a big number pushes one every single run. Neither says anything, and the workflow
 * would read either as a verdict.
 */
export function the_days_since(a_date, at = process.cwd()) {
	const the_when = Date.parse(a_date);
	if (Number.isNaN(the_when)) {
		return { was_counted: false, why_not: `${a_date} is not a date this can read` };
	}
	return { was_counted: true, why_not: null, how_many: Math.floor((Date.now() - the_when) / 86_400_000) };
}

/** The last commit's age, which is the number the workflow acts on. */
export function how_many_days_since_the_last_commit(at = process.cwd()) {
	const the_commit = the_date_of_the_last_commit(at);
	if (!the_commit.was_read) {
		return { was_counted: false, why_not: the_commit.why_not };
	}
	return the_days_since(the_commit.the_date, at);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const what_was_asked_for = process.argv[2];
	const the_answer =
		what_was_asked_for === undefined ? how_many_days_since_the_last_commit() : the_days_since(what_was_asked_for);
	if (!the_answer.was_counted) {
		process.stderr.write(`${the_answer.why_not}\n`);
		process.exitCode = 1;
	} else {
		process.stdout.write(`${the_answer.how_many}\n`);
	}
}

export { A_DAY_IN_SECONDS };
