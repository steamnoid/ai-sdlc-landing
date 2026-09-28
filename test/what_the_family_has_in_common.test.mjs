/** What the four projects declare, and whether that is the same thing four times.
 *
 * **This is the only verdict on the page that is a fact about four projects rather than
 * about one**, and it is the reason a page about the family is a different page from the
 * one about a single repository. Everything else it prints was read out of one tree; this
 * is only knowable by holding all four answers side by side.
 *
 * **The dangerous verdict is the clean one.** "They declare the same domain" is a claim
 * about four projects, and a reader has no way to tell a claim about four from a claim
 * about three except that the page says so. So the verdict is refused outright when
 * fewer than four were read, and the number that could be is the answer instead — which
 * is the difference between a page reporting a result and a page reporting a result it
 * checked.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { what_the_family_declares } from "../src/page/what_the_family_declares.mjs";

/** The family's own six stages, five roles and seven moves. */
const THE_STAGES = [
	{ name: "IDLE", an_agent_must_be_holding_it: false },
	{ name: "AWAITING_AGENT_PICKUP", an_agent_must_be_holding_it: true },
	{ name: "IN_PROGRESS_BY_AGENT", an_agent_must_be_holding_it: true },
	{ name: "AWAITING_HUMAN_APPROVAL", an_agent_must_be_holding_it: false },
	{ name: "READY", an_agent_must_be_holding_it: false },
	{ name: "DONE", an_agent_must_be_holding_it: false },
];
const THE_ROLES = ["ARCH", "DEV", "PO", "QA", "SEC"];
const THE_MOVES = [
	{ from: "IDLE", to: ["AWAITING_AGENT_PICKUP"] },
	{ from: "AWAITING_AGENT_PICKUP", to: ["IN_PROGRESS_BY_AGENT"] },
	{ from: "IN_PROGRESS_BY_AGENT", to: ["AWAITING_AGENT_PICKUP", "AWAITING_HUMAN_APPROVAL"] },
	{ from: "AWAITING_HUMAN_APPROVAL", to: ["AWAITING_AGENT_PICKUP", "DONE"] },
	{ from: "READY", to: ["AWAITING_AGENT_PICKUP"] },
	{ from: "DONE", to: [] },
];

/** A project that declares the family's domain, with the way it was read. */
function a_project_declaring_the_family_domain(how_the_domain_was_read) {
	return {
		owner: "steamnoid",
		name: "a-project",
		was_read: true,
		why_not: null,
		how_the_domain_was_read,
		what_its_code_declares: {
			stages: THE_STAGES,
			roles: THE_ROLES,
			moves: THE_MOVES,
			the_name_the_move_table_goes_by: "LEGAL_TRANSITIONS",
			how_the_project_says_who_must_hold_a_stage: "two tuples in the state machine",
		},
	};
}

/** A copy of a project with one part of its domain changed. */
function a_project_with(this_field_changed_to) {
	return {
		owner: "steamnoid",
		name: "a-project",
		was_read: true,
		why_not: null,
		how_the_domain_was_read: "imported",
		what_its_code_declares: {
			stages: THE_STAGES,
			roles: THE_ROLES,
			moves: THE_MOVES,
			the_name_the_move_table_goes_by: "LEGAL_TRANSITIONS",
			how_the_project_says_who_must_hold_a_stage: "two tuples in the state machine",
			...this_field_changed_to,
		},
	};
}

const FOUR = [
	{ ...a_project_declaring_the_family_domain("imported"), name: "one" },
	{ ...a_project_declaring_the_family_domain("read from source"), name: "two" },
	{ ...a_project_declaring_the_family_domain("imported"), name: "three" },
	{ ...a_project_declaring_the_family_domain("read from source"), name: "four" },
];

describe("four projects that declare the same domain", () => {
	const the_verdict = what_the_family_declares({ the_family: FOUR });

	it("says they declare the same domain", () => {
		assert.equal(
			the_verdict.verdict,
			"they declare the same domain",
			"four answers with the same six stages, the same five roles and the same seven moves " +
				"were not recognised as the same thing. That sentence is the one a reader of this page " +
				"came for, and it is either computed or it is not there.",
		);
	});

	it("does not say so about a convention, because four projects are expected to differ on one", () => {
		assert.equal(
			the_verdict.the_disagreements.length,
			0,
			"the verdict reported a disagreement. The four in this state differ in how their domain " +
				"was read and in the name they give the table of moves, which is four conventions rather " +
				"than four domains, and a verdict that counted them as differences would refuse a family " +
				"that agrees on everything that matters.",
		);
	});

	it("carries the four ways of reading and naming, because the page compares them", () => {
		assert.deepEqual(
			the_verdict.the_projects.map((a_project) => a_project.how_the_domain_was_read),
			["imported", "read from source", "imported", "read from source"],
			"the answer does not say how each domain was read. A page that printed a stage table for " +
				"two of the four and not the other two would be drawing the same table from an import " +
				"and from a text reader, and a reader could not tell which was which.",
		);
		assert.deepEqual(
			the_verdict.the_projects.map((a_project) => a_project.the_name_the_move_table_goes_by),
			["LEGAL_TRANSITIONS", "LEGAL_TRANSITIONS", "LEGAL_TRANSITIONS", "LEGAL_TRANSITIONS"],
			"the answer drops the name each project gives the table of moves. Four projects and four " +
				"names for one table is one of the things a page about four is here to show.",
		);
	});
});

