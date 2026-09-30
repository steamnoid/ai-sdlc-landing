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
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

/**
 * Two readings of one project, and what the page is expected to say about the difference.
 *
 * **At module scope, because two blocks in this file ask about it.** It began inside the block
 * that asked whether the section renders, and the block that asked whether the file is published
 * beside the page could not see it — which is the same mistake as reaching for another block's
 * `the_state`, and the same fix.
 */
const THE_MOVED = {
	was_compared: true,
	why_not: null,
	compared_with: { read_at: "2026-09-29T12:00:00.000Z", where: "https://example.invalid/the_family.json" },
	the_projects: [
		{
			name: "a_python_project",
			was_in_the_previous_read: true,
			became_done: ["exposure through MCP is not"],
			became_owed: [],
		},
	],
};


let the_markup_of_the_page_built_from_the_fixtures_var = "";
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
			the_markup_of_the_page_built_from_the_fixtures_var = the_markup;
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
			// **This held the sentence the page used to say, and the sentence was the bug.** It read
			// "N of M phases carry a mark saying they are done" and counted a row that its own cell
			// said was half owed. It is now three numbers, because "half done" was a real answer with
			// nowhere to go and a row holding both halves was rounded to the tidier of the two.
			for (const a_project of the_state.the_family) {
				const the_phases = a_project.what_its_documents_say.phases;
				if (the_phases === null) {
					continue;
				}
				const how_many = (a_verdict) =>
					the_phases.phases.filter((a_phase) => a_phase.verdict === a_verdict).length;
				// **The middle number is in the sentence only when there is one.** A project with
				// nothing half done should not print a `0 partly` in the middle of a sentence about its
				// backlog, so the parts are joined the way the template joins them. A project that grows
				// a half-done row has to change this expectation, which is the point of deriving it.
				const the_parts = [`${how_many("done")} done`];
				if (how_many("partly") > 0) {
					the_parts.push(`${how_many("partly")} partly`);
				}
				the_parts.push(
					`${how_many("not started")} not started of ${the_phases.phases.length} in its own backlog`,
				);
				const the_sentence = new RegExp(the_parts.join(" · "));
				assert.ok(
					the_sentence.test(the_words),
					`the page does not say that ${a_project.name} has ${how_many("done")} rows done and ` +
						`${how_many("not started")} not started out of ${the_phases.phases.length}, in a ` +
						"sentence holding the numbers. A count on its own, and a count welded to a word by a " +
						"template line break, are the two ways a number on a page stops being checkable.",
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

/** The page this file already built, read as markup for the assertions that are about tags. */
const the_markup_of = () => the_markup_of_the_page_built_from_the_fixtures_var;

/**
 * The words of a piece of markup this page is made of.
 *
 * `the_words_on_the_page` takes a path and reads the file, which is the right seam for the page
 * and the wrong one for a slice of it — reading a 40 000-character fragment off the disk is a
 * filesystem error wearing an assertion's clothes.
 */
function the_words_in(a_piece_of_markup) {
	return a_piece_of_markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

/**
 * The words of one project's backlog card, cut out of the page.
 *
 * **A card, and not a project name.** A project's name is printed at least twice — in the family
 * card and again in the backlog — and the first one is not the card these assertions are about.
 * Slicing from the heading to the end of its card is what makes "its own backlog" belong to it.
 */
function the_backlog_card_of(a_project_name) {
	// **The section element, not the heading text.** "How they differ" is also a link in the
	// navigation this page carries, and slicing from that occurrence takes the whole family card
	// and most of the page with it — which is how a first version of this helper came to answer
	// a question about a backlog with a project's licence.
	const where_the_section_starts = the_markup_of().indexOf('<section id="differ"');
	const where_the_section_ends = the_markup_of().indexOf('<section id="truth"', where_the_section_starts);
	// **Both ends are checked, and a missing one is a failure rather than `-1`.** `slice(start, -1)`
	// runs to the second-to-last character, which is nearly the whole page: every assertion below
	// would have passed for the wrong reason, from a family card and a licence.
	assert.notEqual(where_the_section_starts, -1, "the built page has no section with the id the backlog is in");
	assert.notEqual(where_the_section_ends, -1, "the section after the backlog is not where this helper looks");
	const the_section = the_markup_of().slice(where_the_section_starts, where_the_section_ends);
	const where_the_card_starts = the_section.indexOf(a_project_name);
	if (where_the_card_starts === -1) {
		assert.fail(`the backlog section of the built page has no card for ${a_project_name}`);
	}
	const the_next_card = the_section.indexOf("<div class=\"rounded-2xl", where_the_card_starts + a_project_name.length);
	return the_section.slice(where_the_card_starts, the_next_card === -1 ? undefined : the_next_card);
}

describe("the backlog on the page, and the halves of a row", () => {
	// **The page's backlog block had never been built in a test.** Every fixture this repository
	// had carried no `AGENTS.md`, so the collector read no backlog from any of them and the block
	// was exercised only as a pure function. A block that renders nothing is a block nothing has
	// ever looked at.
	//
	// `a_python_project` marks one row wholly, one row partly and two not at all;
	// `a_rust_project` marks nothing, which is what two of the four real projects do.

	it("says how many rows are done, how many are half, and how many are untouched", () => {
		const the_reading = the_words_in(the_backlog_card_of("a_python_project"));

		assert.match(
			the_reading,
			/1 done/,
			"the page does not say how many of the four rows are wholly done, so a reader cannot tell " +
				"the count from the number of rows that carry a mark somewhere in them",
		);
		assert.match(
			the_reading,
			/1 partly/,
			"the page has no word for a row that is half done. It reported that row among the done ones " +
				"and printed the half that is owed inside the same line as the half that is not.",
		);
		assert.match(the_reading, /2 not started/, "the page does not say how many rows nothing has been done on");
	});

	it("does not put a row with an owed half among the rows it calls done", () => {
		const the_reading = the_words_in(the_backlog_card_of("a_python_project"));

		assert.doesNotMatch(
			the_reading,
			/2 of 4[^.]{0,40}done/,
			"the page counts two of four rows as done, and one of them says in its own words that " +
				"exposure through MCP is not. The count and the row are the same sentence.",
		);
	});

	it("prints the owed half on its own, so it can be read as the work that is left", () => {
		const the_row = the_backlog_card_of("a_python_project").split("</li>").find((a_chunk) => a_chunk.includes("MCP is not"));

		assert.ok(the_row, "the page does not print the row that owes the MCP exposure at all");
		assert.doesNotMatch(
			the_row,
			/\bgithub\b[^<]*done/i,
			"the done half and the word done are printed in the same element as the owed half, so the " +
				"line reads as two claims at once and the reader has to work out which is which",
		);
	});

	it("tells a project that marks nothing where a mark would go, rather than only that it marks nothing", () => {
		const the_reading = the_words_in(the_backlog_card_of("a_rust_project"));

		assert.match(
			the_reading,
			/AGENTS\.md/,
			"the page says this project marks no phase and stops there. Two of the four real projects " +
				"are in exactly this state, and the one thing a reader can act on — that the table is in " +
				"AGENTS.md under a heading called Backlog — is not said.",
		);
	});
});

describe("the section that explains the reading, and whether it is still true", () => {
	// **This paragraph explained a rule the page had stopped using.** It said a phase's state is
	// read from a strikethrough or the word done or nothing, which is a rule with three answers and
	// no room for the row that holds both — the row that was counted as done while its own cell said
	// the exposure was not. The explanation is where a reader looks to find out why a number is what
	// it is, so an explanation of a rule that is no longer the one in force is worse than none.
	it("says that one row can hold both halves, because that is what a reader will be looking at", () => {
		assert.match(
			the_markup_of(),
			/One row can hold both halves at once/,
			"the section that explains how a mark is read does not mention that a row can be half " +
				"delivered. A reader looking at `exposure through MCP is not` under a struck-through row " +
				"has been told only that a strikethrough means done.",
		);
	});
});

describe("what moved since the last read, which is the only thing a reader caused", () => {
	// **The page had no way to say what got done.** It republished whenever any fact moved — and
	// a fact moves on almost every run, because suite counts, licences and commit pins are read
	// fresh — so the page looked busy while saying nothing about the work. This is the narrow
	// question underneath that: which items of the family's own lists stopped being owed.
	//
	// **Both fixtures share a state written here, because the movement is between two states and
	// not a property of either.** `build_the_page` takes the state it is given, so a test states
	// both readings and asks what the page says about the difference.
	/**
	 * Build the page with this file beside the state, and put the tree back exactly as it was.
	 *
	 * **The restore is the whole of this helper and it exists because of a green run.**
	 * `npm run test:page` runs in the build job, against the state that run just produced, and the
	 * first version of this removed `src/state/what_moved.json` to test the page built without one.
	 * It did, and then it deleted the file out of the directory the run was holding — so the build
	 * published one file, the page had no evidence beside it, and every test was green including
	 * the one that had just broken it. A test that reaches into the repository's own state
	 * directory has to put it back, the way `build_the_page` puts back the state it moves aside.
	 */
	const build_with = (the_moved) => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-moved-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		const the_file = join(at, "src", "state", "what_moved.json");
		const there_was_one = existsSync(the_file);
		const what_was_there = there_was_one ? readFileSync(the_file, "utf8") : null;

		if (the_moved === null) {
			rmSync(the_file, { force: true });
		} else {
			mkdirSync(join(at, "src", "state"), { recursive: true });
			writeFileSync(the_file, JSON.stringify(the_moved));
		}
		try {
			return the_words_on_the_page(
				build_the_page(at, a_directory, {
					write: JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8")),
				}),
			);
		} finally {
			rmSync(the_file, { force: true });
			if (what_was_there !== null) {
				mkdirSync(join(at, "src", "state"), { recursive: true });
				writeFileSync(the_file, what_was_there);
			}
		}
	};

	it("names what stopped being owed, and which project it was in", () => {
		const the_reading = build_with(THE_MOVED);

		assert.match(
			the_reading,
			/exposure through MCP is not/,
			"the page does not print the item that was delivered since the last read, so the one event " +
				"on it a person caused goes unrecorded",
		);
		assert.match(the_reading, /a_python_project/, "the page does not say which project it was in");
	});

	it("names work that stopped being owed again, rather than printing only the good news", () => {
		const the_reading = build_with({
			...THE_MOVED,
			the_projects: [
				{ name: "a_rust_project", was_in_the_previous_read: true, became_done: [], became_owed: ["the desktop application"] },
			],
		});

		assert.match(
			the_reading,
			/the desktop application/,
			"a strikethrough was taken back out of a document and the page printed nothing. A page that " +
				"reports only progress is a place where bad news does not appear.",
		);
	});

	it("says nothing about movement when nothing moved, rather than printing an empty heading", () => {
		const the_reading = build_with({ ...THE_MOVED, the_projects: [] });

		assert.doesNotMatch(
			the_reading,
			/[Ss]ince the last read/,
			"the page printed a heading about what changed since the last read with nothing under it. A " +
				"heading with nothing under it reads as a section that was considered and found empty.",
		);
	});

	it("builds with no such file at all, because a developer who has never published has none", () => {
		const the_reading = build_with(null);

		assert.doesNotMatch(the_reading, /[Ss]ince the last read/, "a page built with no comparison printed a comparison");
	});

	it("says when the last read was, so 'since' is a time a reader can check", () => {
		const the_reading = build_with(THE_MOVED);

		assert.match(
			the_reading,
			/2026-09-29 12:00/,
			"the page says what changed since the last read without saying when the last read was, so " +
				"'since' is not a time anybody can check the claim against.",
		);
	});
});

describe("what the page publishes beside itself, and whether it is everything it was built from", () => {
	// **The page promised this and then stopped keeping it.** Its own footer says "the state every
	// number came from is published beside it", and the build copied exactly one file. The section
	// that says what moved since the last read prints claims from a second file, and that file was
	// never copied — so the promise held for every number and failed for the one a person caused.
	//
	// **Every file the build was given, and not a list of them.** A list is what went stale: it held
	// one name, a second file arrived, and nothing failed.
	it("publishes the file that says what moved, so the claim can be checked against it", () => {
		// **Put back what was there**, for the reason `build_with` above gives at length: this test
		// runs in the build job against the state that run produced, and a green run that deleted it
		// is a green run that removed its own evidence.
		const the_file = join(at, "src", "state", "what_moved.json");
		const there_was_one = existsSync(the_file);
		const what_was_there = there_was_one ? readFileSync(the_file, "utf8") : null;
		mkdirSync(join(at, "src", "state"), { recursive: true });
		writeFileSync(the_file, JSON.stringify(THE_MOVED));
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-publishes-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));

		try {
			build_the_page(at, a_directory, {
				write: JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8")),
			});

			assert.ok(
				existsSync(join(a_directory, "what_moved.json")),
				"the build produced no what_moved.json beside the page. The page prints what moved since " +
					"the last read, and its footer promises that every number it prints is published " +
					"beside it — so this is a claim a reader cannot check against anything.",
			);
		} finally {
			rmSync(the_file, { force: true });
			if (what_was_there !== null) {
				writeFileSync(the_file, what_was_there);
			}
		}
	});

	it("publishes the state itself too, because that promise is older than the file above", () => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-publishes-2-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));

		build_the_page(at, a_directory, {
			write: JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8")),
		});

		assert.ok(existsSync(join(a_directory, "the_family.json")), "the published state is not there");
	});
});

