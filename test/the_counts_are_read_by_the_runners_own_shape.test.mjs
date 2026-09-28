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
import { describe, it } from "node:test";

import { the_counts_in } from "../scripts/read_a_suite.mjs";

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
