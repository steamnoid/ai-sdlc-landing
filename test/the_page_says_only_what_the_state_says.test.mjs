/** The page says only what the state says.
 *
 * **This is the test that makes the page's argument true rather than claimed.** The rule
 * the whole repository is built on is that a fact on the page was generated from a
 * repository, and the way a page breaks that rule is by looking perfect: a stage typed
 * into the template, a count that was right when it was written, a sentence that reads
 * better than the state does. None of it fails a build. All of it is wrong the day a
 * project moves, and nothing says so.
 *
 * **So the page is built and read as a reader reads it, and then the state is used to
 * ask questions about it.** The tests below are not about the template; they are about
 * whether what came out of it could have been typed.
 *
 * Five ways a page gets this wrong, and one test for each:
 *
 * | it could have been | what the test does |
 * |---|---|
 * | a hand-typed stage | asserts every stage in the state is on the page |
 * | a hand-typed count | asserts the count of cards equals the count in the state |
 * | a hand-typed project | asserts every project in the state is on the page |
 * | a hand-typed verdict | asserts the page's words come from the verdict function |
 * | a number welded to a word | asserts the sentence, not just the digits |
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { build_the_page, the_words_on_the_page } from "./build_the_page.mjs";
import { what_the_family_declares } from "../src/page/what_the_family_declares.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const at = join(here, "..");

/**
 * A state this test collected, over the four fixture projects, with no suite run.
 *
 * **It used to read `src/state/the_family.json` and refuse to run without it**, which made it
 * the second of the two tests a fresh clone runs red. Every assertion in this file is relative
 * to the state — the page must print what the state holds and nothing else — and relative to a
 * state is a thing a test has to bring or a thing it can only hope for.
 *
 * **A real state from the real collector, and not a fixture JSON.** The four trees under
 * `test/fixtures` are committed, so this is a genuine reading of a family that never moves, and
 * the collector is the same one the page is built about. `--without-the-suites` is what makes
 * it cheap: the state is the same shape with the counts blank, and the counts are not what
 * this file is about.
 */
const THE_FAMILY_THAT_IS_COMMITTED = [
	{ owner: "steamnoid", name: "a_python_project", language: "python", interpreter: "python3" },
	{ owner: "steamnoid", name: "a_python_project_with_another_name_for_the_move_table", language: "python", interpreter: "python3" },
	{ owner: "steamnoid", name: "a_rust_project", language: "rust" },
	{ owner: "steamnoid", name: "a_rust_project_with_a_workspace", language: "rust" },
];

/** Collect the fixtures into a directory, and hand back the path and the way to take it away. */
function collect_the_fixtures() {
	const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-state-"));
	const the_state_path = join(a_directory, "the_family.json");
	const the_answer = spawnSync(
		process.execPath,
		[
			join(at, "scripts", "ask_the_family.mjs"),
			"--where",
			join(here, "fixtures"),
			"--out",
			the_state_path,
			"--without-the-suites",
			"--family",
			JSON.stringify(THE_FAMILY_THAT_IS_COMMITTED),
		],
		{ cwd: at, encoding: "utf8" },
	);
	if (the_answer.status !== 0) {
		throw new Error(`the collector could not read the fixtures, and said:\n${the_answer.stderr}`);
	}
	return { the_state_path, afterwards: () => rmSync(a_directory, { recursive: true, force: true }) };
}

const what_was_collected = collect_the_fixtures();
after(() => what_was_collected.afterwards());