describe("a project the collector could not read, in the table that compares four projects", () => {
	// **The family card keeps it and the comparison table drops it.** One section of this page
	// prints an unreadable project with its reason and states the rule in as many words — "A
	// repository that could not be read is still here, with the reason. Dropping it would be
	// telling you the family has fewer members than it has." A few hundred lines down, a table
	// whose whole purpose is comparing four projects filters those projects out with no row and no
	// reason, so the page contradicts itself within one screen.
	//
	// **Four of four are readable, every day, so this has never happened.** That is the same
	// condition as every other defect found today: a path nothing reaches until the day it is
	// needed.
	const A_FAMILY_WITH_ONE_UNREADABLE = {
		the_build: { read_at: "2026-01-01T00:00:00.000Z" },
		the_family: [
			JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8")).the_family[0],
			{
				owner: "steamnoid",
				name: "a-project-nobody-could-read",
				was_read: false,
				why_not: "the repository answered 404",
				language: "rust",
			},
		],
	};

	/**
	 * The words of the table's own section, and not of the page.
	 *
	 * **The first version of these three assertions read the whole page and all three passed** —
	 * the family card prints the unreadable project with its reason, so every string they looked for
	 * was on the page two hundred lines above the table they were about. A test that passes for a
	 * reason other than the one it names is worse than no test, and this repository has been bitten
	 * by that four times already.
	 */
	const the_table_from = (a_state) => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-unread-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		const the_page = build_the_page(at, a_directory, { write: a_state });
		const where_it_starts = the_markup_of_the_page(the_page).indexOf('<section id="domain"');
		const where_it_ends = the_markup_of_the_page(the_page).indexOf('<section id="differ"', where_it_starts);
		assert.notEqual(where_it_starts, -1, "the built page has no section with the id the table is in");
		assert.notEqual(where_it_ends, -1, "the section after the table is not where this helper looks");
		return the_words_in(the_markup_of_the_page(the_page).slice(where_it_starts, where_it_ends));
	};

	/** The markup just built, read from disk rather than from whichever page was last written. */
	function the_markup_of_the_page(a_page) {
		return readFileSync(a_page, "utf8");
	}

	it("still prints the project, because a table about four projects cannot show three silently", () => {
		const the_reading = the_table_from(A_FAMILY_WITH_ONE_UNREADABLE);

		assert.match(
			the_reading,
			/a-project-nobody-could-read/,
			"the table of the same three things said four ways dropped the project that could not be " +
				"read, with no row and no reason. The family card keeps it two hundred lines above and " +
				"says in words that dropping it would be telling the reader the family has fewer members.",
		);
	});

	it("says why it could not be read, rather than printing a row of empty cells", () => {
		const the_reading = the_table_from(A_FAMILY_WITH_ONE_UNREADABLE);

		assert.match(
			the_reading,
			/the repository answered 404/,
			"the row exists and says nothing. A table cell with a name in it and no values reads as a " +
				"project that declared nothing, which is a claim about the work and not about the reading.",
		);
	});

	it("still counts it among the four the table is about", () => {
		const the_reading = the_table_from(A_FAMILY_WITH_ONE_UNREADABLE);

		assert.doesNotMatch(
			the_reading,
			/said four ways[\s\S]{0,400}?1 of 2/,
			"the table's own heading says four ways while the table holds one row. The heading is a " +
				"claim about how many projects are being compared.",
		);
	});
});

