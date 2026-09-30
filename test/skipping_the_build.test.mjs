/** Whether the family moved, in a way worth publishing again.
 *
 * **A skip that fires when it should not is the worst failure here**, because it is silent:
 * the page stops moving, everything it describes keeps moving, and every run is green. So
 * every "this is not a change" test below carries a second assertion that a real change
 * *is* detected, which is what stops a permissive comparison from passing as a correct one.
 *
 * **Three ways this goes wrong, and they are all invisible from a green run.**
 *
 * | the mistake | what it does |
 * |---|---|
 * | comparing when the state was read | always finds a difference, skips nothing, and is the same as having no comparison |
 * | keying the skip on the projects alone | a fixed template is never published, for ever |
 * | reporting an unread published state as "no change" | the page quietly stops updating |
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { what_differs_between } from "../scripts/compare_the_states.mjs";
import { what_became_done_between } from "../scripts/what_differs_from_what_is_published.mjs";

/** A state for four projects, as a real run writes one. */
function a_state(what_changed_in_it = {}) {
	return {
		this_page: { owner: "steamnoid", name: "ai-sdlc-landing", url: "https://github.com/steamnoid/ai-sdlc-landing" },
		the_build: { read_at: "2026-09-28T10:00:00.000Z", branch: "main", was_cloned: true, page_code_commit: "aaaaaaa" },
		the_family: [
			{
				owner: "steamnoid",
				name: "ai-sdlc-os",
				was_read: true,
				how_the_domain_was_read: "imported",
				what_its_code_declares: { stages: [{ name: "IDLE", an_agent_must_be_holding_it: false }] },
				the_suite: {
					was_run: true,
					is_green: true,
					passed: 913,
					what_it_printed: "913 passed in 4.12s",
					what_was_run: "uv run pytest -q",
				},
			},
		],
		...what_changed_in_it,
	};
}

describe("two states that are the same family", () => {
	it("finds no difference, because a run every hour over an unmoved family is the normal case", () => {
		assert.deepEqual(what_differs_between(a_state(), a_state()), []);
	});

	it("does not care when the state was read, because that differs on every run by definition", () => {
		const the_second = a_state();
		the_second.the_build.read_at = "2026-09-28T11:00:00.000Z";
		assert.deepEqual(
			what_differs_between(a_state(), the_second),
			[],
			"the moment the state was read was compared. It differs on every run by definition, so a " +
				"comparison that includes it always finds a difference, skips nothing, and behaves " +
				"exactly like having no comparison at all.",
		);
	});

	it("does not care whether the family was cloned or read where it already stood", () => {
		const the_second = a_state();
		the_second.the_build.was_cloned = false;
		assert.deepEqual(what_differs_between(a_state(), the_second), []);
	});

	it("does not mind a different duration in the same output", () => {
		const the_second = a_state();
		the_second.the_family[0].the_suite.what_it_printed = "913 passed in 9.87s";
		assert.deepEqual(
			what_differs_between(a_state(), the_second),
			[],
			"a run's own duration was compared. The words are the same and the timing is not, and a page " +
				"republished four times a day because a suite took a different number of seconds is a page " +
				"nobody can learn anything from.",
		);
	});

	it("does not care whether the family was cloned or read where it already stood", () => {
		const the_second = a_state();
		the_second.the_build.was_cloned = false;
		assert.deepEqual(what_differs_between(a_state(), the_second), []);
	});

	it("does not mind a different duration in the same output", () => {
		const the_second = a_state();
		the_second.the_family[0].the_suite.what_it_printed = "913 passed in 9.87s";
		assert.deepEqual(
			what_differs_between(a_state(), the_second),
			[],
			"a run's own duration was compared. The words are the same and the timing is not, and a page " +
				"republished four times a day because a suite took a different number of seconds is a page " +
				"nobody can learn anything from.",
		);
	});

});

