/** Run one project's own suite, and report what it said.
 *
 * **The command comes from the project, not from here.** Four projects in two languages
 * run four different commands, and two of them run the same runner with different
 * arguments. A collector that hard-coded one of them would report the other three as
 * projects with no suite, which is a fact about the collector and not about the projects
 * — so each project's command is read out of the document that states it, and the command
 * is stored beside the verdict, because a verdict is about an invocation and a reader
 * cannot check one they cannot see.
 *
 * **A suite is green when it exited zero, and not when it passed a lot.** A run that
 * printed `1 failed, 449 passed` is a run that failed. A run that was never asked to run
 * is a third thing, and it says which flag would run it.
 *
 * **A project with no command this reader can find is refused by name**, and it is not
 * `not run` — it is a project whose suite this page could not find, which is a different
 * sentence and a more useful one.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** The commands the family runs, and the language each belongs to. */
const THE_COMMANDS_THIS_READER_KNOWS = [
	{ language: "python", the_command: ["uv", "run", "pytest", "-q"], is_it_run_in_a_virtual_environment: true },
	{ language: "rust", the_command: ["cargo", "test", "--no-fail-fast"] },
];

/** Where each runner puts its summary, and the word it puts there. */
const WHERE_A_RUNNER_SUMMARISES = {
	python: { the_line_is_the_last_one: true, says: null },
	// **Cargo ends on `Doc-tests aisdlc_gates` and no numbers at all.** It prints one
	// `test result:` line per test binary, so the summary is the last line that says so
	// rather than the last line — and a reader that took the last line reported no counts
	// for either Rust project in the family, and reported one of them green with nothing
	// beside the word.
	rust: { the_line_is_the_last_one: false, says: "test result:" },
};

/**
 * The lines a runner put its counts on.
 *
 * **A `pytest` run has one; a `cargo` run has one per test binary.** Cargo's last of them
 * is the doc-tests, which ran nothing, so a reader taking the last one reported `0 passed`
 * beside a green suite on a project that has 132 tests. The lines are therefore returned
 * whole and added up, and how many there were is carried in the answer so a reader knows
 * what the figure is a sum of.
 */
function the_lines_the_counts_are_on(what_the_runner_printed, a_language) {
	const where = WHERE_A_RUNNER_SUMMARISES[a_language];
	if (where === undefined) {
		return [];
	}
	const the_lines = what_the_runner_printed.trim().split("\n").filter((a_line) => a_line.trim().length > 0);
	if (where.the_line_is_the_last_one) {
		return the_lines.length === 0 ? [] : [the_lines[the_lines.length - 1]];
	}
	return the_lines.filter((a_line) => a_line.includes(where.says));
}

/**
 * The counts a runner printed, and `null` for any it did not print.
 *
 * **Absent is `null` and not zero.** A runner that printed no count did not pass zero
 * tests; it printed something this reader did not recognise, and a page reporting 0 beside
 * a green suite is a page reporting a suite that does not exist. A compile failure is the
 * clearest case: nothing ran at all, and a number beside it would describe a suite nobody
 * had.
 */
export function the_counts_in(what_the_runner_printed, a_language) {
	const the_lines = the_lines_the_counts_are_on(what_the_runner_printed, a_language);
	if (the_lines.length === 0) {
		return {
			passed: null,
			failed: null,
			skipped: null,
			deselected: null,
			ignored: null,
			how_many_binaries: 0,
		};
	}
	/** The sum over every line, or `null` when no line printed it at all. */
	const a_total_of = (what_it_says) => {
		const every_count = the_lines
			.map((a_line) => new RegExp(`(\\d+)\\s+${what_it_says}`).exec(a_line))
			.filter((a_found) => a_found !== null)
			.map((a_found) => Number(a_found[1]));
		return every_count.length === 0 ? null : every_count.reduce((a_total, a_count) => a_total + a_count, 0);
	};
	return {
		passed: a_total_of("passed"),
		failed: a_total_of("failed"),
		skipped: a_total_of("skipped"),
		deselected: a_total_of("deselected"),
		ignored: a_total_of("ignored"),
		how_many_binaries: the_lines.length,
	};
}