describe("the numbers in this page's own sentences, and who keeps them right", () => {
	// **Four of them were typed by hand and none of them was in step with the state.**
	//
	// | the sentence | what it claimed |
	// |---|---|
	// | "One domain, four times over" | four projects were read |
	// | "Two of the four are imported … two are read out of Rust source" | two and two |
	// | "The same three things, said four ways" | four projects to compare |
	// | "Two of the four projects mark nothing" | which two |
	//
	// All four are true today and all four are false the day a repository answers 404 — and the
	// page says "Read from 3 of 4 repositories" in the header directly above them. A hand-typed
	// number in a page whose argument is that every number is read is the one thing this page
	// cannot hold itself to, and it is the shape this repository has now found five times.
	const A_FAMILY_WITH_ONE_UNREADABLE = () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		return {
			the_build: { read_at: "2026-01-01T00:00:00.000Z" },
			the_family: [
				...a_state.the_family.slice(0, 2),
				a_state.the_family[2],
				{ owner: "steamnoid", name: "a-project-nobody-could-read", was_read: false, why_not: "the repository answered 404" },
			],
		};
	};

	const build_the_state = (a_state) => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-counts-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		return the_words_on_the_page(build_the_page(at, a_directory, { write: a_state }));
	};

	it("does not say four times over when three repositories were read", () => {
		const the_reading = build_the_state(A_FAMILY_WITH_ONE_UNREADABLE());

		assert.doesNotMatch(
			the_reading,
			/One domain, four times over/,
			"the section is headed four times over on a reading of three repositories, in a page whose " +
				"header says 3 of 4. The heading is a hand-typed number and nothing keeps it in step.",
		);
	});

	it("does not split two and two when the fourth repository was not read at all", () => {
		const the_reading = build_the_state(A_FAMILY_WITH_ONE_UNREADABLE());

		assert.doesNotMatch(
			the_reading,
			/Two of the four are imported/,
			"the page says two projects were imported and two read from Rust source, describing a " +
				"repository it could not read. It is the one sentence on this page about a project that " +
				"was never looked at.",
		);
	});

	it("does not say four ways when the table can compare three", () => {
		const the_reading = build_the_state(A_FAMILY_WITH_ONE_UNREADABLE());

		assert.doesNotMatch(
			the_reading,
			/said four ways/,
			"the table is headed four ways and holds three readable rows plus one row that says it could " +
				"not be read. Three and four in the same table is a contradiction a reader can count.",
		);
	});

	it("says how many projects mark nothing, counted from the state rather than typed", () => {
		// **The first version of this asserted only that the old sentence was gone**, and the old
		// sentence was gone while the new one said "every project that could be read marks
		// something" — on a page where two of the four mark nothing. The count was being read out
		// of the family's projection, which carries what a project declares and carries no
		// documents, so it found nothing and produced a nicer sentence. **This asserts the number.**
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		const how_many_mark_nothing = a_state.the_family.filter((a_project) => {
			const the_phases = a_project.what_its_documents_say?.phases;
			return the_phases?.verdict === "read" && the_phases.phases.length > 0 &&
				the_phases.phases.every((a_phase) => a_phase.verdict === "not started");
		}).length;

		assert.ok(
			how_many_mark_nothing > 0,
			"the fixtures hold no project that marks nothing, so this test cannot tell a correct count " +
				"from a page that counts zero. A test that cannot fail is a test that has not run.",
		);

		const the_reading = build_the_state(a_state);

		// **A plain sentence and not a regular expression.** The first version used `\d` inside a
		// template literal, where `\d` is not an escape at all — it is the letter `d` — so the
		// pattern compiled to `1 of the d+ projects…` and matched nothing. That is twice in one test:
		// a `match` that could not pass, and a `doesNotMatch` beside it that passed because its own
		// pattern was broken.
		const how_many_were_read = a_state.the_family.filter((a_project) => a_project.was_read === true).length;
		const the_sentence =
			`${how_many_mark_nothing} of the ${how_many_were_read} ` +
			`${how_many_were_read === 1 ? "project marks" : "projects mark"} nothing`;
		assert.ok(
			the_reading.includes(the_sentence),
			`the page does not say "${the_sentence}". It says: ${
				the_reading.includes("Every project that could be read marks something")
					? '"Every project that could be read marks something"'
					: "something else"
			}. The count is read out of the family's projection rather than the state, and the projection ` +
				"carries no documents — so it found none and printed a nicer sentence.",
		);
	});

	it("does not claim a project's marking when that project could not be read", () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		const one_that_marks_nothing = a_state.the_family.find(
			(a_project) => a_project.what_its_documents_say?.phases?.verdict === "read" &&
				a_project.what_its_documents_say.phases.phases.length > 0 &&
				a_project.what_its_documents_say.phases.phases.every((a_phase) => a_phase.verdict === "not started"),
		);
		if (one_that_marks_nothing === undefined) {
			return;
		}
		const how_many_still_read = a_state.the_family.length - 1;
		const with_it_unreadable = {
			the_build: { read_at: "2026-01-01T00:00:00.000Z" },
			the_family: a_state.the_family.map((a_project) =>
				a_project.name === one_that_marks_nothing.name
					? { owner: "steamnoid", name: a_project.name, was_read: false, why_not: "the repository answered 404" }
					: a_project,
			),
		};

		const the_reading = build_the_state(with_it_unreadable);

		assert.ok(
			!the_reading.includes("projects mark nothing") && !the_reading.includes("project marks nothing"),
			`the page says how many projects mark nothing, and ${one_that_marks_nothing.name} is one of them ` +
				`while the same page says it could not be read. It has made a claim about the marking of a ` +
				`repository it never opened, out of ${how_many_still_read} readable projects.`,
		);
	});
});

