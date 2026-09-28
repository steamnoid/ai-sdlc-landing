/** Which project came from which, and what the file that says so is worth.
 *
 * **The family is related, and only one file in four repositories says so.** Three of the
 * four write about "the sibling project" and do not name it; one — `ai-sdlc-app-rs` —
 * names two repositories in `SOURCES.lock`, with a commit, a branch and a date for each,
 * and a licence header that names a third. That asymmetry is the finding, and it is why
 * this file exists: a page that drew a lineage graph from the prose would be drawing one
 * it cannot check.
 *
 * **A pin is a promise about a moment, and the moment is printed.** `SOURCES.lock` records
 * the commit a port was read from, and a test in the port re-hashes every pinned file to
 * catch a source that moved. This page cannot re-hash a sibling's tree from here, so what
 * it says is the pin and not the agreement — the difference between "read from this commit"
 * and "still matches it", which is a distinction a reader of a family overview is exactly
 * the person to need.
 *
 * **An edge with no file behind it is an absence with a reason.** "This project names no
 * other" is a fact worth printing; "this project's lineage is unknown" is a thing this
 * reader must not say, because it is not true and it is not what the file absence means.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { what_the_lineage_says } from "../src/page/what_the_lineage_says.mjs";

/** What a `SOURCES.lock` records, in the shape the real file uses. */
const A_PIN_RECORDING_TWO_SOURCES = [
	"# The sources this port was read from.",
	"#",
	"# ported-from:   /Users/somebody/Develop/ai-sdlc/ai-sdlc-os",
	"# commit:        98fab0fcff1e9f2dd52a1d3d227a1398b2dc2e6c",
	"# branch:        phase-8-analysis-pipeline",
	"# read-on:       2026-09-28",
	"#",
	"# design-from:    /Users/somebody/Develop/ai-sdlc/ai-sdlc-os-landing",
	"# design-commit:  f44cf12698f02cc9784630d8b7bf199074bfcb82",
	"# design-read-on: 2026-09-27",
	"#",
	"# --- files ---",
	"0f1e2d3c4b5a69788796a5b4c3d2e1f009182736  AGENTS.md",
].join("\n");

/** A project's licence naming the project it was ported from, as one of the family does. */
const A_LICENCE_NAMING_A_REPOSITORY = [
	"All Rights Reserved",
	"",
	"This repository is a port of https://github.com/steamnoid/ai-sdlc-os,",
].join("\n");

