/** The page says in words that it was built with nothing to say.
 *
 * **This is the first thing the page has to get right, and it is a test rather than a
 * habit.** A page about work in progress that renders an empty section is making a
 * claim: that there is nothing to report. On this page that claim is false four times
 * over — the four projects each have a stage table, a history and a licence — so an
 * empty section is a page that is lying about being finished.
 *
 * **A missing state is a value, not an absence**, and this is the whole arrangement:
 * `the_state` is a build artifact that is never committed, so a fresh clone has none,
 * and a reader who builds without running `npm run collect` first must be told that
 * rather than shown four blank cards.
 */

import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { build_the_page, the_words_on_the_page } from "./build_the_page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const at = join(here, "..");

describe("a page built with no state", () => {
	let the_words = "";
	let the_markup = "";
	let where_it_went = "";

/** A build directory that is taken away again when this block is over. */
	const a_directory_to_build_into = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-"));
	after(() => rmSync(a_directory_to_build_into, { recursive: true, force: true }));

	before(() => {
		// The state in the tree is moved aside rather than required to be absent, so this test
		// means the same thing on a fresh clone and on a working tree a collector has already
		// read — which is where it started failing, after the first real run.
		where_it_went = build_the_page(at, a_directory_to_build_into, { none: true });
		the_words = the_words_on_the_page(where_it_went);
		the_markup = readFileSync(where_it_went, "utf8");
	});

	it("says that it has nothing to say, in words", () => {
		assert.match(
			the_words,
			/no state/i,
			"a page built without a state must say so, and it said nothing of the kind. A reader " +
				"who finds four empty sections learns that the family has nothing to report, which is " +
				"false, and learns it from a page whose whole argument is that it does not print " +
				"unfounded things.",
		);
	});

	it("says which command would give it something to say", () => {
		assert.match(
			the_words,
			/npm run collect/,
			"the page says it has no state and does not say what to do about it. The runbook " +
				"here is one command, and a reader who is not told it will send an empty page to " +
				"somebody who wanted a number.",
		);
	});

	it("does not print a project card with no project in it", () => {
		assert.doesNotMatch(
			the_words,
			/undefined|NaN|\[object Object\]/,
			"the page rendered a value that was never read. A missing fact rendered as `undefined` " +
				"is the shape a page takes when it decides to print a blank rather than say why.",
		);
	});

	it("does not print a section heading for a section it has nothing for", () => {
		// **The markup, not the words.** A navigation link carries the same text as a section
		// and is present on every build, so a test that searched the page's text for a heading
		// failed on a build that had rendered no sections at all — and would have kept
		// failing for a reason that has nothing to do with what it is checking.
		const the_headings = the_markup.match(/<h2[^>]*>([^<]*)</g) ?? [];
		for (const a_heading_text of ["How they differ", "One domain, four times over", "The family"]) {
			assert.ok(
				!the_headings.some((a_heading) => a_heading.includes(a_heading_text)),
				`the page printed the heading "${a_heading_text}" with no state behind it. A heading with ` +
					"nothing under it reads as a section that was considered and found empty, which is " +
					"exactly the claim the page must not make.",
			);
		}
	});
});

describe("a page built with a state", () => {
	const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-"));
	after(() => rmSync(a_directory, { recursive: true, force: true }));

	const a_state = {
		the_family: [
			{
				owner: "steamnoid",
				name: "ai-sdlc-os",
				was_read: true,
				why_not: null,
			},
		],
	};

	it("prints the project it read, and nothing about the ones it did not", () => {
		const where_it_went = build_the_page(at, a_directory, { write: a_state });
		const the_words = the_words_on_the_page(where_it_went);
		assert.match(the_words, /ai-sdlc-os/);
		assert.doesNotMatch(the_words, /no state/i);
	});
});

describe("the page does not read the state file at build time when it is given one", () => {
	const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-"));
	after(() => rmSync(a_directory, { recursive: true, force: true }));

	it("prints a project that is not on disk anywhere in this repository", () => {
		const where_it_went = build_the_page(at, a_directory, {
			write: {
				the_family: [{ owner: "nobody", name: "a-project-that-was-never-checked-out", was_read: true }],
			},
		});
		const the_words = the_words_on_the_page(where_it_went);
		assert.match(
			the_words,
			/a-project-that-was-never-checked-out/,
			"the page could not print a project that was in the state. It rendered the state " +
				"somewhere other than through the file, so what is on the page and what was read " +
				"are two different things.",
		);
		assert.equal(
			readFileSync(where_it_went, "utf8").includes("undefined"),
			false,
			"the page rendered a value it never had.",
		);
	});
});

describe("the directory the build moves aside, and what it puts back", () => {
	// **It put back one file out of a whole directory.** `build_the_page(at, where, { none: true })`
	// removes `src/state` — every file in it — and then restores only `the_family.json`. So the first
	// time this repository grew a second file in that directory, a green `npm run test:page` deleted
	// it. Nothing was red: the run that wrote it had already finished, and the run that published it
	// would have found the evidence gone.
	//
	// The build job runs `test:page` against the state that same run produced, so a helper that
	// clears a directory and restores one file out of it is deleting the run's own work and calling
	// it a green build.
	it("puts back every file it moved aside, and not only the state", () => {
		const the_directory = join(at, "src", "state");
		mkdirSync(the_directory, { recursive: true });
		const a_file_of_our_own = join(the_directory, "what_moved.json");
		const there_was_one = existsSync(a_file_of_our_own);
		const what_was_there = there_was_one ? readFileSync(a_file_of_our_own, "utf8") : null;
		writeFileSync(a_file_of_our_own, '{"was_compared":true}\n');

		try {
			build_the_page(at, mkdtempSync(join(tmpdir(), "ai-sdlc-landing-none-")), { none: true });

			assert.ok(
				existsSync(a_file_of_our_own),
				"building the page with no state deleted a file that had nothing to do with the state. " +
					"`npm run test:page` runs in the build job against the state that run produced, so this " +
					"is a green test run deleting the run's own work.",
			);
		} finally {
			// **Put back whatever was there, not merely remove ours.** The first version of this test
			// deleted the file unconditionally and was itself the thing deleting the run's evidence —
			// which is why the fix below took two attempts to find: the helper was repaired, and the
			// test that was testing the helper kept doing the damage.
			rmSync(a_file_of_our_own, { force: true });
			if (what_was_there !== null) {
				writeFileSync(a_file_of_our_own, what_was_there);
			}
		}
	});
});

