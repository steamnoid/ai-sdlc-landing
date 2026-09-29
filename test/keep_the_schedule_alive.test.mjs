/** The keepalive is a script, and the proof is that a commit appeared in a checkout.
 *
 * **The workflow had four lines of shell in it, and the repository's own rule says where those
 * belong.** `AGENTS.md` records it — "a shell line in a workflow is a script in `scripts/`" —
 * after an `awk` one-liner calling `mktime` with seven arguments where gawk takes six failed on
 * the first scheduled run that reached it. The calculation was moved out. The *decision* was not:
 * `if [ "$days_since" -ge 45 ]`, two `git config` lines, `git commit --allow-empty` and `git push`
 * stayed in the YAML, and the whole of them had never been executed by anything.
 *
 * **Two defects were already sitting in those four lines, and the first fix found one of them.**
 * The `awk` was fixed and the job was given credit for working; it was still granted
 * `contents: read` and could not have pushed the commit it existed to push. That is the shape of a
 * rescue mechanism that has never been rescued.
 *
 * So this is a script, and a test builds a checkout, ages its last commit, and looks for a new
 * one. It is the first time this repository has been able to observe the keepalive at all: the
 * branch is unreachable for forty-five days, which in practice means the day a repository most
 * needs it is the first day anybody sees it.
 *
 * **A test ages the commit rather than the script being told what day it is.** A parameter that
 * exists only so a test can pass is a second answer the code can give, and the one that has never
 * been run is the one the workflow uses.
 */

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";

import { keep_the_schedule_alive, the_silence_is_long_enough } from "../scripts/keep_the_schedule_alive.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** The number of days after which GitHub may disable a schedule, and the one before it. */
const THE_LIMIT = 45;

let a_checkout;
let a_remote;

beforeEach(() => {
	a_checkout = mkdtempSync(join(tmpdir(), "a-schedule-"));
	a_remote = mkdtempSync(join(tmpdir(), "a-remote-"));
	run_git(["init", "--quiet", "--initial-branch=main"]);
	run_git(["config", "user.name", "somebody"]);
	run_git(["config", "user.email", "somebody@example.com"]);
	run_git_bare(["init", "--quiet", "--bare"], a_remote);
	run_git(["remote", "add", "origin", a_remote]);
});

afterEach(() => {
	rmSync(a_checkout, { recursive: true, force: true });
	rmSync(a_remote, { recursive: true, force: true });
});

describe("the silence, and the number at which a commit is owed", () => {
	it("owes nothing at forty-four days and a commit at forty-five", () => {
		assert.equal(
			the_silence_is_long_enough(44),
			false,
			"a commit one day early is a commit a month a year, and forty-four is the day before the one the workflow acts on",
		);
		assert.equal(
			the_silence_is_long_enough(45),
			true,
			"the number the keepalive acts on was reached and nothing happened",
		);
	});

	it("owes a commit the longer the silence runs, and never un-owes it", () => {
		assert.equal(the_silence_is_long_enough(0), false, "a repository committed to a minute ago");
		assert.equal(the_silence_is_long_enough(THE_LIMIT + 400), true, "past the limit, and still owed");
	});
});

