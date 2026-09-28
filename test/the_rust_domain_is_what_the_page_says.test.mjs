/** The domain of a Rust project is read out of its source, or refused.
 *
 * **There is no import for a Rust project, and this file is the honest consequence of
 * that.** The Python reader imports the code, so a table drawn from it is the code's own
 * table. A Rust project can only be read as text, and a text reader is the one thing in
 * this repository that can produce a confidently wrong page: a table built by converting
 * `AwaitingAgentPickup` into `AWAITING_AGENT_PICKUP` by rule looks right, is right until
 * somebody's project disagrees, and is then wrong with no failure anywhere.
 *
 * **So this reader never derives a name.** Every written name on the page is a string
 * literal lifted out of the project's own `match` — `Stage::Idle => "IDLE"` — because
 * both real Rust projects write that match, one in a `name()` and one in a `Display`, and
 * both spell the names the specification uses rather than the names Rust uses. The
 * project's own comment on `ai-sdlc-app-rs` says why: "The Rust name and the written name
 * are not the same spelling — `Idle` here, `IDLE` on the wire — which is why the writing
 * has to be asked for rather than assumed."
 *
 * **Every part of this is allowed to be missing, and missing means a refusal.** A stage
 * whose written name is nowhere in the source, a transition table that is not a `match`,
 * an invariant that is neither two constants nor a `matches!` — each is refused by name
 * rather than filled in. The alternative is a page that draws a domain nobody wrote.
 *
 * **The two fixtures are the two layouts the family actually has**: one project puts the
 * domain in `src/domain/`, the other in `crates/domain/src/`, and they differ in how they
 * write a stage's name and in how they say who holds one. Neither shares a stage name with
 * the other or with the real family, so a reader that answers from the wrong tree, or
 * answers from Python, is caught.
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const the_fixtures = join(here, "fixtures");
const the_reader = join(here, "..", "scripts", "read_the_rust_domain.mjs");

/** Four stages written by a `name()`, and the invariant in two constants. */
const a_rust_project = join(the_fixtures, "a_rust_project");
/** Four other stages in a workspace member, written by a `Display`, invariant in a method. */
const a_workspace = join(the_fixtures, "a_rust_project_with_a_workspace");

/** Ask the reader about a tree, and hand back what it printed. */
function ask_about(a_project) {
	const the_answer = spawnSync("node", [the_reader, "--repository", a_project], { encoding: "utf8" });
	return { status: the_answer.status, stdout: the_answer.stdout, stderr: the_answer.stderr };
}

/** The answer, parsed, having first asserted that the reader did not refuse. */
function the_domain_of(a_project) {
	const the_answer = ask_about(a_project);
	assert.equal(the_answer.status, 0, `the reader refused to read ${a_project}, and said:\n${the_answer.stderr}`);
	return JSON.parse(the_answer.stdout);
}

/** A copy of a fixture that a test may damage. */
function a_copy_of(a_fixture) {
	const where_it_went = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-"));
	const the_copy = join(where_it_went, "the-project");
	cpSync(a_fixture, the_copy, { recursive: true });
	return the_copy;
}

describe("a project whose stages are its own", () => {
	it("answers with the stages, in the order the enumeration declares them", () => {
		assert.deepEqual(the_domain_of(a_rust_project).stages, [
			{ name: "IDLE", an_agent_must_be_holding_it: false },
			{ name: "AWAITING_AGENT_PICKUP", an_agent_must_be_holding_it: true },
			{ name: "IN_PROGRESS_BY_AGENT", an_agent_must_be_holding_it: true },
			{ name: "DONE", an_agent_must_be_holding_it: false },
		]);
	});

	it("answers with no stage of the real family beyond the ones this tree declares", () => {
		const the_domain = the_domain_of(a_rust_project);
		assert.equal(
			the_domain.stages.some((a_stage) => a_stage.name === "AWAITING_HUMAN_APPROVAL"),
			false,
			"the answer holds a stage the real family has and this tree does not declare. The real " +
				"family has six stages and both of its Rust projects declare all six, so a reader that " +
				"answered from one of them rather than from the tree it was pointed at would look " +
				"exactly right here.",
		);
	});

	it("answers with the disciplines the tree declares, and not the real family's", () => {
		assert.deepEqual(the_domain_of(a_rust_project).roles, ["Pilot", "Engineer"]);
		assert.equal(
			the_domain_of(a_rust_project).roles.includes("PO"),
			false,
			"the answer holds a discipline the real family has and this tree does not declare.",
		);
	});

	it("answers with the moves, and a terminal stage listing none rather than nothing", () => {
		assert.deepEqual(the_domain_of(a_rust_project).moves, [
			{ from: "IDLE", to: ["AWAITING_AGENT_PICKUP"] },
			{ from: "AWAITING_AGENT_PICKUP", to: ["IN_PROGRESS_BY_AGENT"] },
			{ from: "IN_PROGRESS_BY_AGENT", to: ["AWAITING_AGENT_PICKUP", "DONE"] },
			{ from: "DONE", to: [] },
		]);
	});

	it("names the files it read the domain out of", () => {
		const the_domain = the_domain_of(a_rust_project);
		assert.match(
			the_domain.the_files_that_answered.join(" "),
			/stage\.rs/,
			"the answer does not say which files it read. A reader holding a page about a project " +
				"cannot check a table against the source without knowing which source, and this is " +
				"the one page in the family whose facts are not reproducible from an import.",
		);
	});

	it("says how the project writes a stage's name, and says it was read rather than derived", () => {
		const the_domain = the_domain_of(a_rust_project);
		assert.equal(the_domain.how_a_stage_is_written, "a name() that matches every stage");
		assert.equal(
			the_domain.a_stage_name_was_derived,
			false,
			"the reader derived a stage's name rather than reading it. A name derived by a rule from " +
				"`AwaitingAgentPickup` is right until a project disagrees with the rule, and then it is " +
				"wrong with nothing failing — which is the one failure a text reader can commit.",
		);
	});

	it("says how the project says who must hold a stage", () => {
		assert.equal(
			the_domain_of(a_rust_project).how_the_project_says_who_must_hold_a_stage,
			"two constants beside the table",
			"the reader found the invariant and did not say where. The family has two Python ways and " +
				"two Rust ones, and which one a project uses is the fact the page compares.",
		);
	});
});