describe("two states that are not the same family", () => {
	// **Every one of these carries the other half.** A comparison that finds nothing when a real
	// change happened is the failure that matters, and a test that only proved the permissive side
	// would pass a comparison that skipped every build for ever.
	const a_real_change = [
		["a project moved", (the_state) => (the_state.the_family[0].what_its_code_declares.stages = [{ name: "SEVENTH" }])],
		["a project was read differently", (the_state) => (the_state.the_family[0].how_the_domain_was_read = "read from source")],
		["a suite was no longer green", (the_state) => (the_state.the_family[0].the_suite.is_green = false)],
		["a suite passed a different number", (the_state) => (the_state.the_family[0].the_suite.passed = 914)],
		["a project could not be read at all", (the_state) => (the_state.the_family[0].was_read = false)],
		["a project was added", (the_state) => the_state.the_family.push({ owner: "steamnoid", name: "a-fifth" })],
		["a phase gained a mark", (the_state) => (the_state.the_family[0].phases = [{ number: 1, verdict: "done" }])],
	];

	for (const [what_happened, it_happened] of a_real_change) {
		it(`finds it when ${what_happened}`, () => {
			const the_second = a_state();
			it_happened(the_second);
			assert.ok(
				what_differs_between(a_state(), the_second).length > 0,
				`${what_happened} and the comparison found nothing. This is the failure that matters: a ` +
					"page that skips every build because nothing ever looks different is a page that has " +
					"stopped being true and reports success.",
			);
		});
	}

	it("finds a fixed template, because a project standing still is not a page standing still", () => {
		const the_second = a_state();
		the_second.the_build.page_code_commit = "bbbbbbb";
		assert.ok(
			what_differs_between(a_state(), the_second).length > 0,
			"the page's own commit was not compared. The four projects stand still between commits and a " +
				"template gets fixed, so a comparison keyed on the projects alone would keep the old " +
				"template for ever and never publish it again.",
		);
	});

	it("finds a key that appeared, rather than reading the new fact as nothing", () => {
		const the_second = a_state();
		the_second.the_family[0].the_lineage = { verdict: "names no other project" };
		assert.ok(what_differs_between(a_state(), the_second).length > 0, "a field that appeared was not a difference");
	});

	it("finds a key that went away, rather than reading the absence as agreement", () => {
		const the_second = a_state();
		delete the_second.the_family[0].the_suite;
		assert.ok(what_differs_between(a_state(), the_second).length > 0, "a field that vanished was not a difference");
	});

	it("compares both ways, so the answer does not depend on which state came first", () => {
		const the_second = a_state();
		the_second.the_family[0].the_suite.passed = 1;
		assert.deepEqual(
			what_differs_between(a_state(), the_second),
			what_differs_between(the_second, a_state()),
			"the comparison is not symmetric, so which of the two states is called first decides the " +
				"answer — and a run cannot be trusted to call them the same way twice.",
		);
	});
});