describe("a checkout, and what the schedule did to it", () => {
	it("pushes nothing while the silence is shorter than the limit", () => {
		the_repository_goes_silent(10);

		const what_happened = keep_the_schedule_alive({ at: a_checkout });

		assert.equal(what_happened.a_commit_was_pushed, false, "it pushed a commit on a repository that is not silent");
		assert.equal(
			how_many_commits(),
			1,
			"a keepalive that commits on every run is two hundred commits a year, and the limit is the whole of what stops it",
		);
	});

	it("pushes one empty commit when the silence reaches the limit", () => {
		the_repository_goes_silent(45);

		const what_happened = keep_the_schedule_alive({ at: a_checkout });

		assert.equal(what_happened.a_commit_was_pushed, true, "the silence is long enough and nothing was pushed");
		assert.equal(how_many_commits(), 2, "the schedule pushed no commit, so GitHub may still disable it");
	});

	it("pushes it to the remote, because GitHub watches the repository and not the runner", () => {
		the_repository_goes_silent(60);

		keep_the_schedule_alive({ at: a_checkout });

		assert.equal(
			what_the_remote_is_at(),
			what_the_checkout_is_at(),
			"the commit exists only in the runner. GitHub disables a schedule after sixty quiet days of the " +
				"repository, so a commit that never arrives is not activity and the keepalive kept nothing alive.",
		);
	});

	it("pushes a commit that changes nothing, because the repository is not what is wrong", () => {
		the_repository_goes_silent(60);

		keep_the_schedule_alive({ at: a_checkout });

		assert.deepEqual(
			what_the_last_commit_touched(),
			[],
			"the keepalive commit is supposed to be empty. A commit that changed a file is a change nobody " +
				"reviewed, made to a page that publishes what four other repositories say.",
		);
	});

	it("is the bot, because an empty commit with somebody else's name is a forgery", () => {
		the_repository_goes_silent(60);

		keep_the_schedule_alive({ at: a_checkout });

		assert.match(
			who_made_the_last_commit(),
			/^github-actions\[bot\] <41898282\+github-actions\[bot\]@users\.noreply\.github\.com>$/,
			"the commit is not attributed to the bot. A commit made on a schedule is made by the schedule, and " +
				"a record naming somebody else is a false record rather than a shorter one.",
		);
	});

	it("says in its own words that the silence is the reason, and not only how old it is", () => {
		the_repository_goes_silent(60);

		const what_happened = keep_the_schedule_alive({ at: a_checkout });

		assert.match(what_happened.what_it_said, /60 days/, "the log no longer says how silent the repository has been");
		assert.match(
			what_happened.what_it_said,
			/pushed/,
			"the log does not say that a commit was pushed. A log saying only how old the last commit is reads " +
				"the same whether the rescue worked and whether it did not.",
		);
	});

	it("says what it did when it did nothing, because silence is also an answer", () => {
		the_repository_goes_silent(10);

		const what_happened = keep_the_schedule_alive({ at: a_checkout });

		assert.match(what_happened.what_it_said, /10 days/, "the log does not say how old the last commit is");
		assert.match(what_happened.what_it_said, /pushed nothing/, "a log that never says what it did is not a record");
	});

	it("refuses a directory that is not a checkout, rather than pushing into it", () => {
		const not_a_checkout = mkdtempSync(join(tmpdir(), "not-a-checkout-"));
		try {
			const what_happened = keep_the_schedule_alive({ at: not_a_checkout });

			assert.equal(what_happened.a_commit_was_pushed, false, "it claimed a push it did not make");
			assert.match(what_happened.why_not, /not a checkout/, "the refusal does not say what was wrong with the directory");
		} finally {
			rmSync(not_a_checkout, { recursive: true, force: true });
		}
	});
});

/** The committer date is the one `git log --format=%cI` reads, and it is what silence is counted from. */
function a_date_how_many_days_ago(how_many_days_ago) {
	return new Date(Date.now() - how_many_days_ago * 86_400_000).toISOString();
}

/**
 * Make the repository silent, which is the state the keepalive exists to survive.
 *
 * **The first commit is pushed, because that is what silence is here.** GitHub watches the
 * repository rather than the runner, so a commit made in the checkout and never pushed is the
 * one thing a keepalive may not do. The history is also pushed already-aged rather than aged
 * afterwards: amending a commit that is on the remote rewrites it, and a keepalive that had to
 * force to push would be a keepalive that could destroy a branch.
 */
function the_repository_goes_silent(how_many_days_ago) {
	const when = a_date_how_many_days_ago(how_many_days_ago);
	git_with_a_date(["commit", "--quiet", "--allow-empty", "-m", "the first commit, from somebody else"], when);
	run_git(["push", "--quiet", "origin", "main"]);
}

/** Run git in the checkout, pretending the commit happened on the day silence began. */
function git_with_a_date(the_arguments, when) {
	const the_answer = spawnSync("git", the_arguments, {
		cwd: a_checkout,
		encoding: "utf8",
		env: { ...process.env, GIT_COMMITTER_DATE: when },
	});
	assert.equal(the_answer.status, 0, `git ${the_arguments.join(" ")} failed: ${the_answer.stderr}`);
}

function run_git_bare(the_arguments, at) {
	const the_answer = spawnSync("git", the_arguments, { cwd: at, encoding: "utf8" });
	assert.equal(the_answer.status, 0, `git ${the_arguments.join(" ")} failed in the remote: ${the_answer.stderr}`);
	return the_answer;
}

function run_git(the_arguments) {
	const the_answer = spawnSync("git", the_arguments, { cwd: a_checkout, encoding: "utf8" });
	assert.equal(the_answer.status, 0, `git ${the_arguments.join(" ")} failed: ${the_answer.stderr}`);
	return the_answer;
}

function how_many_commits() {
	return Number(run_git(["rev-list", "--count", "HEAD"]).stdout.trim());
}

function what_the_last_commit_touched() {
	return run_git(["show", "--name-only", "--format=", "HEAD"]).stdout
		.split("\n")
		.map((a_line) => a_line.trim())
		.filter(Boolean);
}

function what_the_checkout_is_at() {
	return run_git(["rev-parse", "HEAD"]).stdout.trim();
}

function what_the_remote_is_at() {
	return run_git_bare(["rev-parse", "main"], a_remote).stdout.trim();
}

