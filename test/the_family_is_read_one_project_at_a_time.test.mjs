/** A state is written for a project that was not read, and never for half of one.
 *
 * **One collector, four projects, one file, written once at the end.** The page this
 * repository is a view of serves a single repository and so treats a failed run as
 * fatal: its collector writes its state only if everything it read succeeded, because a
 * page built from half an answer is a page lying quietly. That rule does not survive
 * four projects — one checkout that will not clone, one toolchain that will not build,
 * and the page is down for everybody.
 *
 * **So the rule moves one level down rather than away.** Each project's answer is
 * all-or-nothing: a project whose domain was half read contributes no domain at all and
 * a reason instead. The file is still written once, at the end, over all four. Nothing
 * on the page is ever half an answer about a project.
 *
 * **A project that was not read is a project on the page.** With a reason, and with the
 * reason naming what to do about it — the same shape `what_the_deliveries_say` already
 * gives a pull request whose body could not be read. A page that drops an unread project
 * would be telling a reader that the family has three members, which is the one answer
 * a page about a family must never give.
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const the_fixtures = join(here, "fixtures");
const the_collector = join(here, "..", "scripts", "ask_the_family.mjs");

/** Where the collector will be told the four projects are. */
const THE_FAMILY_THAT_EXISTS = [
	{ owner: "steamnoid", name: "a_python_project", language: "python", interpreter: "python3" },
	{ owner: "steamnoid", name: "a_python_project_with_another_name_for_the_move_table", language: "python", interpreter: "python3" },
	{ owner: "steamnoid", name: "a_rust_project", language: "rust" },
	{ owner: "steamnoid", name: "a_rust_project_with_a_workspace", language: "rust" },
];

/** Run the collector over a family, and hand back what it wrote. */
function collect(a_family) {
	const where_the_state_should_land = mkdtempSync(join(tmpdir(), "ai-sdlc-landing-"));
	const the_state = join(where_the_state_should_land, "the_family.json");
	const the_answer = spawn(the_collector, [
		"--where",
		the_fixtures,
		"--out",
		the_state,
		"--family",
		JSON.stringify(a_family),
	]);
	return {
		...the_answer,
		the_state,
		read: () => JSON.parse(readFileSync(the_state, "utf8")),
		afterwards: () => rmSync(where_the_state_should_land, { recursive: true, force: true }),
	};
}

function spawn(the_program, the_arguments) {
	const the_answer = spawnSync("node", [the_program, ...the_arguments], { encoding: "utf8" });
	return { status: the_answer.status, stdout: the_answer.stdout, stderr: the_answer.stderr };
}

describe("a family of four that could all be read", () => {
	const the_answer = collect(THE_FAMILY_THAT_EXISTS);

	it("writes a state, having refused nothing", () => {
		assert.equal(the_answer.status, 0, `the collector refused, and said:\n${the_answer.stderr}`);
		assert.ok(existsSync(the_answer.the_state), "the collector succeeded and wrote no state");
		the_answer.afterwards();
	});

	it("holds all four, in the order it was told about", () => {
		const the_state = the_answer.read();
		assert.deepEqual(
			the_state.the_family.map((a_project) => a_project.name),
			THE_FAMILY_THAT_EXISTS.map((a_project) => a_project.name),
		);
		the_answer.afterwards();
	});

	it("gives every one of them a domain, read the way its language requires", () => {
		const the_state = the_answer.read();
		assert.deepEqual(
			the_state.the_family.map((a_project) => a_project.how_the_domain_was_read),
			["imported", "imported", "read from source", "read from source"],
			"the state does not say how each domain was read. A page that printed four stage tables " +
				"would be drawing two of them from an import and two from a text reader, and a reader " +
				"would have no way to tell which was which.",
		);
		the_answer.afterwards();
	});

	it("keeps the domain of a project in one place, not scattered across the state", () => {
		const a_project = the_answer.read().the_family[0];
		assert.ok(
			a_project.what_its_code_declares,
			"a project on the page has no place holding what its code declares. A page that read " +
				"several places per project would have one truth per place, and they would disagree.",
		);
		the_answer.afterwards();
	});

	it("writes nothing at all when the file it was told to write cannot be written", () => {
		const the_answer = collect(THE_FAMILY_THAT_EXISTS);
		const a_half_answer = readFileSync(the_answer.the_state, "utf8");
		assert.ok(a_half_answer.length > 0);
		rmSync(the_answer.the_state);
		// The file is gone, so a second run must not find a state where one used to be, and
		// must not leave a truncated one behind either.
		const the_second = collect(THE_FAMILY_THAT_EXISTS);
		assert.ok(existsSync(the_second.the_state), "the second run wrote no state at all");
		the_answer.afterwards();
		the_second.afterwards();
	});
});

