/** What the page is allowed to say, decided from the state and nowhere else.
 *
 * **This is where a claim is either earned or refused, and it is the only place.** The
 * collectors gather facts; the page prints them. Between the two sit a handful of
 * decisions that a template is the wrong place to make, because a template that says
 * "green" for anything that is not a failure is one careless ternary away from saying
 * it for a suite that was never run.
 *
 * Every function here takes one part of the state and returns the words the page may
 * use about it. A function returns a **verdict** alongside the numbers, and the verdict
 * is the part a reader acts on.
 *
 * **The one verdict this page has that the page it grew out of does not** is
 * `nothing to say`. That page serves one repository, and a run that fails to read it
 * means a site that is stale — which is bad, and is not a lie. This page serves four,
 * and a run that reads none of them must say so rather than render four empty cards:
 * an empty card claims the project has nothing to report, and every one of the four has
 * a stage table, a history and a licence.
 *
 * | verdict | what it means | what it must never be confused with |
 * |---|---|---|
 * | `nothing to say` | no state, so no project was read | four projects with nothing to show |
 * | `read` | the state holds at least one project | a project that was read well |
 * | `not read` | one project is named, and nothing was learned about it | a project that was found to be empty |
 * | `green` | the suite exited zero | a suite that printed a lot of passes |
 * | `not green` | the suite exited something else | a suite that mostly passed |
 * | `not run` | the suite was never asked to run | a suite that failed |
 * | `no history` | the directory read is not a checkout | a project with no commits |
 * | `no workflow` | the repository has no CI | a repository whose CI is green |
 * | `unread` | nothing could be asked | an answer of no |
 */

/** The four projects, and whether anything could be read about them. */
export function what_the_family_says(the_state) {
	const the_projects = Array.isArray(the_state?.the_family) ? the_state.the_family : [];

	if (the_projects.length === 0) {
		return {
			verdict: "nothing to say",
			the_projects: [],
			why_not:
				"no state at src/state/the_family.json, so no project was read. The state is a " +
				"build artifact and is never committed, so this is what a fresh clone has. Run " +
				"`npm run collect` to read the four projects and build the page from them.",
		};
	}

	return {
		verdict: "read",
		the_projects: the_projects.map(what_one_project_says),
		why_not: null,
	};
}

/** One project, and what is known about it beyond its name. */
function what_one_project_says(a_project) {
	return {
		...a_project,
		verdict: a_project.was_read === true ? "read" : "not read",
		why_not:
			a_project.was_read === true
				? null
				: (a_project.why_not ?? "the run recorded no reason, which is a fault in the run"),
	};
}

/** The suite of one project, kept apart from the three things it is not. */
export function what_the_suite_says(the_suite) {
	if (!the_suite || the_suite.was_run !== true) {
		return {
			verdict: "not run",
			passed: null,
			skipped: null,
			deselected: null,
			detail: the_suite?.why_not ?? "no suite was read for this project",
			what_it_printed: null,
			what_was_run: the_suite?.what_was_run ?? null,
		};
	}
	return {
		verdict: the_suite.is_green ? "green" : "not green",
		passed: the_suite.passed,
		skipped: the_suite.skipped,
		deselected: the_suite.deselected,
		// The exit code, in words, and the numbers the suite printed even when they are
		// unflattering: "not green" with nothing under it is a claim the reader cannot
		// check against their own run.
		detail: the_suite.why_not,
		what_it_printed: the_suite.what_it_printed,
		what_was_run: the_suite.what_was_run ?? null,
	};
}

/** One project's history, and the RED/GREEN pairing its own rule claims. */
export function what_the_history_says(the_history) {
	if (!the_history || the_history.is_a_git_repository !== true) {
		// `commits: null` rather than 0. A project with no commits is the most alarming
		// thing a page can say, and it is not what a directory that is not a checkout
		// means.
		return {
			verdict: "no history",
			commits: null,
			commits_saying_they_are_red: null,
			commits_making_something_pass: null,
			red_commits_answered_by_the_next_commit: null,
			detail: the_history?.why_not ?? "no history was read for this project",
		};
	}
	return {
		verdict: "counted",
		commits: the_history.commits.length,
		commits_saying_they_are_red: the_history.commits_saying_they_are_red,
		commits_making_something_pass: the_history.commits_making_something_pass,
		red_commits_answered_by_the_next_commit: the_history.red_commits_answered_by_the_next_commit,
		detail: null,
	};
}

/** A project's CI, which is a fact about the repository rather than about the world. */
export function what_the_ci_says(the_github) {
	if (!the_github || the_github.check_runs === undefined) {
		return { verdict: "unread", count: null, detail: the_github?.why_not ?? "nothing was asked about CI" };
	}
	if (the_github.check_runs.count === null) {
		return { verdict: "unread", count: null, detail: the_github.check_runs.why_not };
	}
	if (the_github.check_runs.count === 0) {
		return {
			verdict: "no workflow",
			count: 0,
			detail: "the repository has no workflow, so nothing ran on its commits",
		};
	}
	return { verdict: "counted", count: the_github.check_runs.count, detail: null };
}

/** A licence, or the fact that there is no file saying which one it is. */
export function what_the_licence_says(the_licence) {
	if (!the_licence || the_licence.is_stated !== true) {
		return { verdict: "not stated", name: null };
	}
	return { verdict: "stated", name: the_licence.name };
}

/**
 * The stages and the moves a project's code declares, or the refusal that says why not.
 *
 * A project that could not be read is a value here rather than an exception, because
 * the page serves four projects and one of them failing to answer must not take the
 * other three off the page. `null` and a reason is the shape; an exception is not.
 */
export function what_the_domain_says(the_domain) {
	if (!the_domain || the_domain.was_read !== true) {
		return {
			verdict: "not read",
			stages: null,
			roles: null,
			moves: null,
			the_name_the_move_table_goes_by: null,
			why_not: the_domain?.why_not ?? "the domain of this project was not read",
		};
	}
	return {
		verdict: "read",
		stages: the_domain.stages,
		roles: the_domain.roles,
		moves: the_domain.moves.map((a_move) => ({ ...a_move, is_terminal: a_move.to.length === 0 })),
		the_name_the_move_table_goes_by: the_domain.the_name_the_move_table_goes_by ?? null,
		why_not: null,
	};
}

/** One project as the page's header pill shows it. */
export function what_the_suite_line_says(the_suite) {
	if (the_suite.verdict === "green") {
		return `${the_suite.passed === null ? "?" : the_suite.passed} passed`;
	}
	if (the_suite.verdict === "not green") {
		return `${the_suite.passed === null ? "?" : the_suite.passed} passed, and it failed`;
	}
	return "not run";
}

/** A number, or the words that stand in for one nobody could read. */
export function a_number_or(a_number, what_to_say_instead) {
	return a_number === null || a_number === undefined ? what_to_say_instead : String(a_number);
}
