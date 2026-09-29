/** The counts a runner printed, read by that runner's own shape.
 *
 * **One "last line" rule serves `pytest` and does not serve `cargo`, and the proof is a
 * real run.** `pytest -q` ends with `449 passed, 12 skipped in 4.1s`, so the last line is
 * the summary. `cargo test` prints one `test result:` line per test binary — and its last
 * line is `Doc-tests aisdlc_gates`, which carries no counts at all. A reader that took
 * the last line from both reported **no counts for either Rust project**, and reported one
 * of them as green with nothing beside the word.
 *
 * | runner | where its summary is |
 * |---|---|
 * | `pytest` | the last line whatever it says |
 * | `cargo` | the last line that says `test result:` |
 *
 * **A count that was not printed is `null` and not zero.** A page reporting zero passed
 * beside a green suite is reporting a suite that does not exist, and the family has two
 * runners that print their counts in different shapes.
 */

import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { read_the_suite, the_counts_in } from "../scripts/read_a_suite.mjs";

/** What `pytest -q` ends with. */
const A_PYTEST_PRINTED = ".\n...........................................FF.......F...................\n1 failed, 449 passed, 12 skipped in 4.12s";

/** What `cargo test` ends with, taken from a real run of this family. */
const A_CARGO_PRINTED = [
	"running 3 tests",
	"test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s",
	"",
	"     Running tests/readability_guards.rs (target/debug/deps/readability_guards-c6c418a91f9ec97f)",
	"",
	"   Doc-tests aisdlc_gates",
	"",
].join("\n");

describe("a pytest run", () => {
	it("is read from its last line, whatever that line says", () => {
		const the_counts = the_counts_in(A_PYTEST_PRINTED, "python");
		assert.equal(the_counts.passed, 449);
		assert.equal(the_counts.failed, 1);
		assert.equal(the_counts.skipped, 12);
	});

	it("says nothing was deselected, rather than saying zero", () => {
		assert.equal(
			the_counts_in(A_PYTEST_PRINTED, "python").deselected,
			null,
			"a count the runner never printed was reported as zero. A page showing 0 deselected is " +
				"claiming a run deselected nothing, which is a fact about the run and not about the page.",
		);
	});
});

/** A whole `cargo test` over a workspace: many binaries, and doc-tests last. */
const A_CARGO_WORKSPACE_PRINTED = [
	"running 8 tests",
	"test result: ok. 110 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s",
	"",
	"     Running tests/readability_guards.rs (target/debug/deps/readability_guards-c6c418a91f9ec97f)",
	"",
	"running 22 tests",
	"test result: ok. 22 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s",
	"",
	"   Doc-tests aisdlc_gates",
	"",
	"running 0 tests",
	"test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s",
	"",
].join("\n");

describe("a cargo run", () => {
	it("adds up every test binary, because the last one is the doc-tests", () => {
		const the_counts = the_counts_in(A_CARGO_WORKSPACE_PRINTED, "rust");
		assert.equal(
			the_counts.passed,
			132,
			"the counts came from one binary rather than from all of them. A cargo run prints one " +
				"`test result:` line per test binary and the last of them is the doc-tests, which ran " +
				"nothing — so a reader taking the last line reported 0 passed beside a green suite, and " +
				"the real figure was 132.",
		);
		assert.equal(the_counts.how_many_binaries, 3);
	});

	it("adds up the failures across the binaries too", () => {
		const a_partly_red = A_CARGO_WORKSPACE_PRINTED.replace(
			"test result: ok. 22 passed; 0 failed;",
			"test result: FAILED. 20 passed; 2 failed;",
		);
		const the_counts = the_counts_in(a_partly_red, "rust");
		assert.equal(the_counts.failed, 2, "a failure in one binary was not counted");
		assert.equal(the_counts.passed, 130);
	});

	it("is read from the last line that says test result, not from the last line", () => {
		const the_counts = the_counts_in(A_CARGO_PRINTED, "rust");
		assert.equal(
			the_counts.passed,
			8,
			"the counts were not read. A cargo run ends with `Doc-tests aisdlc_gates` and no numbers at " +
				"all, and a reader taking the last line reported no counts for either Rust project in the " +
				"family — and reported one of them green with nothing beside the word.",
		);
	});

	it("keeps a real run's own numbers", () => {
		const the_counts = the_counts_in(A_CARGO_PRINTED, "rust");
		assert.equal(the_counts.failed, 0);
		assert.equal(the_counts.ignored, 0);
	});

	it("is read the same way when the run failed to compile", () => {
		// A compile failure is what a Rust project mid-change looks like, and the page has to
		// report it as not green with the compiler's own words rather than as a suite of nought.
		const a_compile_failure = "error[E0308]: mismatched types\n  error: could not compile `aisdlc`";
		assert.equal(
			the_counts_in(a_compile_failure, "rust").passed,
			null,
			"a compile failure was reported as a count. Nothing ran, and a page showing a number beside " +
				"it is reporting a suite that did not exist.",
		);
	});
});