{
	describe("a page built from a state that was read", () => {
		const the_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		const the_verdict = what_the_family_declares(the_state);
		let the_words = "";
		let the_markup = "";
		let where_the_page_landed = "";

		before(() => {
			where_the_page_landed = build_the_page(at, join(at, "dist"), { write: the_state });
			the_markup = readFileSync(where_the_page_landed, "utf8");
			the_words = the_words_on_the_page(where_the_page_landed);
		});

		it("prints every project the state holds, by name", () => {
			for (const a_project of the_state.the_family) {
				assert.ok(
					the_words.includes(a_project.name),
					`the page does not mention ${a_project.name}, which the state holds. A project that ` +
						"was read and then left off the page is the failure this repository exists to prevent, " +
						"and a reader has no way to tell it from a project that was never asked about.",
				);
			}
		});

		it("prints every stage the state declares", () => {
			const a_read_project = the_state.the_family.find((a_project) => a_project.was_read);
			for (const a_stage of a_read_project.what_its_code_declares.stages) {
				assert.ok(
					the_words.includes(a_stage.name),
					`the page does not print the stage ${a_stage.name}, which the code declares. A stage ` +
						"added to a project's enumeration and left off this page is a fact the page is silent " +
						"about, and silence reads as a stage that does not exist.",
				);
			}
		});

		it("links to each project as a card, and every other link is one the state records", () => {
			const every_repository_linked = [
				...new Set([...the_markup.matchAll(/href="(https:\/\/github\.com\/[^"/]+\/[^"/]+)"/g)].map((a_found) => a_found[1])),
			];

			// **A project may be linked more than once, and that is the lineage doing it.** The
			// card for a project is one link and a second link is a reader being sent to the same
			// repository from the row that says another was ported from it — which is a
			// different reason to want it, and a rule that forbade it would have made the page
			// unable to show the family is related. So a project is linked *at least* once, and
			// every address beyond the four is one the state itself records.
			const what_the_state_mentions = the_state.the_family.map(
				(a_project) => `https://github.com/${a_project.owner}/${a_project.name}`,
			);
			if ("this_page" in the_state) {
				what_the_state_mentions.push(the_state.this_page.url);
			}
			for (const a_url of what_the_state_mentions) {
				assert.ok(
					the_markup.includes(`href="${a_url}"`),
					`the page never links ${a_url}, which the state holds. A project in the state and not ` +
						"on the page is the failure this repository exists to prevent.",
				);
			}

			const the_ones_the_state_does_not_mention = every_repository_linked.filter(
				(a_url) => !what_the_state_mentions.includes(a_url),
			);
			assert.equal(
				the_ones_the_state_does_not_mention.length,
				0,
				`the page links to ${the_ones_the_state_does_not_mention.join(", ")}, which the state does ` +
					"not mention. A link to a repository the state does not hold is a fact the page has and " +
					"cannot account for, and the state is the only place this page is allowed to learn " +
					"anything.",
			);
		});

		it("prints the verdict the family function returned, in its words", () => {
			assert.ok(
				the_words.includes(the_verdict.verdict),
				`the page does not print the verdict "${the_verdict.verdict}". The words a verdict takes ` +
					"are decided in one function so that a reader and the state cannot disagree about what " +
					"was found; a template that says something slightly different breaks that in the one " +
					"place it was designed to hold.",
			);
		});

		it("prints the number of projects that could be read, beside the verdict", () => {
			const how_many = the_verdict.the_projects.filter((a_project) => a_project.was_read).length;
			assert.ok(
				the_words.includes(`${how_many} of ${the_verdict.how_many_were_asked_about}`),
				`the page does not say that ${how_many} of ${the_verdict.how_many_were_asked_about} ` +
					"repositories could be read. A verdict about the family with no count beside it is a " +
					"claim a reader cannot check, and 'they agree' and 'three of them agree' look identical.",
			);
		});

		it("says how each domain was read, because a table from an import and a table from text are not the same", () => {
			for (const how of ["imported", "read from source"]) {
				if (the_state.the_family.some((a_project) => a_project.how_the_domain_was_read === how)) {
					assert.ok(
						the_words.includes(how),
						`the state says a domain was read by being ${how}, and the page does not say so. ` +
							"Two of the four domains are read out of Rust source, and a page that printed a " +
							"table from a text reader beside one from an import without saying which is which " +
							"is asking a reader to trust both equally.",
					);
				}
			}
		});

		it("prints a phase count as a sentence with a number in it, not as a bare figure", () => {
			for (const a_project of the_state.the_family) {
				const the_phases = a_project.what_its_documents_say.phases;
				if (the_phases === null) {
					continue;
				}
				const the_done = the_phases.phases.filter((a_phase) => a_phase.verdict === "done").length;
				const the_sentence = new RegExp(
					`${the_done} of ${the_phases.phases.length} phases carry a mark saying they are done`,
				);
				assert.ok(
					the_sentence.test(the_words),
					`the page does not say that ${a_project.name} marks ${the_done} of ` +
						`${the_phases.phases.length} phases done, in a sentence holding both numbers. A count ` +
						"on its own, and a count welded to a word by a template line break, are the two ways " +
						"a number on a page stops being checkable.",
				);
			}
		});

		it("prints no value it was never given", () => {
			for (const a_thing of ["undefined", "NaN", "[object Object]"]) {
				assert.ok(
					!the_words.includes(a_thing),
					`the page prints ${a_thing}, which is what a field nobody read renders as. The page ` +
						"has to say in words what it does not have, because a blank reads as a project with " +
						"nothing to report.",
				);
			}
		});

		it("never puts a word next to a number it does not have", () => {
			// **A number substituted into a sentence, with no rule for the case where there is
			// none, produces a sentence nobody wrote.** `ai-sdlc-app-rs` does not compile, so its
			// suite printed no counts at all, and the page said "no counts passed" — which is not a
			// claim about anything. The word belongs to the sentence only when there is a number for
			// it to sit in.
			assert.ok(
				!/no counts\s+passed/i.test(the_words),
				"the page put the word `passed` next to a count it does not have. A number substituted " +
					"into a sentence with no rule for its absence produces a sentence nobody wrote, and " +
					"this project is one of the four that has a suite which printed nothing at all.",
			);
			assert.ok(
				!/\bnull\s+(passed|failed|tests|projects)\b/i.test(the_words),
				"the page put a word next to a literal null. `null` is what a field nobody read holds, " +
					"and printing it beside a word is printing the absence rather than saying it.",
			);
		});

		it("publishes the state beside the page, so every number can be checked", () => {
			const the_published = join(where_the_page_landed, "..", "the_family.json");
			assert.ok(
				existsSync(the_published),
				"the build produced a page with no state beside it. The page's whole argument is that a " +
					"reader can check its numbers against the file they came from, and that needs the file " +
					"to be there.",
			);
			const what_was_published = JSON.parse(readFileSync(the_published, "utf8"));
			assert.equal(
				what_was_published.the_build.read_at,
				the_state.the_build.read_at,
				"the published state is not the one the page was built from. Two artifacts with one name is " +
					"how the first deployment of the page this one is a view of published last month's numbers.",
			);
		});
	});
}

