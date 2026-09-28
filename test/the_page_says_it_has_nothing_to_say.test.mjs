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
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { build_the_page, the_words_on_the_page } from "./build_the_page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const at = join(here, "..");
const where_the_state_lives = join(at, "src", "state", "the_family.json");

describe("a page built with no state", () => {
	let the_words = "";

	before(() => {
		assert.equal(
			existsSync(where_the_state_lives),
			false,
			`there is a state at ${where_the_state_lives}, and this test is about a build with ` +
				"none. A committed state is a number nobody checked — delete it, or run this against a tree " +
				"that has none.",
		);
		const where_it_went = build_the_page(at, mkdtempSync(join(tmpdir(), "ai-sdlc-landing-")));
		the_words = the_words_on_the_page(where_it_went);
		after(() => rmSync(dirname(where_it_went), { recursive: true, force: true }));
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
		for (const a_heading of ["How they differ", "Where each one stands"]) {
			assert.ok(
				!the_words.includes(a_heading),
				`the page printed the heading "${a_heading}" with no state behind it. A heading with ` +
					"nothing under it reads as a section that was considered and found empty, which is " +
					"exactly the claim the page must not make.",
			);
		}
	});
});

describe("a page built with a state", () => {
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
		const where_it_went = build_the_page(at, mkdtempSync(join(tmpdir(), "ai-sdlc-landing-")), a_state);
		const the_words = the_words_on_the_page(where_it_went);
		after(() => rmSync(dirname(where_it_went), { recursive: true, force: true }));
		assert.match(the_words, /ai-sdlc-os/);
		assert.doesNotMatch(the_words, /no state/i);
	});
});

describe("the page does not read the state file at build time when it is given one", () => {
	it("prints a project that is not on disk anywhere in this repository", () => {
		const where_it_went = build_the_page(
			at,
			mkdtempSync(join(tmpdir(), "ai-sdlc-landing-")),
			{
				the_family: [
					{ owner: "nobody", name: "a-project-that-was-never-checked-out", was_read: true },
				],
			},
		);
		const the_words = the_words_on_the_page(where_it_went);
		after(() => rmSync(dirname(where_it_went), { recursive: true, force: true }));
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
