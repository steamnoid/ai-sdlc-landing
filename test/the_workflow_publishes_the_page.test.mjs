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
	return with_the_triggers_named_the_way_the_file_spells_them(JSON.parse(the_reading.stdout));
}

/**
 * Put the triggers back under `on`, because YAML 1.1 reads that key as the boolean true.
 *
 * **One reader in this repository, and every test goes through it.** A test that wanted the
 * triggers found nothing under `.on` and no test said why, because the file spells it `on` and
 * the answer came back as `true`. GitHub's own parser reads it as the word, so the file is
 * right and the reading is the thing that needs fixing — and fixing it once here beats fixing it
 * in every test that will ever want to know what makes this workflow run.
 */
function with_the_triggers_named_the_way_the_file_spells_them(the_workflow) {
	if (!(true in the_workflow)) {
		return the_workflow;
	}
	return { ...the_workflow, on: the_workflow[true] };
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

	it("caches the two toolchains, because a run is mostly compiling", () => {
		// **A run of this workflow is mostly waiting for Rust and for `uv`.** Measured: three and a
		// half minutes, of which the largest part is `uv sync` on two projects and `cargo test` on two
		// workspaces from cold. Neither of those is affected by anything this repository does, and both
		// are exactly what a cache is for.
		const the_steps_of_every_job = Object.values(the_workflow().jobs).flatMap((a_job) => a_job.steps ?? []);
		const what_it_uses = the_steps_of_every_job.map((a_step) => a_step.uses ?? "").filter(Boolean);

		assert.ok(
			what_it_uses.some((a_use) => a_use.startsWith("astral-sh/setup-uv")),
			"the workflow installs uv with a shell pipe and caches nothing. Two `uv sync --all-extras` " +
				"runs of a langchain and langgraph dependency tree is most of what a run waits for, and it " +
				"is the same tree every time.",
		);
		assert.ok(
			what_it_uses.some((a_use) => a_use.startsWith("Swatinem/rust-cache")),
			"the workflow compiles two Rust workspaces from cold on every run. Their `Cargo.lock` files " +
				"are what a cache keys on, so two runs of an unmoved family compile the same dependencies " +
				"twice and discard the result twice.",
		);
	});

	it("keys no cache on a commit, which would make it miss every single run", () => {
		// **A cache keyed on the commit is a cache that never hits, and it is worse than no cache**:
		// it uploads a fresh copy of every build on every run, so the cost is paid twice — once to
		// save nothing, and once in the storage quota. This is the single most common way a cache
		// gets added and turns out to do nothing, and nothing about a green run reveals it.
		const the_cache_keys = Object.values(the_workflow().jobs)
			.flatMap((a_job) => a_job.steps ?? [])
			.flatMap((a_step) => {
				const from_the_step = a_step.with?.key ? [a_step.with.key] : [];
				const from_the_environment = a_step.with?.["cache-dependency-path"]
					? [a_step.with["cache-dependency-path"]]
					: [];
				return [...from_the_step, ...from_the_environment];
			})
			.flatMap((a_key) => String(a_key).split("\n"));

		assert.ok(
			!the_cache_keys.some((a_key) => /github\.sha|GITHUB_SHA|\$\{\{\s*github\./.test(a_key)),
			`a cache is keyed on something that changes on every run: ${the_cache_keys.join(" | ")}. Every ` +
				"run would miss, re-download what it had, and upload a copy of everything it built — so the " +
				"cache would cost more than the run it was meant to shorten.",
		);
	});

	it("keys the Rust cache on the lock files, which is what actually changes", () => {
		const the_rust_cache = Object.values(the_workflow().jobs)
			.flatMap((a_job) => a_job.steps ?? [])
			.find((a_step) => a_step.uses?.startsWith("Swatinem/rust-cache"));

		assert.match(
			JSON.stringify(the_rust_cache.with ?? {}),
			/Cargo\.lock|workspaces/,
			"the Rust cache is not pointed at anything. A cache that keys on the runner's identity rather " +
				"than on what was compiled misses whenever the projects move a commit and hits when they do " +
				"not, which is backwards.",
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

	it("pins no action to a version GitHub has warned about", () => {
		// **`actions/upload-artifact@v4` is the current v4 and GitHub warns about it.** So "use v5 or
		// later" is the wrong rule and was wrong in the first version of this test: it flagged a
		// current release while the two genuinely deprecated pins it did not name sat further down
		// the file. The list is what GitHub actually printed on the 28th of September, and it is
		// copied rather than computed — a version a project has not deprecated is a fact about that
		// project and not a fact about a rule of the form "everything must be recent".
		const the_ones_github_warned_about = [
			"actions/checkout@v4",
			"actions/setup-python@v5",
			"actions/upload-artifact@v4",
			"actions/deploy-pages@v4",
		];

		const the_read_workflow = the_workflow();
		const the_every_action = JSON.stringify(the_read_workflow).match(/uses\\?":\s*\\?"([^"\\]+)\\?"/g) ?? [];
		assert.ok(
			the_every_action.length > 0,
			"the workflow names no action, so this test checked nothing. A guard that finds nothing to " +
				"look at passes, which is why the count is asserted before the loop rather than after it.",
		);

		const the_still_deprecated = the_every_action.filter((a_use) =>
			the_ones_github_warned_about.some((a_pin) => a_use.endsWith(a_pin)),
		);
		assert.deepEqual(
			the_still_deprecated,
			[],
			`the workflow still pins ${the_still_deprecated.join(", ")}. Each of these ran, and each was ` +
				"forced onto a newer Node than it was written for, which is why the run succeeded and the " +
				"warning is easy to scroll past.",
		);
	});
});

describe("every action the workflow names, and the version it names it at", () => {
	// **A pin the runner cannot resolve stops the run before a single step executes.** The first
	// version of this pinned `astral-sh/setup-uv` at `v10`, and the run failed in *Set up job* with
	// `unable to find version v10` — a red run whose log contains no step, no command and no
	// explanation beyond a name, on a workflow that had been green an hour before.
	//
	// The check is that every pin is an exact tag, because an exact tag is the only form that cannot
	// mean something different next month. It is not that exact versions are best practice, which is
	// an opinion; it is that a major floating somewhere between "exists" and "does not" is the shape
	// of thing that breaks without anybody touching this repository.
	const every_action = Object.values(the_workflow().jobs)
		.flatMap((a_job) => a_job.steps ?? [])
		.map((a_step) => a_step.uses)
		.filter(Boolean);

	it("names each one, so there is something to check", () => {
		assert.ok(every_action.length > 0, "the workflow names no action, so this test checks nothing");
	});

	it("pins each third-party action at an exact version rather than a floating major", () => {
		// **Only actions outside `actions/`.** `actions/checkout@v7` resolves — the first run with it
		// was green — and demanding an exact version of everything would be a rule about taste dressed
		// as a rule about correctness. What failed was a *third-party* action at a floating major, and
		// a third-party action is one whose tags this repository does not control.
		const the_third_party = every_action.filter((a_use) => !a_use.startsWith("actions/"));
		const the_floating = the_third_party.filter((a_use) => !/@v\d+\.\d+/.test(a_use));
		assert.deepEqual(
			the_floating,
			[],
			`the workflow pins ${the_floating.join(", ")} at a major rather than an exact version. ` +
				"A floating pin is a promise about a tag that may not exist: `astral-sh/setup-uv@v10` " +
				"failed the run in *Set up job*, before any step ran, with a message naming nothing but " +
				"the version it could not find.",
		);
	});
});

describe("a token holds what the job it belongs to needs, and nothing more", () => {
	// **The keepalive pushes a commit and was granted a token that cannot push one.** The workflow
	// says `contents: read` and the keepalive runs `git push`, so the one job whose entire purpose
	// is to push a commit could not push one. It had already failed twice, both times on an `awk`
	// that this repository fixed — and fixing the awk fixed the first of two reasons it could not
	// work, which is the shape of a change that has been given credit for a repair it did not make.
	//
	// **The other direction is the reason the workflow is shaped this way.** `Read the four
	// repositories` runs four repositories' own test suites: arbitrary code from four other people,
	// on a runner, holding this repository's token. That job must not be able to write here. The
	// build job is the same and is the one that runs `npm run build`, so it does not get it either.
	it("lets the keepalive push the empty commit that is its whole purpose", () => {
		const the_keepalive = the_job_named("Keep the schedule alive");
		assert.equal(
			the_keepalive.permissions?.contents,
			"write",
			"the keepalive runs `git push` and is granted a token that cannot push. It is the only " +
				"job whose reason to exist is a commit, and it is the one job that cannot make one.",
		);
	});

	it("does not let the job running four repositories' test suites write here", () => {
		const the_collect = the_job_named("Read the four repositories");
		assert.notEqual(
			the_collect.permissions?.contents,
			"write",
			"the job that runs four other repositories' test suites can push to this one. That is " +
				"arbitrary code from four other people holding a token that can change what the page says.",
		);
	});

	it("does not let the job that builds the page write here either", () => {
		const the_build = the_job_named("Build the page");
		assert.notEqual(
			the_build.permissions?.contents,
			"write",
			"the job that runs this repository's own build is granted a write token it never uses. " +
				"A job is granted what it needs, and a build needs to write no history to publish a page.",
		);
	});
});

/** The one job with this name, or a failure naming what was there instead. */
function the_job_named(the_name) {
	const the_jobs = the_workflow().jobs;
	const the_names = Object.keys(the_jobs);
	const the_one = the_names.filter((a_name) => the_jobs[a_name].name === the_name);
	if (the_one.length !== 1) {
		assert.fail(
			`there is no single job named "${the_name}"; the workflow has ${JSON.stringify(the_names)}. ` +
				"A test that silently found nothing has just proved nothing.",
		);
	}
	return the_jobs[the_one[0]];
}

/** The one name both the workflow and this file have to agree on, so it is written once. */
const THE_INPUT_NAME = "the_number_of_days_of_silence_that_counts_as_long_enough";

describe("the keepalive, and the one thing that can make its branch reachable", () => {
	// **The branch is forty-five days away and the schedule drops most of its hours**, so there
	// is no honest way to find out whether it works before the day a repository needs it. Between
	// 18:17 on the 28th and 11:17 on the 29th seventeen hourly slots came due and two ran — the
	// measurement is in `AGENTS.md` and it is small and stated as small.
	//
	// A dispatch that says *as though the silence were long enough* is how an operator finds out
	// in a minute what a schedule would not tell them for a month. It is an input and not a
	// change of behaviour: the schedule still decides on its own, and a dispatch that does not ask
	// still runs nothing.
	it("offers the number of days a commit is owed, rather than a yes that means nothing", () => {
		const the_inputs = the_workflow().on.workflow_dispatch?.inputs ?? {};
		assert.ok(
			THE_INPUT_NAME in the_inputs,
			`the workflow offers no way to run the keepalive on demand; its dispatch offers ${
				JSON.stringify(Object.keys(the_inputs))
			}. The branch is unreachable for forty-five days, and a rescue mechanism nobody can exercise ` +
				"is one whose first exercise is the day a repository is going dark.",
		);
		assert.equal(
			String(the_inputs[THE_INPUT_NAME].default),
			"45",
			"the input does not default to the number the schedule acts on, so a dispatch that fills in " +
				"nothing would change the meaning of a job that runs on its own.",
		);
	});

	it("runs the keepalive on a dispatch that asks, and on nothing else", () => {
		const the_keepalive = the_workflow().jobs.keepalive;
		assert.match(
			the_keepalive.if ?? "",
			new RegExp(THE_INPUT_NAME),
			"the dispatch input exists and the keepalive does not look at it, so pressing the button " +
				"changes nothing and the input is a lie told to an operator.",
		);
		assert.match(
			the_keepalive.if ?? "",
			/github\.event_name == 'schedule'/,
			"the keepalive no longer runs on the schedule. It is the only thing standing between a quiet " +
				"repository and GitHub switching the schedule off, and it is the one path that has never run.",
		);
	});

	it("hands the script what was typed, with nothing between the input and the limit", () => {
		// **The first version of this passed while the branch did not.** It ran the keepalive on
		// GitHub, the job went green, the log said "the limit is 45" and nothing was pushed — because
		// `inputs.x && 0 || 45` yields 45, since zero is the falsy half of that idiom. The test
		// checked that the input's *name* appeared in the environment and was satisfied.
		//
		// **So the environment is a name and nothing else.** A `&&` or an `||` between the input and
		// the limit is the shape of a truthiness bug, and a truthiness bug in a value that is
		// usually forty-five is invisible until someone asks for zero and the run does nothing.
		const the_step = the_workflow().jobs.keepalive.steps.find(
			(a_step) => (a_step.run ?? "").includes("keep_the_schedule_alive"),
		);
		assert.ok(the_step, "the keepalive no longer calls the script that holds the decision");
		const the_limit = String((the_step.env ?? {}).THE_LIMIT ?? "");
		assert.equal(
			the_limit,
			`\${{ inputs.${THE_INPUT_NAME} }}`,
			`the workflow builds the limit as "${the_limit}". Anything between the input and the number ` +
				"the script acts on is a place a falsy value turns into the default — and the default is " +
				"what the run did instead of what was asked for.",
		);
	});
});