describe("the sentence above the lineage, and whether it is about this family", () => {
	// **It was wrong on the live site, in two ways, on the day it was written.**
	//
	// It said *"Three of these four write about a sibling project without saying which one."* The
	// state says **one** of the four has any lineage at all, and that one **names** its source three
	// times — a pin at `98fab0f`, a design reference, and a line in its own licence. So both the
	// count and the clause after it were about no project on this page.
	//
	// It is a hand-typed sentence about a family that moves several times a day, and the number in
	// it was never going to hold. The fifth one.
	const build_with_lineage = (the_edges_for) => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		const with_lineage = {
			...a_state,
			the_family: a_state.the_family.map((a_project) => ({
				...a_project,
				the_lineage: { verdict: "read", the_edges: the_edges_for(a_project.name), why_not: null },
			})),
		};
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-lineage-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		return the_words_on_the_page(build_the_page(at, a_directory, { write: with_lineage }));
	};

	const NO_EDGES = () => [];

	it("does not say three of the four when one of them has a lineage", () => {
		const the_reading = build_with_lineage((a_name) =>
			a_name === "a_python_project"
				? [{ points_at: "a_sibling", owner: null, how_it_is_recorded: "a pin in SOURCES.lock" }]
				: NO_EDGES(),
		);

		assert.doesNotMatch(
			the_reading,
			/Three of these four/,
			"the sentence above the lineage says three of the four project have one. One does. This is " +
				"the fifth hand-typed number in this page's own prose and the only one that was already " +
				"wrong when it was written.",
		);
	});

	it("says how many of the four name another project, counted from the state", () => {
		const the_reading = build_with_lineage((a_name) =>
			a_name === "a_python_project"
				? [{ points_at: "a_sibling", owner: null, how_it_is_recorded: "a pin in SOURCES.lock" }]
				: NO_EDGES(),
		);

		assert.ok(
			the_reading.includes("1 of these four names another project, and this page prints which one the file records"),
			"the page does not say that one of the four names another project and says which. The first " +
				"version of this test matched a pattern loose enough to be satisfied by an unrelated " +
				"sentence elsewhere on the page — a reader is left to count four cards to find out what " +
				"one sentence could have said.",
		);
	});

	it("does not say they do not say which one when the state names the source", () => {
		const the_reading = build_with_lineage((a_name) =>
			a_name === "a_python_project"
				? [{ points_at: "a_sibling", owner: null, how_it_is_recorded: "a pin in SOURCES.lock" }]
				: NO_EDGES(),
		);

		assert.doesNotMatch(
			the_reading,
			/without saying which one/,
			"the page says these projects write about a sibling without saying which, while the project it " +
				"is about names the sibling three times over. A sentence about the family must not contradict " +
				"the rows directly beneath it.",
		);
	});
});