/** The command for a project, or the reason there is none this reader knows.
 *
 * **A project may declare its own command, and that is a seam rather than a convenience.**
 * The family's two Python projects both run `uv run pytest -q` and its two Rust projects both run
 * `cargo test --no-fail-fast`, so a command per language is right for all four — and it is also the
 * only way to run this function against anything a test can produce, since a test cannot invoke
 * `cargo`. A default that cannot be replaced is not a default, it is a constant.
 */
export function the_command_for(a_project) {
	if (Array.isArray(a_project.the_command_to_run)) {
		return { the_command: a_project.the_command_to_run, why_not: null };
	}
	const the_one = THE_COMMANDS_THIS_READER_KNOWS.find((a_runner) => a_runner.language === a_project.language);
	if (the_one === undefined) {
		return {
			the_command: null,
			why_not:
				`no runner is declared for a project written in ${a_project.language}, so this page ` +
				`cannot say anything about ${a_project.name}'s suite. The runners this page knows are ` +
				`${THE_COMMANDS_THIS_READER_KNOWS.map((a_runner) => a_runner.language).join(" and ")}.`,
		};
	}
	return {
		the_command: the_one.the_command,
		why_not: null,
		is_it_run_in_a_virtual_environment: the_one.is_it_run_in_a_virtual_environment === true,
	};
}

/** The suite of one project, run or not run, and the reason either way. */
export function read_the_suite(a_project, at, was_it_asked_to_run) {
	const the_command = the_command_for(a_project);
	if (the_command.the_command === null) {
		return { was_run: false, why_not: the_command.why_not };
	}
	if (was_it_asked_to_run !== true) {
		return {
			was_run: false,
			why_not:
				`the suite was not asked to run for this project, and the command that would run it is ` +
				`\`${the_command.the_command.join(" ")}\`. Pass --run-the-suites and this page will report ` +
				"what it says.",
		};
	}

	// A Python project's dependencies live in its own virtual environment, and the system
	// interpreter cannot import a project's own domain — so the run happens where the project
	// says it happens rather than wherever this page happens to be able to find pytest.
	const where = a_project.language === "python" && existsSync(join(at, ".venv")) ? join(at, ".venv", "bin") : undefined;
	const the_run = spawnSync(the_command.the_command[0], the_command.the_command.slice(1), {
		cwd: at,
		encoding: "utf8",
		env: { ...process.env, ...(where ? { PATH: `${where}:${process.env.PATH}` } : {}) },
		timeout: 20 * 60 * 1000,
	});

	const what_it_printed = `${the_run.stdout ?? ""}${the_run.stderr ?? ""}`;
	const the_it_ran_out_of_time = the_run.error?.code === "ETIMEDOUT";
	const the_counts = the_counts_in(what_it_printed, a_project.language);

	return {
		was_run: true,
		is_green: the_run.status === 0,
		exit_code: the_run.status,
		...the_counts,
		why_not: the_it_ran_out_of_time
			? "the suite ran for twenty minutes and was stopped, so nothing is known about whether it passes"
			: `the suite exited ${the_run.status}, and only an exit code of 0 is green: ${what_the_counts_say(the_counts)}`,
		what_it_printed,
		what_was_run: the_command.the_command.join(" "),
	};
}

/**
 * The sentence a reader reads, said in counts rather than in quoted output.
 *
 * **Two things were wrong with it and both were found by running the real family.** It pasted
 * every `test result:` line a `cargo` run printed — around sixty of them, which is fifteen
 * thousand characters on a card that has room for a sentence — and it carried the duration
 * `pytest` ends its last line with, so the sentence differed on every run, every state differed
 * from the last, `has_changed` was always true, and a page that rebuilds itself republished
 * itself every time. That is the whole cost the skip exists to avoid, paid for a fact about how
 * long a suite took rather than about the family.
 *
 * **Counts and a binary count, and nothing else.** "540 passed, 0 failed across 61 binaries" is
 * checkable against the run; sixty quoted lines are not, because a reader cannot hold them.
 */
function what_the_counts_say(the_counts) {
	if (the_counts.passed === null) {
		return "the suite printed no counts, so nothing is known about how far it got";
	}
	const how_many_binaries =
		the_counts.how_many_binaries > 1 ? ` across ${the_counts.how_many_binaries} binaries` : "";
	const the_failures = the_counts.failed > 0 ? `, ${the_counts.failed} failed` : "";
	return `${the_counts.passed} passed${the_failures}${how_many_binaries}`;
}