describe("a project in a workspace member, writing its names another way", () => {
	it("finds the domain under crates/ as well as src/", () => {
		assert.deepEqual(
			the_domain_of(a_workspace).stages.map((a_stage) => a_stage.name),
			["FILED", "READING", "ANSWERED", "FORGOTTEN"],
			"the reader did not find a domain in a workspace member. One Rust project of the two puts " +
				"its domain in src/domain/ and the other in crates/domain/src/, and a reader that knows " +
				"one layout reports the other as a project with no domain.",
		);
	});

	it("reads the written names out of a Display rather than a name()", () => {
		const the_domain = the_domain_of(a_workspace);
		assert.equal(the_domain.how_a_stage_is_written, "a Display that matches every stage");
		assert.equal(the_domain.a_stage_name_was_derived, false);
	});

	it("reads the invariant out of a method rather than two constants", () => {
		assert.equal(
			the_domain_of(a_workspace).how_the_project_says_who_must_hold_a_stage,
			"a method on the stage",
		);
	});

	it("answers with the moves of that tree and not of the other", () => {
		assert.deepEqual(the_domain_of(a_workspace).moves, [
			{ from: "FILED", to: ["READING"] },
			{ from: "READING", to: ["ANSWERED"] },
			{ from: "ANSWERED", to: ["FORGOTTEN"] },
			{ from: "FORGOTTEN", to: [] },
		]);
	});
});

describe("the disciplines are written, not spelled by their variants", () => {
	it("answers with the written name of a discipline, not the variant's spelling", () => {
		assert.deepEqual(
			the_domain_of(a_rust_project).roles,
			["PILOT", "ENGINEER"],
			"the answer holds the Rust variant names. This project writes its disciplines in capitals " +
				"in a match, and the page must print what the project writes — the same rule the stage " +
				"reader follows, and the one this reader did not follow for roles.",
		);
	});

	it("answers with the written names a Display writes, where that is how they are written", () => {
		assert.deepEqual(the_domain_of(a_workspace).roles, ["ARCHIVIST"]);
	});

	it("refuses a discipline whose written name is nowhere, rather than printing the variant", () => {
		const the_copy = a_copy_of(a_rust_project);
		const the_file = join(the_copy, "src", "domain", "role.rs");
		const what_was_there = readFileSync(the_file, "utf8");
		writeFileSync(
			the_file,
			`${what_was_there}\nimpl Role {\n    /// How a discipline writes itself.\n    pub const fn name(self) -> &'static str {\n        match self {\n            Role::Pilot => "PILOT",\n        }\n    }\n}\n`,
		);
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a discipline with no written name was printed as its variant");
			assert.match(
				the_answer.stderr,
				/Engineer/,
				"the refusal does not name the variant whose written name is missing, so a reader " +
					"cannot tell which of the two disciplines was the one.",
			);
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});
});

