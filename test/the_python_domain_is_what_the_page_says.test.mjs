/** The domain of a Python project is imported, not transcribed.
 *
 * **A page that draws a stage table is drawing what the code declares**, and the only
 * way that stays true when the code moves is to import the code. This is the test for
 * that, and it is the sharpest test in the repository, because the failure it is
 * arranged against is silent: a table typed into the collector looks exactly like a
 * table read out of the project, and is wrong the first time somebody adds a stage.
 *
 * **The fixtures name no stage of the real family on purpose.** All four projects have
 * an `IDLE`, so a reader that ignored the tree it was pointed at and answered from the
 * project next door would pass a test that looked for the real six. These trees have
 * `ARRIVED` and `BORROWED` instead, and the tests below assert that the real family's
 * stages are *absent* from the answer — which is a stronger claim than finding the
 * fixture's own, because it fails for the reader that has one cached.
 *
 * **Three things are required and one is a valued absence.** Stages, roles and the table
 * of legal moves are required: a page without them has no table to draw, and a collector
 * that drops a section quietly is a page lying quietly. The routes a gate's answer leads
 * to are *not* — one of the four projects has no router yet, and refusing to answer
 * anything about it would take three readable projects off the page to serve the rule
 * properly applied.
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const the_fixtures = join(here, "fixtures");
const the_collector = join(here, "..", "scripts", "ask_the_python_domain.py");

/** A project whose stages are `ARRIVED` and `DEPARTED`, and which has a router. */
const a_python_project = join(the_fixtures, "a_python_project");
/** A project with three other stages, the other name for the move table, and no router. */
const another = join(the_fixtures, "a_python_project_with_another_name_for_the_move_table");
/** A project that carries the invariant on the stage rather than beside it. */
const one_that_says_it_on_the_stage = join(the_fixtures, "a_python_project_saying_who_holds_a_stage_on_the_stage");

/** A stage every real project in the family has, and neither fixture declares. */
const A_STAGE_OF_THE_REAL_FAMILY = "IDLE";

/** Ask the collector about a tree, and hand back what it printed. */
function ask_about(a_project) {
	const the_answer = spawnSync("python3", [the_collector, "--repository", a_project], { encoding: "utf8" });
	return { status: the_answer.status, stdout: the_answer.stdout, stderr: the_answer.stderr };
}

/** The answer, parsed, having first asserted that the collector did not refuse. */
function the_domain_of(a_project) {
	const the_answer = ask_about(a_project);
	assert.equal(the_answer.status, 0, `the collector refused to read ${a_project}, and said:\n${the_answer.stderr}`);
	return JSON.parse(the_answer.stdout);
}

/** A copy of a fixture, and the words of a file in it that a test is about to change. */
function a_copy_of(a_fixture) {
	const where_it_went = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-"));
	const the_copy = join(where_it_went, "the-project");
	cpSync(a_fixture, the_copy, { recursive: true });
	return the_copy;
}

/** Change one line of a file, and hand back the undo. */
function changing(a_file, from, to) {
	const what_was_there = readFileSync(a_file, "utf8");
	writeFileSync(a_file, what_was_there.replace(from, to));
	return () => writeFileSync(a_file, what_was_there);
}

describe("a project whose stages are its own", () => {
	const the_domain = the_domain_of(a_python_project);

	it("answers with the stages that tree declares", () => {
		assert.deepEqual(the_domain.stages, [
			{ name: "ARRIVED", an_agent_must_be_holding_it: true },
			{ name: "DEPARTED", an_agent_must_be_holding_it: false },
		]);
	});

	it("answers with none of the real family's stages", () => {
		assert.equal(
			the_domain.stages.some((a_stage) => a_stage.name === A_STAGE_OF_THE_REAL_FAMILY),
			false,
			`the answer holds "${A_STAGE_OF_THE_REAL_FAMILY}", a stage the real family has, and this tree ` +
				"declares two stages that are not it. An editable install of the family's own package is " +
				"on the path while this repository is worked in, so a reader that does not check where " +
				"its answer came from answers with that instead.",
		);
	});

	it("says which tree answered, from inside that tree", () => {
		assert.ok(
			the_domain.which_code_answered.startsWith(a_python_project),
			`the answer came from ${the_domain.which_code_answered}, which is not inside the tree that was ` +
				"asked about. Two trees in one process is the shape that does this, and a page built from " +
				"another project's domain is indistinguishable from a correct one.",
		);
	});

	it("answers with the disciplines, and not the ones the other tree declares", () => {
		assert.deepEqual(the_domain.roles, ["PILOT"]);
		assert.equal(the_domain.roles.includes("ARCHIVIST"), false, "the answer came from the other tree");
	});

	it("answers with the moves, and a terminal stage listing none rather than nothing", () => {
		assert.deepEqual(the_domain.moves, [
			{ from: "ARRIVED", to: ["DEPARTED"] },
			{ from: "DEPARTED", to: [] },
		]);
	});

	it("names the table the moves came out of", () => {
		assert.equal(
			the_domain.the_name_the_move_table_goes_by,
			"LEGAL_TRANSITIONS",
			"the collector found the moves and did not say which declaration it found them under. The " +
				"family uses two names for one table, and which one a project uses is one of the things " +
				"the page exists to compare.",
		);
	});

	it("answers with the routes, where a router exists", () => {
		assert.deepEqual(the_domain.gates, [
			{ artifact: "LaunchPlan", leads_to: "prepare_the_launch" },
			{ artifact: "LaunchReport", leads_to: "end_the_run" },
		]);
	});
});

