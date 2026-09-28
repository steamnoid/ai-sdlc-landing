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
});
