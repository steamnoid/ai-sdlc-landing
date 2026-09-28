/** A claim a project's documents make, and what its tree says about it.
 *
 * **This is the document that cannot be allowed to go stale.** The page is a view and
 * regenerates itself hourly, but this file is written by a person and checked by a test —
 * and that arrangement is the whole of why it can exist: it can age in one direction only.
 * A claim here may be *too cautious* and the test stays green. A claim here that the tree
 * refutes turns the test red, which is the only way a hand-written document in a
 * repository of this kind is allowed to be wrong.
 *
 * **The three shapes a claim can take, and what each one is worth.**
 *
 * | the document claims | the tree holds | the claim is |
 * |---|---|---|
 * | that nothing is built | something is | **refuted** |
 * | that nothing is built | nothing is | true |
 * | that a count is N | the count is not N | **refuted** |
 *
 * **A document that names a thing is a claim about a path, and a path can be checked.** A
 * document that says "there is no production code here yet" is a claim about the tree, and
 * the tree is countable. This is the only reason such a claim is worth writing down at all
 * rather than repeating: it is checkable, so a reader who finds it false can go and prove it.
 */

import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { what_a_claim_is_worth } from "../src/page/what_a_claim_is_worth.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const at = join(here, "..");
const where_the_document_lives = join(at, "docs", "what-the-documents-claim.md");

/**
 * The claims the document makes, each with the verdict it recorded beside it.
 *
 * **A line marked `Refuted` is a finding and a line without a marker is an endorsement**, and
 * the two are judged in opposite directions — which is the whole of the arrangement. An
 * endorsed claim has to be true, and a recorded refutation has to actually be refuted, or the
 * document is making a finding about a project it has not looked at.
 */
function the_claims_in_the_document() {
	if (!existsSync(where_the_document_lives)) {
		return [];
	}
	return readFileSync(where_the_document_lives, "utf8")
		.split("\n")
		.filter((a_line) => a_line.startsWith("- `"))
		.map((a_line) => {
			const a_found = /- `([^`]+)` claims that ([^.]+)\./.exec(a_line);
			if (a_found === null) {
				return null;
			}
			return {
				what_it_claims: a_found[1],
				says: a_found[2],
				the_document_says_it_is_refuted: /\*\*Refuted\.\*\*/.test(a_line),
			};
		})
		.filter((a_claim) => a_claim !== null);
}

describe("the document that names what the family says about itself", () => {
	const the_claims = the_claims_in_the_document();

	it("exists, because a claim nobody wrote down is a claim nobody checked", () => {
		assert.ok(
			existsSync(where_the_document_lives),
			`there is no document at ${where_the_document_lives}. The page may only show facts, so ` +
				"the findings about the documents themselves have nowhere to live — and they are the most " +
				"useful thing this repository found.",
		);
	});

	it("makes claims in a shape a test can check", () => {
		assert.ok(
			the_claims.length > 0,
			"the document has no claim a test could check. Every line must begin with a project's name " +
				"in backticks and say what it claims, or nothing in it can be verified against a tree.",
		);
	});

	it("agrees with every tree it names, in both directions", () => {
		// **An endorsed claim has to be true and a recorded refutation has to be real.** A line
		// with no verdict is the document vouching for a project's own claim, and the tree has to
		// agree; a line marked `Refuted` is a finding, and the tree has to agree that too — or the
		// document is making a finding about a project nobody looked at. Understating a project
		// is the harmless direction and the document is allowed to do it; overstating one is what
		// this loop exists to catch.
		const where_the_projects_are = join(at, "..");
		const the_wrong_ones = [];
		for (const a_claim of the_claims) {
			const what_the_tree_says = what_a_claim_is_worth(a_claim.what_it_claims, a_claim.says, where_the_projects_are);
			assert.notEqual(
				what_the_tree_says,
				"the project is not on this machine",
				`the document makes a claim about ${a_claim.what_it_claims}, which is not checked out ` +
					"here. A claim this test cannot check reads exactly like a claim it has checked, and a " +
					"green run would say nothing about it.",
			);
			const what_the_document_expects = a_claim.the_document_says_it_is_refuted ? "refuted" : "true";
			if (what_the_tree_says !== what_the_document_expects) {
				the_wrong_ones.push(
					`${a_claim.what_it_claims} — the document says ${what_the_document_expects}, the tree says ${what_the_tree_says}`,
				);
			}
		}
		assert.deepEqual(
			the_wrong_ones,
			[],
			`the document disagrees with the trees it is about: ${the_wrong_ones.join("; ")}. A line with ` +
				"no verdict is the document vouching for a project's own claim, and a line marked " +
				"`Refuted` is a finding — and both have to be right, in opposite directions.",
		);
	});

	it("judges at least one claim, rather than passing on nothing", () => {
		const where_the_projects_are = join(at, "..");
		const the_judged = the_claims.filter(
			(a_claim) =>
				what_a_claim_is_worth(a_claim.what_it_claims, a_claim.says, where_the_projects_are) !== "not checked",
		);
		assert.ok(
			the_judged.length > 0,
			"every claim in the document is of a shape this reader does not judge, so the loop above " +
				"compared nothing and agreed with everything. A test that cannot fail is a test that " +
				"has not been run.",
		);
	});
});