describe("a reading in which nothing could be read at all", () => {
	// **The page said "Every project that could be read marks something."** It is true, and there
	// were no projects that could be read. A sentence about a family of zero, in a section headed
	// "How they differ", reads as reassurance rather than as nothing to say — and it is the only
	// sentence in that section that survives a total outage, so it is the one a reader is left with.
	const none_readable = () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		return {
			the_build: { read_at: "2026-01-01T00:00:00.000Z" },
			the_family: a_state.the_family.map((a_project) => ({
				owner: a_project.owner,
				name: a_project.name,
				was_read: false,
				why_not: "the repository answered 404",
				language: a_project.language,
			})),
		};
	};

	const the_page_when_nothing_could_be_read = () => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-none-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		return the_words_on_the_page(build_the_page(at, a_directory, { write: none_readable() }));
	};

	it("says that nothing was read, rather than that everything marks something", () => {
		const the_reading = the_page_when_nothing_could_be_read();

		assert.doesNotMatch(
			the_reading,
			/Every project that could be read marks something/,
			"the page says every project that could be read marks something, and no project could be " +
				"read. It is the only sentence in the section that survives a total outage, so it is " +
				"the one a reader is left holding.",
		);
	});

	it("says so in words, so a reader is not left reading a section about nothing", () => {
		const the_reading = the_page_when_nothing_could_be_read();

		assert.match(
			the_reading,
			/none of (them|these) could be read|no project could be read|could not be read, so there is nothing to say/i,
			"the page gives no sentence at all about a reading in which nothing could be read. A section " +
				"with its prose missing reads as a section that was considered and found nothing to say.",
		);
	});

	it("still keeps every project with its reason, because that is the rule the page states", () => {
		const the_reading = the_page_when_nothing_could_be_read();

		for (const a_project of none_readable().the_family) {
			assert.ok(
				the_reading.includes(a_project.name),
				`${a_project.name} is missing from a page built from a reading that holds it. The page says ` +
					"in words that dropping it would be telling the reader the family has fewer members.",
			);
		}
	});
});

