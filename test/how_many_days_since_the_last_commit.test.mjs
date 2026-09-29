/** How many days ago a commit was, counted by the script a scheduled run will call.
 *
 * **A rescue mechanism that has never been run is a mechanism that does not work.** The
 * first version of this was an `awk` one-liner inside the workflow's own YAML: it called
 * `mktime` with seven arguments where gawk takes six, and the arithmetic failed on the
 * first scheduled run that reached it, with `6 is invalid as number of arguments for
 * mktime` in the log. It had been in the file since the repository was pushed and had
 * never been executed by anything, because a workflow only runs when a project moves.
 *
 * **Which is the whole argument for putting it in a script.** A command inside a workflow
 * file is not tested by a green run; it is tested by the day it is needed, which for a
 * keepalive is the day after sixty days of nothing having happened. This file is run on
 * every pass, and it was red before the workflow ever reached it.
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const the_script = join(here, "..", "scripts", "how_many_days_since_the_last_commit.mjs");

/** Ask the script how many days ago a date was, and hand back what it answered. */
function the_days_since(a_date) {
	const the_answer = spawnSync("node", [the_script, a_date], { encoding: "utf8" });
	return { status: the_answer.status, days: the_answer.stdout.trim(), stderr: the_answer.stderr };
}

/** A date at noon UTC, so a day boundary cannot make a count off by one. */
const days_ago = (a_number_of_days) => {
	const a_day = 24 * 60 * 60 * 1000;
	return new Date(Date.now() - a_number_of_days * a_day).toISOString().replace(/\.\d+Z$/, "Z");
};

describe("the script a scheduled run will call", () => {
	it("counts a commit made today as zero days", () => {
		const the_answer = the_days_since(days_ago(0));
		assert.equal(the_answer.status, 0, `the script refused, and said:\n${the_answer.stderr}`);
		assert.equal(the_answer.days, "0");
	});

	it("counts a commit made yesterday as one day", () => {
		assert.equal(the_days_since(days_ago(1)).days, "1");
	});

	it("counts forty-four days as forty-four, which is the boundary the workflow acts on", () => {
		// **Forty-four and forty-five are the two numbers this script exists to tell apart.** The
		// workflow pushes a commit at forty-five so that the sixty-day limit is never reached, and a
		// script that counted forty-four as forty-five would push a month early and one that counted
		// forty-five as forty-four would push a week late.
		assert.equal(the_days_since(days_ago(44)).days, "44");
		assert.equal(the_days_since(days_ago(45)).days, "45");
	});

	it("reads the last commit of this checkout when given no date at all", () => {
		const the_answer = spawnSync("node", [the_script], { encoding: "utf8" });
		assert.equal(the_answer.status, 0, `the script refused, and said:\n${the_answer.stderr}`);
		const how_many = Number(the_answer.stdout.trim());
		assert.ok(
			Number.isInteger(how_many) && how_many >= 0 && how_many < 2,
			`the script answered ${the_answer.stdout.trim()} days for this repository, whose last commit ` +
				"is minutes old. A number that is not a whole count of days is the failure this script had.",
		);
	});

	it("refuses a date it cannot read, rather than answering with a number", () => {
		const the_answer = the_days_since("not a date at all");
		assert.notEqual(
			the_answer.status,
			0,
			"the script answered for a date it could not read. A keepalive that counts days from " +
				"something unparseable pushes a commit whenever it is asked, and one that prints zero " +
				"never does — so both are wrong and both are silent.",
		);
		assert.equal(the_answer.days, "", "a refusal still printed a number");
	});

	it("answers a whole number and nothing else, for the workflow to compare with -ge", () => {
		for (const a_number_of_days of [0, 1, 45, 90]) {
			assert.match(
				the_days_since(days_ago(a_number_of_days)).days,
				/^\d+$/,
				`the script answered something that is not a whole count of days, and the workflow ` +
					"compares it with -ge. A number with a newline in it, a negative sign or a decimal " +
					"point makes that comparison fail in a way whose message says nothing about it.",
			);
		}
	});
});
