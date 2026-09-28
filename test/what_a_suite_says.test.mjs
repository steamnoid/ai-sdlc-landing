/** The suite of one project, and the command that was run to find out.
 *
 * **A suite is green when it exited zero, and not when it passed a lot.** A run that
 * printed `1 failed, 449 passed` is a run that failed, and the counts are kept when it
 * did so that a reader can check the verdict against their own run. A run that was never
 * asked to run is a third thing again, and it says which flag would run it.
 *
 * **The command is part of the answer, not a detail of running it.** A page that says a
 * project is green is making a claim about a particular invocation of a particular test
 * runner, and a reader who cannot see the invocation is being asked to take it on trust.
 * Every real project in this family runs a different command in a different language, and
 * two of the four run the same command with different arguments.
 *
 * | verdict | what it means | what it must never be confused with |
 * |---|---|---|
 * | `green` | the suite exited zero | a suite that printed a lot of passes |
 * | `not green` | the suite exited something else | a suite that mostly passed |
 * | `not run` | the suite was never asked to run | a suite that failed |
 * | `unread` | no runner was found for this project | a project with no tests |
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { what_the_suite_says } from "../src/page/what_the_page_says.mjs";

/** What a run that exited zero looks like in the state. */
const A_GREEN_RUN = {
	was_run: true,
	is_green: true,
	exit_code: 0,
	passed: 449,
	failed: null,
	skipped: 12,
	deselected: null,
	why_not: "the suite exited 0, and only an exit code of 0 is green",
	what_it_printed: "449 passed, 12 skipped in 4.1s",
	what_was_run: "uv run pytest -q",
};

/** What a run that printed a great deal and still failed looks like. */
const A_RED_RUN = {
	was_run: true,
	is_green: false,
	exit_code: 1,
	passed: 449,
	failed: 1,
	skipped: null,
	deselected: null,
	why_not: "the suite exited 1, and only an exit code of 0 is green: 1 failed, 449 passed in 4.1s",
	what_it_printed: "1 failed, 449 passed in 4.1s",
	what_was_run: "cargo test --workspace --no-fail-fast",
};

describe("a suite that exited zero", () => {
	const the_suite = what_the_suite_says(A_GREEN_RUN);

	it("is green, because of the exit code and nothing else", () => {
		assert.equal(the_suite.verdict, "green");
		assert.equal(the_suite.passed, 449);
	});

	it("carries the command that was run, because a verdict is about an invocation", () => {
		assert.equal(
			the_suite.what_was_run,
			"uv run pytest -q",
			"the answer does not say what was run. Four projects in two languages run four different " +
				"commands, and a page saying one of them is green without saying which is asking a reader " +
				"to take it on trust.",
		);
	});

	it("carries the counts, including the ones that are not failures", () => {
		assert.equal(the_suite.skipped, 12);
	});
});

describe("a suite that printed a great deal and failed", () => {
	const the_suite = what_the_suite_says(A_RED_RUN);

	it("is not green, however many passed", () => {
		assert.equal(
			the_suite.verdict,
			"not green",
			"a run that passed 449 tests and failed one was called green. It is not, and the exit code " +
				"is the only thing that settles it.",
		);
	});

	it("keeps the number that passed, because hiding it would hide the failure", () => {
		assert.equal(
			the_suite.passed,
			449,
			"the number that passed was dropped from a run that failed. A reader checking the verdict " +
				"against their own run is given 1 failed and nothing else, and cannot tell how much of the " +
				"suite was even reached.",
		);
		assert.equal(the_suite.failed, 1);
	});

	it("says the exit code in words", () => {
		assert.match(the_suite.detail, /exited 1/);
	});

	it("carries what the suite printed, byte for byte", () => {
		assert.equal(
			the_suite.what_it_printed,
			"1 failed, 449 passed in 4.1s",
			"the page does not show what the suite printed. A verdict with no output beside it is a claim " +
				"a reader can only take on trust, which is the thing this repository exists to refuse.",
		);
	});
});

describe("a suite that was never asked to run", () => {
	const the_suite = what_the_suite_says({ was_run: false, why_not: "pass --run-the-suites to run it" });

	it("is not run, which is neither green nor failed", () => {
		assert.equal(the_suite.verdict, "not run");
		assert.equal(
			the_suite.passed,
			null,
			"a suite that never ran was given a number. Zero passed and null passed look identical in a " +
				"count and mean opposite things: a project with no tests, and a project whose tests were " +
				"not asked for.",
		);
	});

	it("says what would run it", () => {
		assert.match(the_suite.detail, /--run-the-suites/);
	});

	it("carries no command, because none was run", () => {
		assert.equal(the_suite.what_was_run, null);
	});
});

describe("a project with no runner that could be found", () => {
	it("is unread, and is not a project with no tests", () => {
		const the_suite = what_the_suite_says({
			was_run: false,
			why_not: "no runner is declared for a project written in klingon",
		});
		assert.equal(the_suite.verdict, "not run");
		assert.match(
			the_suite.detail,
			/klingon/,
			"the answer does not say which project had no runner. A page showing four projects and three " +
				"counts has to be able to say which of the four is missing one.",
		);
	});
});

describe("a state that holds no suite at all", () => {
	it("is not run, rather than throwing", () => {
		assert.equal(what_the_suite_says(undefined).verdict, "not run");
		assert.equal(what_the_suite_says(null).verdict, "not run");
	});
});