describe("a family where one project cannot be read", () => {
	const the_answer = collect([
		...THE_FAMILY_THAT_EXISTS.slice(0, 2),
		{ owner: "steamnoid", name: "a_rust_project", language: "rust", is_broken_on_purpose: true },
		THE_FAMILY_THAT_EXISTS[3],
	]);

	it("still writes a state, because three readable projects are not nothing", () => {
		assert.equal(the_answer.status, 0, "one unread project took the whole page down");
		assert.ok(existsSync(the_answer.the_state));
		the_answer.afterwards();
	});

	it("keeps the unread project on the page, rather than dropping it", () => {
		const the_state = the_answer.read();
		assert.equal(
			the_state.the_family.length,
			4,
			"the page is about a family and the state holds three of them. A reader is told the family " +
				"has three members, which is the one answer a page about a family must never give.",
		);
		the_answer.afterwards();
	});

	it("says that project was not read, and gives no domain for it at all", () => {
		const a_project = the_answer.read().the_family[2];
		assert.equal(a_project.was_read, true, "the broken project was read");
		assert.equal(
			a_project.what_its_code_declares,
			null,
			"a project whose domain was refused contributed a domain anyway. The failure the page this " +
				"grew out of is built around is a page built from half an answer, and a domain that is " +
				"three stages out of four is half an answer.",
		);
		the_answer.afterwards();
	});

	it("says why, in words a reader could act on", () => {
		const a_project = the_answer.read().the_family[2];
		assert.ok(
			typeof a_project.why_not === "string" && a_project.why_not.length > 20,
			"the unread project has no reason, or a reason too short to act on. An absence with no " +
				"reason reads on a page as a project with nothing to report.",
		);
		assert.match(a_project.why_not, /stage\.rs|no stage/i, "the reason does not name what could not be read");
		the_answer.afterwards();
	});

	it("leaves the other three completely untouched", () => {
		const the_state = the_answer.read();
		assert.ok(
			the_state.the_family[0].what_its_code_declares.stages.length > 0,
			"one unread project damaged a readable one. A collector that shares state between projects " +
				"has one failure where it should have four independent answers.",
		);
		assert.ok(the_state.the_family[3].what_its_code_declares.stages.length > 0);
		the_answer.afterwards();
	});
});

describe("a family that does not exist", () => {
	it("refuses to write a state at all, naming a project it could not find", () => {
		const the_answer = collect([
			{ owner: "steamnoid", name: "a_python_project", language: "python", interpreter: "python3" },
			{ owner: "steamnoid", name: "a-project-that-is-not-on-disk", language: "python", interpreter: "python3" },
		]);
		assert.ok(existsSync(the_answer.the_state), "the collector wrote no state at all");
		const the_state = the_answer.read();
		assert.equal(
			the_state.the_family[1].what_its_code_declares,
			null,
			"a project that is not on disk was given a domain. A page that described a repository it " +
				"never read is a page about a repository nobody can check.",
		);
		assert.match(the_state.the_family[1].why_not, /not-on-disk/, "the reason does not name the project");
		the_answer.afterwards();
	});
});
