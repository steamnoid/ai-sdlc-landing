/** The decision and the commit, in one place, because the workflow is not one.
 *
 * **A shell line in a workflow is a script in `scripts/`.** `AGENTS.md` records the rule after an
 * `awk` one-liner calling `mktime` with seven arguments where gawk takes six failed on the first
 * scheduled run that reached it. The calculation was moved out; the decision, the identity, the
 * commit and the push were left behind, and the whole of them had never been run by anything.
 *
 * **Two defects were already sitting in those four lines and the first fix found one of them.** The
 * `awk` was corrected and the job was given credit for working; it was still granted
 * `contents: read` and could not have pushed the commit it existed to push. A rescue mechanism
 * that has never been rescued, found by running the thing rather than by reading it.
 *
 *     node scripts/keep_the_schedule_alive.mjs            # the checkout this is run in
 *     node scripts/keep_the_schedule_alive.mjs <where>    # any checkout, for a test
 *
 * **It pushes rather than commits, and that is the whole of what it is for.** GitHub decides
 * whether to switch a schedule off by looking at the repository, not at the runner, so an empty
 * commit that stays in the checkout is not activity and keeps nothing alive.
 */

import { spawnSync } from "node:child_process";

import { how_many_days_since_the_last_commit } from "./how_many_days_since_the_last_commit.mjs";

/** After this many quiet days GitHub may switch a schedule off, so a commit is owed before that. */
export const THE_LIMIT = 45;

/** A commit on a schedule is made by the schedule, and a record naming somebody else is a forgery. */
const THE_BOT = {
	the_name: "github-actions[bot]",
	the_address: "41898282+github-actions[bot]@users.noreply.github.com",
};

/** What the keepalive says when it does commit, and the reason a reader looks for it in the log. */
const THE_REASON = "the schedule kept itself alive";

/**
 * Whether a repository silent for this many days is owed a commit.
 *
 * **Forty-five and not sixty, because the sixty is not a deadline this controls.** GitHub switches
 * scheduled workflows off in a public repository after sixty days without activity, and the switch
 * is a message to an owner who may not read it. Committing before that is the only part of it that
 * is in this repository's hands.
 */
export function the_silence_is_long_enough(how_many, the_limit = THE_LIMIT) {
	return how_many >= the_limit;
}

/**
 * What the schedule did to a checkout: whether a commit was pushed, what it said, and why not.
 *
 * **A refusal and not a zero, and not a quiet success.** A checkout whose history cannot be read
 * might be a repository about to go dark, which is the one case where a wrong answer is costly, so
 * it says which directory it could not read and pushes nothing.
 */
export function keep_the_schedule_alive({ at = process.cwd(), the_limit = THE_LIMIT } = {}) {
	// **A number or a refusal, and never a guess.** The limit arrives from a person typing into a
	// dispatch, and a limit that is not a number has no answer: comparing the silence against it
	// says `NaN >= anything` is false, which would be a keepalive that quietly does nothing after
	// somebody typed the wrong thing into a field to make it do something.
	if (Number.isNaN(the_limit)) {
		return a_failure(`the schedule pushed nothing: ${the_limit} is not a number of days`);
	}

	const the_silence = how_many_days_since_the_last_commit(at);
	if (!the_silence.was_counted) {
		return a_failure(`the schedule pushed nothing: ${the_silence.why_not}`, the_silence.why_not);
	}

	if (!the_silence_is_long_enough(the_silence.how_many, the_limit)) {
		return a_silence_that_is_not_long_enough_yet(the_silence.how_many, the_limit);
	}

	for (const a_command of THE_COMMANDS_THAT_MAKE_THE_COMMIT) {
		const why_it_failed = why_this_git_command_failed(a_command, at);
		if (why_it_failed !== null) {
			return a_failure(`the schedule pushed nothing: ${why_it_failed}`);
		}
	}

	const why_the_push_failed = why_this_git_command_failed(["push", "origin", "HEAD"], at);
	if (why_the_push_failed !== null) {
		return a_failure(
			`the last commit was ${the_silence.how_many} days ago and a commit was made, but the push ` +
				`failed: ${why_the_push_failed}`,
			`${the_silence.how_many} days is past the limit and the commit did not arrive: ${why_the_push_failed}`,
		);
	}

	return {
		a_commit_was_pushed: true,
		what_it_said:
			`the last commit was ${the_silence.how_many} days ago, the limit is ${the_limit}, and an empty ` +
			`commit was pushed because ${THE_REASON}`,
		why_not: null,
	};
}

/**
 * A repository that was committed to recently, which is a keepalive with nothing to do.
 *
 * **`why_not` is null here, and that is the whole of the distinction.** There is no reason and no
 * failure: the schedule checked, the silence was short, and the schedule acted correctly by doing
 * nothing. A run that reported this as a failure would go red on nearly every run, and a red run
 * nobody can act on is worse than a green run that lies.
 */
function a_silence_that_is_not_long_enough_yet(how_many, the_limit) {
	return {
		a_commit_was_pushed: false,
		what_it_said:
			`the last commit was ${how_many} days ago and the limit is ${the_limit}, ` +
			"so the schedule pushed nothing",
		why_not: null,
	};
}

/** Something the schedule had to do and could not, said twice: for the log, and for the caller. */
function a_failure(what_it_said, why_not = what_it_said) {
	return { a_commit_was_pushed: false, what_it_said, why_not };
}

/** The commands that make the commit, in the order git needs them: an identity, then the commit. */
const THE_COMMANDS_THAT_MAKE_THE_COMMIT = [
	["config", "user.name", THE_BOT.the_name],
	["config", "user.email", THE_BOT.the_address],
	["commit", "--allow-empty", "-m", THE_REASON],
];

/**
 * Why one git command refused, or `null` when it did what it was told.
 *
 * **A refusal and not an exception, because the caller has two of them and a third.** The commit
 * can fail and the push can fail, and the push failing is the interesting one: the commit exists in
 * the checkout and the repository is still dark, which is the single situation in which a keepalive
 * is silently useless. Throwing would report it the same way it reports a checkout it cannot read.
 */
function why_this_git_command_failed(the_arguments, at) {
	const the_answer = spawnSync("git", the_arguments, { cwd: at, encoding: "utf8" });
	if (the_answer.status === 0) {
		return null;
	}
	return the_answer.stderr.trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
	// **A number, and not a flag.** The workflow asks for a number of days rather than telling
	// the script whether to believe itself, so the age the script prints and the age it acts on are
	// the same question answered once. An operator asking for this to run now says zero, which is
	// not a claim about the repository and says so in the log beside the real number of days.
	const what_happened = keep_the_schedule_alive({
		...(process.argv[2] === undefined ? {} : { at: process.argv[2] }),
		...(process.env.THE_LIMIT === undefined ? {} : { the_limit: Number(process.env.THE_LIMIT) }),
	});
	process.stdout.write(`${what_happened.what_it_said}\n`);
	if (what_happened.why_not !== null) {
		process.stderr.write(`${what_happened.why_not}\n`);
		process.exitCode = 1;
	}
}
