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
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { before, describe, it } from "node:test";

import { build_the_page, the_words_on_the_page } from "./build_the_page.mjs";
import { what_the_family_declares } from "../src/page/what_the_family_declares.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const at = join(here, "..");
const where_the_state_lives = join(at, "src", "state", "the_family.json");

if (!existsSync(where_the_state_lives)) {
	it("the page's own test needs a state, and there is none", () => {
		assert.fail(
			`there is no state at ${where_the_state_lives}. Run \`npm run collect\` first — this test ` +
				"reads the state and then asks the built page whether it says the same thing, so with no " +
				"state there is nothing to compare and a green run would mean nothing.",
		);
	});
} else {
	describe("a page built from a state that was read", () => {
		const the_state = JSON.parse(readFileSync(where_the_state_lives, "utf8"));
		const the_verdict = what_the_family_declares(the_state);
		let the_words = "";
		let the_markup = "";
		let where_the_page_landed = "";

		before(() => {
			where_the_page_landed = build_the_page(at, join(at, "dist"));
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

		it("links to each project exactly once, and to no repository that is not in the state", () => {
			for (const a_project of the_state.the_family) {
				const a_link = `href="https://github.com/${a_project.owner}/${a_project.name}"`;
				const how_many = the_markup.split(a_link).length - 1;
				assert.equal(
					how_many,
					1,
					`the page links to ${a_project.name} ${how_many} times. A card that appears twice is a ` +
						"page counting a project that does not exist, and a project linked twice is a reader " +
						"with two ways to be sent to the same place.",
				);
			}

			// **The prefix is not enough, and this is what proved it.** The page links to its own
			// repository in the header, and a count of `href=".../steamnoid/ai-sdlc-` matches it —
			// so the count read five where there are four projects. A prefix test would have to be
			// taught about the exception, and the next repository would teach it a second one.
			const every_repository_linked = [...the_markup.matchAll(/href="(https:\/\/github\.com\/[^"/]+\/[^"/]+)"/g)].map(
				(a_found) => a_found[1],
			);
			// The state holds `owner` and `name`; the page holds a full address. They are
			// compared as full addresses here, because a reader compares a link and a reader
			// does not take a hostname off it first.
			const what_the_state_mentions = the_state.the_family.map(
				(a_project) => `https://github.com/${a_project.owner}/${a_project.name}`,
			);
			if ("this_page" in the_state) {
				what_the_state_mentions.push(the_state.this_page.url);
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

		it("publishes the state beside the page, so every number can be checked", () => {
			const the_published = join(at, "dist", "the_family.json");
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