describe("a second tree, read in the same process", () => {
	it("answers with the second tree and not the first", () => {
		const the_domain = the_domain_of(another);
		assert.deepEqual(
			the_domain.stages.map((a_stage) => a_stage.name),
			["BORROWED", "KEPT", "RETURNED"],
			"the collector answered with the tree read before it. A module already imported is not " +
				"looked up again, so a second tree in one process gets the first one's answer unless the " +
				"reader forgets what was imported before it was asked.",
		);
	});

	it("names a different tree as the one that answered", () => {
		assert.notEqual(
			the_domain_of(another).which_code_answered,
			the_domain_of(a_python_project).which_code_answered,
			"two trees answered identically, which means the second one was not read at all.",
		);
	});

	it("finds the move table under the name this tree uses", () => {
		assert.equal(
			the_domain_of(another).the_name_the_move_table_goes_by,
			"THE_LEGAL_MOVES_FROM_EACH_STAGE",
			"the collector only knows the name the first fixture uses. One of the two Python projects in " +
				"the family names this table the other way, and a collector knowing only the first would " +
				"report half the family as unreadable.",
		);
	});
});

describe("a project with no router", () => {
	const the_domain = the_domain_of(another);

	it("still answers with its stages, its roles and its moves", () => {
		assert.equal(the_domain.stages.length, 3, "one unread section took the whole project off the page");
		assert.deepEqual(the_domain.roles, ["ARCHIVIST"]);
		assert.equal(the_domain.moves.length, 3);
	});

	it("says the routes could not be read, and why", () => {
		assert.equal(
			the_domain.gates,
			null,
			"a project with no router answered with a mapping. An empty mapping and a project whose " +
				"router decides nothing look identical on a page, and they are different facts.",
		);
		assert.match(
			the_domain.why_the_gates_could_not_be_read,
			/router/,
			"the absence has no reason, or a reason naming nothing a reader could act on.",
		);
	});
});

