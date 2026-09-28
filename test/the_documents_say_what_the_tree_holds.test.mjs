/** The documents, read the way each project writes them, and never read into.
 *
 * **The facts on this page come from two kinds of place: a project's code and a project's
 * own documents.** The documents are the dangerous half, because prose drifts silently
 * while a stage added to an enumeration breaks the build. So every reader here takes a
 * document's word for a claim *the document makes* and never for a claim it does not —
 * and the two are kept apart, which is the rule the page this one grew out of calls a
 * finding against a claim.
 *
 * **A phase's `done` is the sharpest case in the family, and it is why this file
 * exists.** Two of the four projects strike a finished phase through with `~~…~~` and
 * two mark nothing at all. A reader that reads "done" from a strikethrough would print
 * ten phases as "not done" for the two that mark nothing, while phases 0 and 1 of both
 * are demonstrably delivered — and it would be wrong in the one direction a reader is
 * least likely to check. So the marker is reported, whatever it is, and a phase with no
 * marker says so rather than being classified.
 *
 * | what a phase carries | what the page may say |
 * |---|---|
 * | a `~~struck~~` slice | marked done, and the page shows the strike |
 * | a `**done**` word in the slice | marked done, and the page says it was a word |
 * | no marker at all | marked in neither way — which is what the document says |
 *
 * **"Marked in neither way" is a finding and not a gap.** It says the project stopped
 * marking its phases, and a page that renders it as "next" is making a claim about the
 * work that the document declined to make.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import {
	how_the_documents_mark_a_phase_as_done,
	what_the_licence_says,
	what_the_phases_say,
} from "../src/page/what_the_documents_say.mjs";

/** A backlog table as three of the four projects write one. */
const A_BACKLOG_TABLE = `| Phase | Slice | Gate |
|---|---|---|
| 0 | the harness, the glossary | every gate fails on its own fixtures first |
| 1 | ~~the domain: entities, the state machine~~ **done** | a seventh Stage does not compile |
| 2 | outside the domain: GitHub | a real push to a real fork |`;

describe("a phase marked in the two ways the family marks one", () => {
	it("says a struck phase is done, and how it was marked", () => {
		assert.equal(how_the_documents_mark_a_phase_as_done("~~the domain: entities~~ **done**"), "a strikethrough and the word done");
	});

	it("says a phase struck alone is done too, because the strike is the mark", () => {
		assert.equal(how_the_documents_mark_a_phase_as_done("~~the domain: entities~~"), "a strikethrough");
	});

	it("says a phase marked with the word alone is done, because both are marks", () => {
		assert.equal(how_the_documents_mark_a_phase_as_done("the domain **done**"), "the word done");
	});

	it("says a phase with no marker is marked in neither way, and does not guess", () => {
		assert.equal(
			how_the_documents_mark_a_phase_as_done("outside the domain: GitHub"),
			"in neither way",
			"a phase with no mark in its document was reported as not done. Two of the four projects " +
				"mark nothing at all, and their phases 0 and 1 are delivered — so a reader that reads a " +
				"phase's state out of a marker's absence is reporting a claim about the work that the " +
				"document declined to make, in the one direction a reader is least likely to check.",
		);
	});

	it("does not read the word done out of the gate column", () => {
		// The phase whose gate says "each ships a real-agent e2e test and an evals entry" is
		// not done, and a reader that searched the whole row would have said it was.
		assert.equal(
			how_the_documents_mark_a_phase_as_done("the remaining eight agents, one responsibility each"),
			"in neither way",
			"a word in a gate was read as a mark on the phase. The gate column is prose written to be " +
				"hard, and 'each ships a test' is not a statement that anything shipped.",
		);
	});
});

describe("a backlog table, read out of a document", () => {
	const the_reading = what_the_phases_say(A_BACKLOG_TABLE, "AGENTS.md");
	const the_phases = the_reading.phases;

	it("reads every row that declares a phase number", () => {
		assert.deepEqual(
			the_phases.map((a_phase) => a_phase.number),
			[0, 1, 2],
			"the reader did not read the three phases the table declares. A page showing two of a " +
				"project's three phases is a page with a hole in it and nothing saying so.",
		);
	});

	it("carries the slice and the gate of each, because the page prints both", () => {
		assert.equal(the_phases[1].the_slice, "~~the domain: entities, the state machine~~ **done**");
		assert.match(the_phases[1].the_gate, /seventh/);
	});

	it("says which mark each phase carries, so a reader can see the claim behind the verdict", () => {
		assert.deepEqual(
			the_phases.map((a_phase) => a_phase.how_it_was_marked),
			["in neither way", "a strikethrough and the word done", "in neither way"],
			"the answer does not say which mark a verdict came from. The verdict is a finding about the " +
				"document's claim, and a reader who cannot see the claim cannot check the finding.",
		);
	});

	it("gives each phase a verdict that follows its mark and nothing else", () => {
		assert.deepEqual(
			the_phases.map((a_phase) => a_phase.verdict),
			["in neither way", "done", "in neither way"],
			"a phase's verdict did not follow the mark in its own row. The three verdicts are the only " +
				"three this page may print, and each one has to be traceable to a mark in the document.",
		);
	});

	it("says which document it read, so a reader can go and check", () => {
		assert.equal(
			the_phases[0].where_it_was_read,
			"AGENTS.md",
			"the answer does not say which document the phases came from. A phase table the reader " +
				"cannot find is a claim with nothing to check it against.",
		);
	});

	it("refuses a document with no backlog table, rather than reporting no phases", () => {
		const nothing = what_the_phases_say("There is nothing to report here.\n", "README.md");
		assert.equal(nothing.verdict, "there is no backlog table");
		assert.match(
			nothing.why_not,
			/README\.md/,
			"the refusal does not name the document that was searched, so a reader cannot tell whether " +
				"the project has no phases or the project keeps them somewhere else.",
		);
		assert.equal(nothing.phases.length, 0, "a refusal that also answered with an empty list is two answers");
	});
});

describe("a licence, read out of a file", () => {
	it("is the first line of the file, because that is what a licence states", () => {
		assert.equal(
			what_the_licence_says("All rights reserved.  Copyright (c) 2026 steamnoid"),
			"All rights reserved.  Copyright (c) 2026 steamnoid",
		);
	});

	it("is not stated when there is no licence file, rather than being an empty string", () => {
		assert.equal(
			what_the_licence_says(null),
			null,
			"a project with no licence was given one as an empty string. An empty string on a page " +
				"reads as a licence nobody could read rather than as a licence that does not exist, and " +
				"three of the four projects here are not open source and the fourth is MIT.",
		);
	});
});
