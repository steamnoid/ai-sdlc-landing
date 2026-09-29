/** Every `needs.*.outputs.*` a job reads is a job that declares it.
 *
 * **This is the failure the workflow is built out of.** `build` is guarded by
 * `if: needs.collect.outputs.has_changed == 'true'`, and `collect` did not declare an
 * `outputs:` block at all — so the value was empty, the condition was false, and the page
 * would never have been built or deployed. Not once. Every run would have been green: the
 * `collect` job passed, `build` skipped itself, `deploy` was skipped as a dependency, and
 * the workflow reported success while producing nothing at all.
 *
 * **A step output is not a job output.** `scripts/has_anything_changed.mjs` writes
 * `has_changed` to `$GITHUB_OUTPUT` correctly and the test suite covers that, and neither
 * fact is about YAML. What carries a value from one job to the next is the `outputs:` block
 * on the job that produced it, and a JavaScript test cannot see that — so the test below
 * reads the workflow.
 *
 * **And the whole file is read for the two rules that a green run cannot catch**, because
 * both of them are a job that quietly does less than its comment says it does.
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const where_the_workflow_lives = join(here, "..", ".github", "workflows", "pages.yml");

/**
 * The workflow as a value, which is what a test about a workflow has to read.
 *
 * **Read with `python3` rather than a YAML library, and that is a rule rather than a
 * convenience.** Adding a dependency so that a thing becomes testable is what this
 * repository's own rules forbid, and this one already shells out to `python3` to read two
 * of the four projects — so this is the same seam used twice rather than a new one.
 */
function the_workflow() {
	if (!existsSync(where_the_workflow_lives)) {
		return null;
	}
	const the_reading = spawnSync(
		"python3",
		["-c", "import json,sys,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))", where_the_workflow_lives],
		{ encoding: "utf8" },
	);
	assert.equal(the_reading.status, 0, `the workflow could not be read, and said:\n${the_reading.stderr}`);
	return JSON.parse(the_reading.stdout);
}

