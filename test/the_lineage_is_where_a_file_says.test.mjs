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
		const the_lineage = what_the_lineage_says(a_project_with_a_pin);
		assert.deepEqual(the_lineage.the_edges, [
			{
				points_at: "ai-sdlc-os",
				owner: "steamnoid",
				how_it_is_recorded: "a pin in SOURCES.lock",
				at_the_commit: "98fab0f",
				on_the_branch: "phase-8-analysis-pipeline",
				read_on: "2026-09-28",
				is_the_pin_still_held: null,
				why_the_pin_may_be_stale: null,
			},
			{
				points_at: "ai-sdlc-os-landing",
				owner: "steamnoid",
				how_it_is_recorded: "a design reference in SOURCES.lock",
				at_the_commit: "f44cf1",
				on_the_branch: null,
				read_on: "2026-09-27",
				is_the_pin_still_held: null,
				why_the_pin_may_be_stale: null,
			},
		]);
	});

	it("says the pin is not checked, rather than saying the pin holds", () => {
		for (const an_edge of what_the_lineage_says(a_project_with_a_pin).the_edges) {
			assert.equal(
				an_edge.is_the_pin_still_held,
				null,
				"a pin was reported as holding or not holding. This page reads one repository and " +
					"cannot re-hash a sibling's tree, so the only honest answer is that it did not check — " +
					"and 'read from this commit' is a different claim from 'still matches it'.",
			);
			assert.match(
				an_edge.why_the_pin_may_be_stale,
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