function who_made_the_last_commit() {
	return run_git(["log", "-1", "--format=%an <%ae>"]).stdout.trim();
}

describe("the command the workflow runs, and what it tells the runner", () => {
	// **A keepalive with nothing to do has succeeded, and the first version of this script said
	// otherwise.** It exited 1 whenever it pushed nothing, and the case it was describing is a
	// repository that was committed to last week — which is the state of nearly every repository on
	// nearly every run. The job would have gone red on the first scheduled run and the log would
	// have named a failure that is a keepalive working exactly as intended.
	//
	// **The command is what is run here, not the function.** The workflow calls this and nothing
	// else, and an exit code is the only thing a shell can read: the sentence it printed is a log
	// line and the code is the verdict.
	it("succeeds when the silence is shorter than the limit, and says it pushed nothing", () => {
		the_repository_goes_silent(10);

		const the_answer = run_the_command();

		assert.equal(
			the_answer.status,
			0,
			`a keepalive with nothing to do exited ${the_answer.status}. GitHub disables a schedule after ` +
				"sixty quiet days and this repository is not quiet, so a red run here reports a rescue " +
				"mechanism working, and trains whoever reads it to ignore it.",
		);
		assert.match(the_answer.stdout, /pushed nothing/, "the run says nothing about what it did");
	});

	it("succeeds when it pushed, because that is the outcome the job exists for", () => {
		the_repository_goes_silent(60);

		const the_answer = run_the_command();

		assert.equal(the_answer.status, 0, "the keepalive pushed its commit and reported a failure");
		assert.match(the_answer.stdout, /pushed/, "the run does not say that it pushed");
	});

	it("fails, and says why, when it owed a commit and the push did not arrive", () => {
		the_repository_goes_silent(60);
		run_git(["remote", "set-url", "origin", join(a_remote, "not-a-checkout")]);

		const the_answer = run_the_command();

		assert.notEqual(the_answer.status, 0, "the push failed and the run reported nothing");
		assert.match(
			the_answer.stderr,
			/did not arrive/,
			"the failure does not say that the commit was made and did not arrive, which is the one " +
				"situation in which a keepalive looks like it worked",
		);
	});
});

/** The command exactly as the workflow spells it. */
function run_the_command() {
	return spawnSync(process.execPath, [join(here, "..", "scripts", "keep_the_schedule_alive.mjs")], {
		cwd: a_checkout,
		encoding: "utf8",
	});
}

describe("an operator who says the silence is long enough", () => {
	// **A limit and not a flag**, so the age the script prints and the age it acts on are the same
	// question. The workflow passes zero; a flag would have left the script printing "the limit is
	// 45" beside a commit it pushed because of something else entirely, which is a log that cannot
	// be believed when it is the only evidence there is.
	it("acts on the number it is given rather than the one it holds", () => {
		the_repository_goes_silent(3);

		const what_happened = keep_the_schedule_alive({ at: a_checkout, the_limit: 0 });

		assert.equal(
			what_happened.a_commit_was_pushed,
			true,
			"the limit was given as zero and nothing was pushed, so the workflow's input does not reach " +
				"the code that acts on it",
		);
		assert.match(what_happened.what_it_said, /the limit is 0/, "the log does not say which limit it acted on");
	});

	it("still says how many days it really has been, so a forced run is not a scheduled one", () => {
		the_repository_goes_silent(3);

		const what_happened = keep_the_schedule_alive({ at: a_checkout, the_limit: 0 });

		assert.match(
			what_happened.what_it_said,
			/3 days ago/,
			"the run pushed a commit and did not say how quiet the repository actually is, so a reader of " +
				"the log cannot tell a run an operator forced from one the schedule asked for",
		);
	});

	it("pushes nothing when the limit is the one it holds, which is what a dispatch that asks for nothing does", () => {
		the_repository_goes_silent(3);

		const what_happened = keep_the_schedule_alive({ at: a_checkout });

		assert.equal(
			what_happened.a_commit_was_pushed,
			false,
			"three days is not forty-five and a commit was pushed, so the default is no longer the default",
		);
	});
});

describe("a limit that is not a number", () => {
	// **An operator typing into a dispatch is the only source of a limit that can be a word.** A
	// comparison against `NaN` is false for every number, so a bad limit is a keepalive that does
	// nothing and says nothing — the one outcome that looks identical to a working one.
	it("refuses it by name, rather than comparing the silence against nothing", () => {
		const what_happened = keep_the_schedule_alive({ at: a_checkout, the_limit: Number("forty five") });

		assert.equal(what_happened.a_commit_was_pushed, false, "a limit of NaN pushed a commit");
		assert.match(what_happened.why_not, /not a number of days/, "the refusal does not say what was wrong");
	});
});