describe("what became done since the last read, and what a page may say about it", () => {
	// **A difference is not a movement.** `what_differs_between` answers "is this the same page",
	// and it answers it about suites, licences, commit pins and the date a tree was read — most of
	// which change constantly. A reader asking what got finished is asking a narrower question, and
	// the narrow answer is the one worth printing: it is the only thing on this page that moves when
	// somebody does the work.
	//
	// **Keyed on the words of the item, not on the phase number.** A project that inserts a row
	// renumbers every row below it, and a comparison keyed on the number would then report nothing
	// after the insertion — which is exactly where the new work would be. A phase's number is what
	// the document calls a row; an item's words are what a reader recognises.

	/** One project, with the items a backlog row is made of. */
	const a_family = (the_items) => ({
		the_family: [{ name: "a-project", what_its_documents_say: { phases: { verdict: "read", phases: [{ number: 1, the_items }] } } }],
	});

	it("names the item that was owed and is not any more", () => {
		const the_movement = what_became_done_between(
			a_family([{ the_slice: "the tools", is_done: true }, { the_slice: "exposure through MCP is not", is_done: true }]),
			a_family([{ the_slice: "the tools", is_done: true }, { the_slice: "exposure through MCP is not", is_done: false }]),
		);

		assert.deepEqual(
			the_movement[0].became_done,
			["exposure through MCP is not"],
			"an item that stopped being owed is not named, so the page has nothing to print for the only " +
				"event on it that a person caused",
		);
		assert.deepEqual(the_movement[0].became_owed, [], "nothing became owed, so nothing is named as owed");
	});

	it("names work that became owed again, because a page that reports only the good news is a bias", () => {
		// **This was written the other way round first**, with the delivered half as the *first*
		// argument — and it failed for the right reason, which is that `what_became_done_between(now,
		// before)` means what the argument names. A test written backwards about a two-argument
		// function is a test that would have passed on a function that did the opposite.
		const the_movement = what_became_done_between(
			a_family([{ the_slice: "the tools", is_done: false }]),
			a_family([{ the_slice: "the tools", is_done: true }]),
		);

		assert.deepEqual(
			the_movement[0].became_owed,
			["the tools"],
			"a strikethrough was taken back out of a document and the page said nothing. Printing only " +
				"progress is how a page becomes a place where bad news does not appear.",
		);
		assert.deepEqual(the_movement[0].became_done, []);
	});

	it("finds the item even when its row was renumbered by an insertion above it", () => {
		const the_movement = what_became_done_between(
			{ the_family: [{ name: "a-project", what_its_documents_say: { phases: { verdict: "read", phases: [{ number: 4, the_items: [{ the_slice: "the tools", is_done: true }] }] } } }] },
			{ the_family: [{ name: "a-project", what_its_documents_say: { phases: { verdict: "read", phases: [{ number: 1, the_items: [{ the_slice: "the tools", is_done: false }] }] } } }] },
		);

		assert.deepEqual(
			the_movement[0].became_done,
			["the tools"],
			"the item was delivered and nothing was named, because its phase number changed. Every " +
				"project's backlog gets a row inserted above it at some point, and every movement below " +
				"that row would go unreported for ever.",
		);
	});

	it("says nothing moved when nothing did, rather than printing an empty list of achievements", () => {
		const the_movement = what_became_done_between(
			a_family([{ the_slice: "the tools", is_done: true }]),
			a_family([{ the_slice: "the tools", is_done: true }]),
		);

		assert.deepEqual(the_movement[0], {
			name: "a-project",
			was_in_the_previous_read: true,
			became_done: [],
			became_owed: [],
		});
	});

	it("names a project that was not in the previous read at all, rather than calling it unchanged", () => {
		const the_movement = what_became_done_between(a_family([{ the_slice: "the tools", is_done: true }]), {
			the_family: [],
		});

		assert.equal(
			the_movement[0].was_in_the_previous_read,
			false,
			"a project with no previous reading is being reported as one that did not move. Everything in " +
				"it is new, and a page that says so is right; a page that says it did not move is wrong by " +
				"omission, which is the way this page lies.",
		);
	});

	it("names nothing for a project whose previous reading found no list, rather than calling it a delivery", () => {
		// **A backlog the reader could not find is not an empty backlog.** The previous read refused
		// to read this project's table, so nothing is known about what was owed then — and a page
		// that reported a whole table appearing as work delivered would be right by accident and
		// wrong on every run after.
		const the_movement = what_became_done_between(a_family([{ the_slice: "the tools", is_done: true }]), {
			the_family: [
				{
					name: "a-project",
					what_its_documents_say: { phases: { verdict: "there is no backlog table", phases: [], why_not: "no table" } },
				},
			],
		});

		assert.deepEqual(
			the_movement[0],
			{ name: "a-project", was_in_the_previous_read: false, became_done: [], became_owed: [] },
			"a project whose previous reading found no list is reported as having had a delivery, or is " +
				"reported as one that did not move. The first is a claim about work nobody can check and " +
				"the second is a claim about work that was never read.",
		);
	});
});