describe("a run this reader does not know", () => {
	it("reports nothing rather than guessing", () => {
		const the_counts = the_counts_in("something entirely unexpected", "klingon");
		assert.deepEqual(
			[the_counts.passed, the_counts.failed, the_counts.skipped],
			[null, null, null],
			"a runner this page does not know was given counts. The point of naming the runner is that " +
				"a shape read by the wrong rule is a number nobody checked.",
		);
	});
});

/** A project whose suite runner prints whatever this test tells it to, and fails.
 *
 * **`/bin/sh -c` rather than a script with a shebang.** Executing a file out of a temporary
 * directory is refused on some machines for reasons that have nothing to do with what is being
 * tested, and a test that fails because of its own scaffolding is a test that cannot be read.
 */
function a_project_whose_suite_prints(what_it_should_print) {
	return {
		name: "a-project",
		language: "python",
		the_command_to_run: ["/bin/sh", "-c", `echo '${what_it_should_print}'; exit 1`],
	};
}

describe("the sentence that explains a verdict", () => {
	// **The timing was in the sentence, and the sentence is what the state holds.** A real run found
	// this: every run reported `has_changed=true` because the suite's own duration was inside the
	// sentence the verdict explains itself with, so a page that rebuilds hourly republished itself
	// every time — the entire cost the skip exists to avoid, paid for a fact about how long a suite
	// took rather than about the family.
	//
	// The fix is here rather than in the comparison because the comparison is right: a state's facts
	// are its facts. And the sentence stays, because a reader reads it — it just does not carry a
	// number that changes every run.
	const a_run_that_took_a_moment = "1 failed, 912 passed, 3 skipped in 4.12s";
	const a_run_that_took_a_while = "1 failed, 912 passed, 3 skipped in 19.87s";

	it("does not carry how long the suite took", () => {
		const the_first = read_the_suite(a_project_whose_suite_prints(a_run_that_took_a_moment), process.cwd(), true);
		assert.doesNotMatch(
			the_first.why_not,
			/\d+\.\d+s|\d+m\d|\b\d+s\b/,
			`the sentence a reader reads carries a duration: ${the_first.why_not}. Two runs of an unchanged ` +
				"family then differ, and a page that rebuilds itself republishes itself every time.",
		);
	});

	it("carries the exit code and the counts, so it still explains itself", () => {
		const the_run = read_the_suite(a_project_whose_suite_prints(a_run_that_took_a_moment), process.cwd(), true);
		assert.match(the_run.why_not, /exited 1/, "the sentence no longer says what the suite exited");
		assert.match(the_run.why_not, /912 passed/, "the sentence no longer says how many passed");
	});

	it("is the same sentence for two runs that differ only in how long they took", () => {
		const the_first = read_the_suite(a_project_whose_suite_prints(a_run_that_took_a_moment), process.cwd(), true);
		const the_second = read_the_suite(a_project_whose_suite_prints(a_run_that_took_a_while), process.cwd(), true);
		assert.equal(
			the_first.why_not,
			the_second.why_not,
			"two runs of a family that changed nothing produced two different explanations, and that is " +
				"what makes a page that updates itself republish itself every single time.",
		);
	});
});