describe("a reader that cannot read", () => {
	it("refuses a project with no stage enumeration, naming where it looked", () => {
		const the_copy = a_copy_of(a_rust_project);
		try {
			rmSync(join(the_copy, "src", "domain", "stage.rs"));
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a project with no stages was answered with an empty table");
			assert.match(the_answer.stderr, /stage\.rs/, "the refusal does not name the file it wanted");
		} finally {
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses a stage whose written name is nowhere in the source, rather than deriving one", () => {
		const the_copy = a_copy_of(a_rust_project);
		const the_file = join(the_copy, "src", "domain", "stage.rs");
		const what_was_there = readFileSync(the_file, "utf8");
		writeFileSync(
			the_file,
			what_was_there.replace('            Stage::Done => "DONE",\n', ""),
		);
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a stage with no written name was given one by rule");
			assert.match(
				the_answer.stderr,
				/\bDone\b/,
				"the refusal does not name the stage whose name could not be read. It cannot print the " +
					"written name — that is what it could not read — so it must name the variant, and a " +
					"reader holding 'this project could not be read' needs to know which of the four stages " +
					"was the one. Each real project has its own test saying which stage is missing.",
			);
			assert.match(the_answer.stderr, /stage\.rs/, "the refusal does not name the file it was reading");
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses when the written name and the variant disagree", () => {
		const the_copy = a_copy_of(a_rust_project);
		const the_file = join(the_copy, "src", "domain", "stage.rs");
		const what_was_there = readFileSync(the_file, "utf8");
		writeFileSync(the_file, what_was_there.replace('Stage::Idle => "IDLE"', 'Stage::Idle => "IDEL"'));
		try {
			const the_answer = ask_about(the_copy);
			// A misspelling the project itself holds is a fact about the project, and the page
			// prints what the project wrote. What it must not do is guess what was meant.
			assert.equal(the_answer.status, 0, "the reader refused a project whose own name is misspelled");
			assert.equal(
				the_domain_of(the_copy).stages[0].name,
				"IDEL",
				"the reader corrected a misspelling rather than printing what the project wrote. The " +
					"page reports projects; it does not improve them.",
			);
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("ignores a second table beside the match, because two tables are not a state machine", () => {
		const the_copy = a_copy_of(a_rust_project);
		const the_file = join(the_copy, "src", "domain", "state_machine.rs");
		const what_was_there = readFileSync(the_file, "utf8");
		// The shape `ai-sdlc-app-rs` writes down as the one it deliberately avoided: a lookup
		// table, where a stage added to neither column is classified by elimination and
		// nothing fails. A reader that understood both shapes would have to decide what an
		// absent row means, and it cannot tell an absent row from a forgotten one.
		writeFileSync(
			the_file,
			`${what_was_there}\nconst A_LOOKUP: [(Stage, &[Stage]); 2] = [\n    (Stage::Idle, &[Stage::AwaitingAgentPickup]),\n    (Stage::Done, &[]),\n];\n`,
		);
		try {
			assert.deepEqual(
				the_domain_of(the_copy).moves,
				the_domain_of(a_rust_project).moves,
				"adding a second table changed the moves the reader reports. A reader that merged both " +
					"shapes would answer with a state machine assembled from two of them, and the page " +
					"would draw one.",
			);
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses when legal_transitions_from is gone, naming the file and what it wanted", () => {
		const the_copy = a_copy_of(a_rust_project);
		const the_file = join(the_copy, "src", "domain", "state_machine.rs");
		const what_was_there = readFileSync(the_file, "utf8");
		writeFileSync(the_file, what_was_there.replace(/pub const fn legal_transitions_from[\s\S]*?\n\}\n/, ""));
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a project with no table of moves was drawn as though it had one");
			assert.match(the_answer.stderr, /state_machine\.rs/, "the refusal does not name the file it was reading");
			assert.match(
				the_answer.stderr,
				/legal_transitions_from/,
				"the refusal does not name what it was looking for, so a reader holding it does not know " +
					"whether to add a function, rename one, or give up on this project.",
			);
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses a project that says nothing about who holds a stage", () => {
		const the_copy = a_copy_of(a_rust_project);
		const the_file = join(the_copy, "src", "domain", "state_machine.rs");
		const what_was_there = readFileSync(the_file, "utf8");
		writeFileSync(
			the_file,
			what_was_there
				.replace(/pub const STAGES_WITHOUT_AN_AGENT: \[Stage; 2\] = \[[^\]]*\];/, "")
				.replace(/pub const STAGES_WITH_AN_AGENT: \[Stage; 2\] = \[[^\]]*\];/, ""),
		);
		try {
			const the_answer = ask_about(the_copy);
			assert.notEqual(the_answer.status, 0, "a project with no invariant was drawn as though it had one");
			assert.match(
				the_answer.stderr,
				/hold/i,
				"the refusal does not say that what is missing is the invariant. A reader holding it " +
					"does not know whether the table of moves or the holder of a stage was the problem.",
			);
		} finally {
			writeFileSync(the_file, what_was_there);
			rmSync(the_copy, { recursive: true, force: true });
		}
	});

	it("refuses a tree that holds two domains, rather than picking one", () => {
		const the_copy = a_copy_of(a_rust_project);
		try {
			cpSync(join(a_workspace, "crates", "domain", "src"), join(the_copy, "src", "a_second_domain"), {
				recursive: true,
			});
			const the_answer = ask_about(the_copy);
			assert.notEqual(
				the_answer.status,
				0,
				"a tree with two domains was answered from one of them, and a page that says which one " +
					"is reading a project that does not exist.",
			);
			assert.match(the_answer.stderr, /two|more than one|second/i);
		} finally {
			rmSync(the_copy, { recursive: true, force: true });
		}
	});
});