describe("four projects where one declares something else", () => {
	it("says they differ, and which one", () => {
		const the_family = [...FOUR];
		the_family[2] = { ...a_project_with({ stages: [...THE_STAGES, { name: "SEVENTH", an_agent_must_be_holding_it: false }] }), name: "three" };
		const the_verdict = what_the_family_declares({ the_family });
		assert.equal(the_verdict.verdict, "1 of them differ");
		assert.deepEqual(
			the_verdict.the_disagreements.map((a_disagreement) => a_disagreement.against.name),
			["three"],
		);
		assert.equal(the_verdict.the_disagreements[0].part, "stages");
	});

	it("names every project that differs, not only the first", () => {
		// Two of the four differ and they differ from each other, so a verdict that compared
		// everything to the first project would report one disagreement where a reader needs two.
		const the_family = [...FOUR];
		the_family[1] = { ...a_project_with({ roles: [...THE_ROLES, "LEGAL"] }), name: "two" };
		the_family[3] = { ...a_project_with({ roles: [...THE_ROLES, "LEGAL"] }), name: "four" };
		const the_verdict = what_the_family_declares({ the_family });
		assert.deepEqual(
			the_verdict.the_disagreements.map((a_disagreement) => a_disagreement.against.name).sort(),
			["four", "two"],
			"the verdict reported one disagreement where two projects differ. A page that names one of " +
				"two projects with a seventh role leaves a reader believing the other one agrees.",
		);
	});

	it("does not call a different role a different domain when only the spelling differs", () => {
		const the_family = [...FOUR];
		the_family[1] = { ...a_project_with({ roles: ["ARCH", "DEV", "PO", "QA", "SEC", "LEGAL"] }), name: "two" };
		const the_verdict = what_the_family_declares({ the_family });
		assert.equal(the_verdict.the_disagreements[0].part, "roles", "a sixth discipline was not reported");
	});
});

describe("a family that could not be read whole", () => {
	const one_unread = {
		...FOUR[3],
		was_read: false,
		why_not: "the checkout could not be cloned: exit 128",
	};

	it("refuses the clean verdict, because a claim about three is a claim about three", () => {
		const the_verdict = what_the_family_declares({
			the_family: [...FOUR.slice(0, 3), one_unread],
		});
		assert.equal(
			the_verdict.verdict,
			"could not be read for 1",
			"the page said four projects declare the same domain when only three were read. A reader " +
				"cannot tell a claim about four from a claim about three by looking at it, which is " +
				"exactly why the number is printed next to the verdict.",
		);
		assert.equal(the_verdict.how_many_could_be_read, 3);
		assert.equal(the_verdict.how_many_were_asked_about, 4);
	});

	it("says which project was not read, and why", () => {
		const the_verdict = what_the_family_declares({
			the_family: [...FOUR.slice(0, 3), one_unread],
		});
		assert.match(the_verdict.why_not, /four/);
		assert.match(the_verdict.why_not, /exit 128/, "the verdict does not carry the reason one project was unread");
	});

	it("refuses the verdict for a family of one, however well that one was read", () => {
		const the_verdict = what_the_family_declares({ the_family: [FOUR[0]] });
		assert.equal(
			the_verdict.verdict,
			"could not be read for 0",
			"one readable project produced a verdict about a family. The claim is about agreement, and " +
				"agreement needs something to agree with.",
		);
	});
});

describe("no state at all", () => {
	it("says there is nothing to say, rather than comparing nothing and finding it agrees", () => {
		const the_verdict = what_the_family_declares({ the_family: [] });
		assert.equal(the_verdict.verdict, "nothing to say");
		assert.equal(the_verdict.how_many_could_be_read, 0);
	});

	it("says the same for a state that is not there at all", () => {
		assert.equal(what_the_family_declares(undefined).verdict, "nothing to say");
	});
});