describe("the tests in this directory, and where they get a state from", () => {
	// **A test that reads a file it did not write is a test that only runs on the machine that
	// made it.** This file used to read `src/state/the_family.json` and fail when it was absent,
	// which is a fresh clone — so the most important test in the repository could not run
	// anywhere but the laptop that had run a collect. It now collects the fixtures instead.
	//
	// **The guard is here because the alternative is finding this again in a month**, when
	// somebody adds a test, needs a state, and reaches for the file that is lying in the tree.
	// A directory scan rather than a convention, because a convention is a thing a reader has
	// to know and a scan is a thing that fails on its own.
	const the_test_files = readdirSync(here).filter(
		(a_name) => a_name.endsWith(".test.mjs") && a_name !== "the_page_says_only_what_the_state_says.test.mjs",
	);

	it("looks at the other tests, so that scanning for something finds something", () => {
		assert.ok(
			the_test_files.length > 3,
			`only ${the_test_files.length} other test files were found to check. A guard that finds ` +
				"nothing to check passes, and a guard that passes because it looked in the wrong place " +
				"is worse than no guard at all.",
		);
	});

	for (const a_file of the_test_files) {
		it(`${a_file} brings its own state or asks for none`, () => {
			const what_it_says = readFileSync(join(here, a_file), "utf8");
			assert.doesNotMatch(
				what_it_says,
				/src[",']?[,\s]*["']?state[",']?[,\s]*["']?[\s,]*["']?the_family\.json/,
				`${a_file} reaches into src/state/the_family.json, which is a build artifact that a fresh ` +
					"clone does not have and that a collector happens to have left. A test that reads it " +
					"runs on one machine and is silent everywhere else, and the way to see that is to read " +
					"what is on the page and the state it was built from is to build one.",
			);
		});
	}
});