describe("a collector that refuses", () => {
	it("prints nothing at all, because a half answer is the failure this prevents", () => {
		const the_copy = a_copy_of(a_python_project);
		try {
			// The collector is asked about the undamaged tree first, because "a refusal prints
			// nothing" is also true of a collector that refuses everything — which is what the
			// shell in this cycle does, and which made this test green for the wrong reason.
			the_domain_of(the_copy);
			writeFileSync(join(the_copy, "src", "aisdlc", "domain", "stage.py"), "this is not python(");
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a tree that does not parse was read as though it did");
			assert.equal(
				the_answer.stdout,
				"",
				"the collector refused and still printed an answer. A page built from half an answer is " +
					"the one way to lie here, and a refusal that prints is a refusal that is ignored.",
			);
		} finally {
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("names the file it could not read", () => {
		const the_copy = a_copy_of(a_python_project);
		try {
			rmSync(join(the_copy, "src", "aisdlc", "domain", "role.py"));
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0);
			assert.match(
				the_answer.stderr,
				/role\.py/,
				"the refusal does not name the file a reader would go and look at. 'ImportError' on its " +
					"own sends a reader looking for the interpreter.",
			);
		} finally {
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses a stage that is in neither of the tuples that say who holds it", () => {
		const the_copy = a_copy_of(a_python_project);
		const put_it_back = changing(
			join(the_copy, "src", "aisdlc", "domain", "state_machine.py"),
			"STAGES_WITHOUT_AN_AGENT = (Stage.DEPARTED,)",
			"STAGES_WITHOUT_AN_AGENT = ()",
		);
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a stage nobody holds was drawn as though the code said who does");
			assert.match(the_answer.stderr, /DEPARTED/, "the refusal does not name the stage nobody holds");
		} finally {
			put_it_back();
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses a stage that is in both of them", () => {
		const the_copy = a_copy_of(a_python_project);
		const put_it_back = changing(
			join(the_copy, "src", "aisdlc", "domain", "state_machine.py"),
			"STAGES_WITHOUT_AN_AGENT = (Stage.DEPARTED,)",
			"STAGES_WITHOUT_AN_AGENT = (Stage.ARRIVED, Stage.DEPARTED)",
		);
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a stage with two owners was drawn as though the code said one");
			assert.match(the_answer.stderr, /both/, "the refusal does not say what is wrong with the stage");
		} finally {
			put_it_back();
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses a stage set with no members rather than drawing an empty table", () => {
		const the_copy = a_copy_of(a_python_project);
		const the_file = join(the_copy, "src", "aisdlc", "domain", "stage.py");
		const what_was_there = readFileSync(the_file, "utf8");
		writeFileSync(the_file, what_was_there.replace("ARRIVED = \"ARRIVED\"\n    DEPARTED = \"DEPARTED\"", "pass"));
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "an empty table was drawn, and a reader would see a domain with no stages");
			assert.match(the_answer.stderr, /stage/i);
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});
});

describe("a project that says who holds a stage on the stage itself", () => {
	// **Asked inside each test rather than once at the top of the block.** A throw in a
	// `describe` body aborts the suite, and this runner then reports the aborting suite as a
	// failure while its tests never run — so the printed count reads "19 passed, 0 failed"
	// with a red suite on the screen. The exit code is still 1, which is the only thing the
	// gate reads, but a count that understates a failure is a count nobody should read.
	it("answers with its stages, and with who must be holding each", () => {
		assert.deepEqual(the_domain_of(one_that_says_it_on_the_stage).stages, [
			{ name: "HELD", an_agent_must_be_holding_it: true },
			{ name: "FREED", an_agent_must_be_holding_it: false },
			{ name: "ARCHIVED", an_agent_must_be_holding_it: false },
			{ name: "LOST", an_agent_must_be_holding_it: false },
		]);
	});

	it("says how this project answers that question, because the family answers two ways", () => {
		assert.equal(
			the_domain_of(one_that_says_it_on_the_stage).how_the_project_says_who_must_hold_a_stage,
			"a property on the stage",
			"the collector found the invariant and did not say where it found it. One Python project " +
				"of the two declares two tuples in its state machine and the other makes it a property " +
				"of the stage, and a page comparing four projects is a page comparing four sets of " +
				"conventions — so which one a project uses is the fact, not a detail of the reader.",
		);
	});

	it("reports the other projects as answering it the other way", () => {
		assert.equal(
			the_domain_of(a_python_project).how_the_project_says_who_must_hold_a_stage,
			"two tuples in the state machine",
			"the collector has one answer and no way of noticing that another project says it another way.",
		);
	});
});

describe("a project that says nothing about who holds a stage", () => {
	it("refuses, rather than reporting a stage nobody holds as a fact", () => {
		const the_copy = a_copy_of(a_python_project);
		try {
			writeFileSync(
				join(the_copy, "src", "aisdlc", "domain", "state_machine.py"),
				"from aisdlc.domain.stage import Stage\n\nLEGAL_TRANSITIONS = {Stage.ARRIVED: (Stage.DEPARTED,)}\n",
			);
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a project that says nothing about who holds a stage was drawn as though it did");
			assert.match(
				the_answer.stderr,
				/tuple|property|holds/i,
				"the refusal does not name either of the two ways a project may say it, so a reader " +
					"holding it does not know what the collector was looking for.",
			);
		} finally {
			rmSync(the_copy, { recursive: true, force: true });
		}
	});
});

describe("reading a project must not change it", () => {
	it("leaves no bytecode behind in a tree that is somebody's working copy", () => {
		const the_copy = a_copy_of(a_python_project);
		try {
			// Asked first, because a collector that never imports leaves no bytecode either, and
			// that made this test green while the collector read nothing at all.
			the_domain_of(the_copy);
			assert.equal(
				every_file_under(the_copy).some((a_path) => a_path.endsWith(".pyc")),
				false,
				"importing a tree left .pyc files in it. A checkout somebody else is working in is " +
					"mutated by being measured, and `git status` in their window is where they find out.",
			);
		} finally {
			rmSync(the_copy, { recursive: true, force: true });
		}
	});
});

/** Every file under a directory, so one that appears where none was expected is found. */
function every_file_under(a_directory) {
	const found = [];
	for (const an_entry of readdirSync(a_directory, { withFileTypes: true })) {
		const its_path = join(a_directory, an_entry.name);
		if (an_entry.isDirectory()) {
			found.push(...every_file_under(its_path));
		} else {
			found.push(its_path);
		}
	}
	return found;
}