describe("what the verdict section claims about a comparison it did not make", () => {
	// **The most trusted sentence on the page claimed a comparison that never happened.**
	//
	// With nothing readable it printed *"0 of 4 repositories could be read, and their stages, roles
	// and legal moves were compared one against another."* The first half is generated and true. The
	// second half is prose that assumed there was something to compare, and it is in the section
	// headed **the verdict about all four** — the one part of this page a reader has the least
	// reason to doubt.
	//
	// A page about work in progress, on the day the work cannot be reached, should say it could not
	// be reached.
	const nothing_readable = () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		return {
			the_build: { read_at: "2026-01-01T00:00:00.000Z" },
			the_family: a_state.the_family.map((a_project) => ({
				owner: a_project.owner,
				name: a_project.name,
				was_read: false,
				why_not: "the repository answered 404",
			})),
		};
	};

	const build_it = (a_state) => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-verdict-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		return the_words_on_the_page(build_the_page(at, a_directory, { write: a_state }));
	};

	it("does not say anything was compared when nothing was read", () => {
		const the_reading = build_it(nothing_readable());

		assert.doesNotMatch(
			the_reading,
			/were compared one against another/,
			"the verdict section says the stages, roles and legal moves were compared one against another " +
				"on a reading where no repository could be read. It is in the one section a reader has the " +
				"least reason to doubt.",
		);
	});

	it("says the comparison could not be made, so the section is not a section about nothing", () => {
		const the_reading = build_it(nothing_readable());

		assert.match(
			the_reading,
			/could not be compared|there was nothing to compare|nothing could be compared/i,
			"the verdict section gives no sentence about a comparison it could not make. A reader who sees " +
				'only "0 of 4 repositories could be read" is left with a number and no statement of what it ' +
				"does and does not establish.",
		);
	});

	it("still says the comparison was made when projects were read", () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		const the_reading = build_it({ ...a_state, the_build: a_state.the_build });

		assert.ok(
			the_reading.includes("compared one against another"),
			"the page stopped claiming any comparison even when projects were read. The sentence is about " +
				"a comparison that happened and it is still true — a fix that reads like a retraction is a " +
				"fix that has thrown away something correct.",
		);
	});

	it("does not say it prints a lineage it has none of, on a reading where nothing was read", () => {
		const the_reading = build_it(nothing_readable());

		assert.doesNotMatch(
			the_reading,
			/prints which one the file records/,
			"the page says it prints which lineage each file records, and there are no files to record one. " +
				"The sentence is dangling on exactly the day it is most likely to be read.",
		);
	});
});