describe("a project with a file that records where it was read from", () => {
	const a_project_with_a_pin = {
		owner: "steamnoid",
		name: "ai-sdlc-app-rs",
		the_text_of_a_sources_lock: A_PIN_RECORDING_TWO_SOURCES,
		the_text_of_its_licence: A_LICENCE_NAMING_A_REPOSITORY,
	};

	it("names the project it was read from, and the commit and branch it read at", () => {
		const [the_port, the_design] = what_the_lineage_says(a_project_with_a_pin).the_edges;

		assert.equal(the_port.points_at, "ai-sdlc-os");
		assert.equal(the_port.how_it_is_recorded, "a pin in SOURCES.lock");
		assert.equal(the_port.at_the_commit, "98fab0f");
		assert.equal(the_port.on_the_branch, "phase-8-analysis-pipeline");
		assert.equal(the_port.read_on, "2026-09-28");

		// **Null, because the pin records a path on somebody's machine and a path has no owner
		// in it.** The real SOURCES.lock says `/Users/<somebody>/Develop/ai-sdlc/ai-sdlc-os`, so the
		// owner of that repository is written down nowhere in the file and a page that filled it in
		// would be guessing from a family name.
		assert.equal(the_port.owner, null, "an owner was invented for a pin that records only a path");

		// **The design reference carries its own commit, not the port's.** The pin records
		// `design-commit` and `design-read-on` beside `design-from`, and the first version of this
		// reader took the first line that looked like a commit — so the page said the design
		// reference was read at the commit the port was read at, which is a false sentence about a
		// file a reader can go and look at.
		assert.equal(the_design.points_at, "ai-sdlc-os-landing");
		assert.equal(the_design.how_it_is_recorded, "a design reference in SOURCES.lock");
		assert.equal(
			the_design.at_the_commit,
			"f44cf12",
			"the design reference was given the port's commit. The pin records design-commit beside " +
				"design-from, and pairing them is a page stating a port was read at a commit it was " +
				"never read at.",
		);
		assert.equal(the_design.read_on, "2026-09-27");
		assert.equal(the_design.on_the_branch, null, "a branch was given to a reference the pin records no branch for");
	});

	it("reads an owner out of an address, because an address carries one and a path does not", () => {
		const the_lineage = what_the_lineage_says({
			owner: "steamnoid",
			name: "a-project",
			the_text_of_a_sources_lock: "# ported-from:   https://github.com/somebody/else",
			the_text_of_its_licence: null,
		});
		assert.equal(the_lineage.the_edges[0].owner, "somebody");
		assert.equal(the_lineage.the_edges[0].points_at, "else");
	});

	it("says the pin is not checked, rather than saying the pin holds", () => {
		// **Only the pins.** An edge out of a licence line is not a pin, and a question about
		// whether a pin holds is meaningless for it — so the field is null there and the loop
		// here asks about the two edges a `SOURCES.lock` recorded.
		const the_pins = what_the_lineage_says(a_project_with_a_pin).the_edges.filter((an_edge) =>
			an_edge.how_it_is_recorded.endsWith("in SOURCES.lock"),
		);
		assert.equal(the_pins.length, 2, "this fixture records two lines in a SOURCES.lock");
		for (const a_pin of the_pins) {
			assert.equal(
				a_pin.is_the_pin_still_held,
				null,
				"a pin was reported as holding or not holding. This page reads one repository and " +
					"cannot re-hash a sibling's tree, so the only honest answer is that it did not check — " +
					"and 'read from this commit' is a different claim from 'still matches it'.",
			);
			assert.match(
				a_pin.why_the_pin_may_be_stale,
				/not checked|re-hash/i,
				"the edge says nothing about whether the pin is still held, so a reader cannot tell an " +
					"unchecked pin from one somebody verified.",
			);
		}
	});

	it("also records what the licence names, because a licence is a document like any other", () => {
		const what_the_licence_says = what_the_lineage_says({
			owner: "steamnoid",
			name: "another-project",
			the_text_of_a_sources_lock: null,
			the_text_of_its_licence: A_LICENCE_NAMING_A_REPOSITORY,
		});
		assert.equal(what_the_licence_says.the_edges[0].how_it_is_recorded, "a line in its own licence");
		assert.equal(what_the_licence_says.the_edges[0].at_the_commit, null);
	});

	it("does not carry the sentence's punctuation into a repository's name", () => {
		// The real licence reads "This repository is a port of https://github.com/steamnoid/ai-sdlc-os,"
		// and the comma is the sentence's, not the name's. An edge pointing at `ai-sdlc-os,` is a
		// link to nothing, and a page drawing one is drawing a project that does not exist.
		const [the_edge] = what_the_lineage_says({
			owner: "steamnoid",
			name: "a-project",
			the_text_of_a_sources_lock: null,
			the_text_of_its_licence: A_LICENCE_NAMING_A_REPOSITORY,
		}).the_edges;
		assert.equal(
			the_edge.points_at,
			"ai-sdlc-os",
			"a repository's name was carried out of a sentence with its punctuation attached, so the " +
				"edge points at a project whose name ends in a comma.",
		);
	});
});

describe("a project that names no other", () => {
	const a_project_that_names_none = {
		owner: "steamnoid",
		name: "ai-sdlc-os-plus",
		the_text_of_a_sources_lock: null,
		the_text_of_its_licence: "All rights reserved.  Copyright (c) 2026 ai-sdlc-os-plus contributors",
	};

	it("has no edges, and says why there are none", () => {
		const the_lineage = what_the_lineage_says(a_project_that_names_none);
		assert.deepEqual(the_lineage.the_edges, []);
		assert.match(
			the_lineage.why_not,
			/SOURCES\.lock|licence/,
			"a project with no recorded lineage has no reason given. The absence is a fact worth " +
				"printing — three of the four projects name no other, and a page that said 'unknown' " +
				"would be saying something false about a file that simply is not there.",
		);
		assert.match(
			the_lineage.why_not,
			/ai-sdlc-os-plus/,
			"the reason does not name the project it is about, so a reader holding it does not know " +
				"which of the four it belongs to.",
		);
	});

	it("does not invent an edge out of the words sibling project", () => {
		const from_prose = what_the_lineage_says({
			owner: "steamnoid",
			name: "a-project",
			the_text_of_a_sources_lock: null,
			the_text_of_its_licence: null,
			the_prose_that_mentions_a_sibling: "The sibling project was built by eleven delegated workers.",
		});
		assert.equal(
			from_prose.the_edges.length,
			0,
			"an edge was drawn out of prose that says 'the sibling project' and does not say which. A " +
				"lineage graph a reader cannot check is the thing this page exists not to draw.",
		);
		assert.match(
			from_prose.why_not,
			/does not name|sibling/i,
			"the reason does not say that the prose names a sibling without naming it — which is the " +
				"single most interesting thing about three of these four projects.",
		);
	});
});

describe("a project this page was told nothing about", () => {
	it("is not read at all, rather than being read as one with no lineage", () => {
		assert.equal(what_the_lineage_says(undefined).verdict, "not read");
		assert.equal(what_the_lineage_says(null).verdict, "not read");
	});
});