describe("the workflow that publishes the page", () => {
	it("exists, because a workflow that is not there publishes nothing", () => {
		assert.ok(
			existsSync(where_the_workflow_lives),
			`there is no workflow at ${where_the_workflow_lives}, so the page is built by hand and is ` +
				"wrong the moment a project moves — which is the one thing this repository exists to stop.",
		);
	});

	it("declares every output another job reads from it", () => {
		const the_read_workflow = the_workflow();
		const the_jobs = the_read_workflow.jobs;
		const the_missing = [];

		for (const [a_job_name, a_job] of Object.entries(the_jobs)) {
			// **`needs` is a bare string when there is one dependency and a list when there are
			// several**, and the first version of this loop took it for a list always — so it
			// walked the seven letters of "collect" and compared each of them with a job that
			// does not exist, which is a test that passes by never finding anything.
			const what_it_needs = a_job.needs === undefined ? [] : [a_job.needs].flat();
			for (const a_needs of what_it_needs) {
				const what_it_declares = Object.keys(the_jobs[a_needs]?.outputs ?? {});
				const it_guards_on = /\bneeds\.([\w-]+)\.outputs\.([\w-]+)/.exec(a_job.if ?? "");
				if (it_guards_on === null) {
					continue;
				}
				const [, the_job_it_needs, the_output] = it_guards_on;
				if (the_job_it_needs !== a_needs) {
					continue;
				}
				if (!what_it_declares.includes(the_output)) {
					the_missing.push(
						`${a_job_name} guards on needs.${a_needs}.outputs.${the_output}, and ${a_needs} declares [${what_it_declares.join(", ")}]`,
					);
				}
			}
		}

		assert.deepEqual(
			the_missing,
			[],
			`a job reads an output another job never declared: ${the_missing.join("; ")}. The value is ` +
				"empty, the condition is false, and the job that would have been skipped reports success — " +
				"so the page is never built and every run is green. A step writing to $GITHUB_OUTPUT is " +
				"not enough; the producing job has to pass it on.",
		);
	});

	it("gives the step that writes an output the id the job refers to", () => {
		const the_read_workflow = the_workflow();
		const the_collect = the_read_workflow.jobs.collect;
		const what_the_job_passes_on = Object.values(the_collect.outputs ?? {})[0] ?? "";
		const the_step_it_names = /steps\.([\w-]+)\./.exec(what_the_job_passes_on)?.[1] ?? null;

		assert.ok(
			the_step_it_names !== null,
			`the job passes on [${what_the_job_passes_on}], which names no step. An output that comes ` +
				"from nowhere is an output that is empty.",
		);
		assert.ok(
			the_collect.steps.some((a_step) => a_step.id === the_step_it_names),
			`the job passes on the output of step "${the_step_it_names}" and no step in it has that id.`,
		);
	});

	it("reads the four projects, and a run that reads three is not a run that published a page", () => {
		const the_read_workflow = the_workflow();
		const the_collect = the_read_workflow.jobs.collect;
		const what_it_asks_for = the_collect.steps
			.filter((a_step) => a_step.name?.includes("Check out the four"))
			.flatMap((a_step) => String(a_step.run).split("\n"))
			.filter((a_line) => a_line.includes("git clone"));

		assert.equal(
			what_it_asks_for.length,
			1,
			"the step that checks the four projects does not say so once. The projects are named in the " +
				"workflow's own environment, and a list of addresses in a `for` loop is where a project " +
				"would be forgotten without anything failing.",
		);
		assert.match(
			JSON.stringify(the_read_workflow.env ?? {}),
			/ai-sdlc-os:|ai-sdlc-os-plus|ai-sdlc-app-rs:|ai-sdlc-app-rs-plus/,
			"the workflow does not name the four projects. A page about a family that names none of it " +
				"cannot be checked against a family by a reader.",
		);
	});

	it("builds the page when a person asked for it, not only when something changed", () => {
		// **A manual dispatch is a request, and this workflow was refusing it.** `build` was guarded
		// on `has_changed == 'true'` alone, so a person who pressed *Run workflow* got `collect` green
		// and then silence — because the state was identical to the published one, which is the normal
		// state of a page that is working. The skip is right for a schedule and wrong for a person,
		// and the guard could not tell the two apart.
		const the_build = the_workflow().jobs.build;
		assert.match(
			the_build.if ?? "",
			/workflow_dispatch/,
			"the build is not reachable by a manual dispatch. A person asking for a rebuild is not the " +
				"same as nothing having changed, and a guard that cannot tell them apart refuses the " +
				"request — with a green first stage and then silence, which is the hardest shape of " +
				"failure to notice and the easiest to cause.",
		);
		assert.match(
			the_build.if ?? "",
			/has_changed/,
			"the build would then publish on every schedule regardless of whether anything changed, " +
				"which throws the skip away rather than widening it.",
		);
	});

	it("keeps the rescue job off the chain of jobs that are allowed to be skipped", () => {
		// **The rescue mechanism hung off the thing it was meant to rescue.** `keepalive` had
		// `needs: deploy`, and `deploy` needs `build`, and `build` is skipped whenever nothing changed —
		// which is exactly the situation a keepalive exists for. A page that updates hourly and is
		// therefore *always* current would never have run the job that stops GitHub disabling the
		// schedule after sixty quiet days. It entered on its first run by luck: that run happened to
		// find eleven changed facts.
		const the_jobs = the_workflow().jobs;
		const the_rescue = the_jobs.keepalive;
		assert.ok(the_rescue, "there is no job to keep the schedule alive");

		const what_it_needs = [the_rescue.needs].flat();
		assert.deepEqual(
			what_it_needs,
			["collect"],
			`the rescue job needs [${what_it_needs.join(", ")}]. Anything reachable only through \`build\` ` +
				"is reachable only when something changed, and nothing changing is the state a keepalive " +
				"exists to survive.",
		);

		for (const a_job_name of what_it_needs) {
			assert.equal(
				the_jobs[a_job_name].if ?? null,
				null,
				`the rescue job needs "${a_job_name}", and that job is itself conditional — so the ` +
					"rescue runs only when the condition happens to hold.",
			);
		}
	});

	it("runs no action on a Node version GitHub has deprecated", () => {
		// `actions/checkout@v4` targets Node 20 and GitHub forces it onto Node 24, printing a
		// deprecation warning on every run. It works today and stops working on a date nobody chose.
		//
		// **The workflow as JSON, and both quote styles are matched** — the first version of this
		// looked for a single quote after `uses:`, which JSON never produces, so it found no actions
		// at all and the loop below it had nothing to check. A test that passes because it looked for
		// the wrong thing is the same failure as the one it was written to catch.
		const the_read_workflow = the_workflow();
		const the_every_action = JSON.stringify(the_read_workflow).match(/uses\\?":\s*\\?"([^"\\]+)\\?"/g) ?? [];
		assert.ok(
			the_every_action.length > 0,
			"the workflow names no action, so this test checked nothing. A guard that finds nothing to " +
				"look at passes, which is why the count is asserted before the loop rather than after it.",
		);
		for (const a_use of the_every_action) {
			assert.match(
				a_use,
				/@v([5-9]|\d{2,})/,
				`the workflow uses ${a_use}, which targets a Node version GitHub has deprecated. The run ` +
					"still succeeds — forced onto a newer runtime than it was written for — so the " +
					"warning is easy to scroll past.",
			);
		}
	});
});