describe("the closing line of the page's own pitch, about where it got its facts", () => {
	// **It said "Everything below was read out of the four repositories rather than written
	// here."** With no repository readable, nothing below had been read out of any of them. It is the
	// one sentence on this page that is about this page rather than about the family, so a reader has
	// no reason to doubt it and no way to check it except by noticing the header says 0 of 4.
	const none_readable = () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		return {
			the_build: { read_at: "2026-01-01T00:00:00.000Z" },
			the_family: a_state.the_family.map((a_project) => ({
				owner: a_project.owner,
				name: a_project.name,
				was_read: false,
				why_not: "the repository answered 404",
			})),
		};
	};

	const build_it = (a_state) => {
		const a_directory = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-pitch-"));
		after(() => rmSync(a_directory, { recursive: true, force: true }));
		return the_words_on_the_page(build_the_page(at, a_directory, { write: a_state }));
	};

	it("does not say everything below was read out of the repositories when none was", () => {
		const the_reading = build_it(none_readable());

		assert.doesNotMatch(
			the_reading,
			/Everything below was read out of the four repositories/,
			"the page's own pitch says everything below was read out of the repositories, on a reading " +
				"where none of them could be reached. It is the one sentence here that is about this page " +
				"rather than about the family.",
		);
	});

	it("says where its facts came from, which on a reading like that is nowhere", () => {
		const the_reading = build_it(none_readable());

		assert.match(
			the_reading,
			/none of (them|the four) could be read|nothing below was read|could not be reached/i,
			"the page gives no sentence about where its facts came from when it has none. The pitch then " +
				"ends without saying what it is, which reads as a page that forgot to finish a sentence.",
		);
	});

	it("still says it when projects were read, because that sentence is true and worth having", () => {
		const a_state = JSON.parse(readFileSync(what_was_collected.the_state_path, "utf8"));
		const the_reading = build_it({ ...a_state, the_build: a_state.the_build });

		assert.ok(
			the_reading.includes("Everything below was read out of the four repositories rather than written here"),
			"the page stopped claiming where it read its facts even when it did read them. A conditional " +
				"that is only ever exercised in its false branch is a conditional that has never been true.",
		);
	});
});

