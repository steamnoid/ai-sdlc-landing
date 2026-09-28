/** The one question this page exists to answer: do the four declare the same domain?
 *
 * **Everything else on the page is a fact about one project. This is a fact about four.**
 * Each of the four repositories declares six stages, five roles and a table of legal
 * moves, and the page cannot know they are the same tables without comparing all four
 * answers. That comparison is the reason a page about four repositories is a different
 * page from the one about one.
 *
 * **The verdict is refused unless every project was read.** "They declare the same
 * domain" is a claim about four projects, and a claim about three is a claim about
 * three. A project whose domain could not be read leaves the page saying how many could
 * be, which is the honest half of the answer — and this is the rule that stops a page
 * about unfinished work from reporting a clean result because one project was hard to
 * reach.
 *
 * | verdict | what it means | what it must never be confused with |
 * |---|---|---|
 * | `they declare the same domain` | all four agree, on all three | three agree |
 * | `N of them differ` | all four were read and they do not agree | one project being wrong |
 * | `could not be read for N` | fewer than four were read | the ones that were read disagreeing |
 */

/** The stages, roles and moves of one project, with the way the reader got at them. */
function what_one_project_declares(a_project) {
	return {
		owner: a_project.owner,
		name: a_project.name,
		was_read: a_project.was_read === true,
		why_not: a_project.why_not ?? null,
		how_the_domain_was_read: a_project.how_the_domain_was_read ?? null,
		stages: a_project.what_its_code_declares?.stages ?? null,
		roles: a_project.what_its_code_declares?.roles ?? null,
		moves: a_project.what_its_code_declares?.moves ?? null,
		the_name_the_move_table_goes_by:
			a_project.what_its_code_declares?.the_name_the_move_table_goes_by ?? null,
		how_the_project_says_who_must_hold_a_stage:
			a_project.what_its_code_declares?.how_the_project_says_who_must_hold_a_stage ?? null,
		how_a_stage_is_written: a_project.what_its_code_declares?.how_a_stage_is_written ?? null,
	};
}

/** A set of stages as an order-independent value, so two answers can be compared at all. */
function the_stages_as_a_set(a_domain) {
	return a_domain.stages.map((a_stage) => `${a_stage.name}:${a_stage.an_agent_must_be_holding_it}`).sort();
}

/** A set of moves as an order-independent value, for the same reason. */
function the_moves_as_a_set(a_domain) {
	return a_domain.moves
		.map((a_move) => `${a_move.from}->${[...a_move.to].sort().join(",")}`)
		.sort();
}

/** A set of roles, likewise. */
function the_roles_as_a_set(a_domain) {
	return [...a_domain.roles].sort();
}

/** The three tables, each as a value that can be compared. */
function what_a_domain_says(a_domain) {
	return {
		stages: the_stages_as_a_set(a_domain),
		roles: the_roles_as_a_set(a_domain),
		moves: the_moves_as_a_set(a_domain),
	};
}

/** The projects that could not be read, and why. */
function those_that_could_not_be_read(the_projects) {
	return the_projects
		.filter((a_project) => a_project.was_read !== true)
		.map((a_project) => ({
			owner: a_project.owner,
			name: a_project.name,
			why_not: a_project.why_not ?? "the run recorded no reason, which is a fault in the run",
		}));
}

/**
 * Every project that declares something the first one does not.
 *
 * **All of them, not the first.** Comparing everything to the first project reports one
 * disagreement where two projects differ from each other, and a page naming one of the two
 * leaves a reader believing the other agrees. So each project is compared with the first,
 * and every one that differs is reported — which names a project that differs from the
 * family without saying which project it is unlike.
 */
function every_disagreement(the_domains) {
	const the_disagreements = [];
	const the_first = what_a_domain_says(the_domains[0]);
	for (let which_one = 1; which_one < the_domains.length; which_one += 1) {
		const this_one = what_a_domain_says(the_domains[which_one]);
		for (const a_part of ["stages", "roles", "moves"]) {
			if (JSON.stringify(the_first[a_part]) === JSON.stringify(this_one[a_part])) {
				continue;
			}
			the_disagreements.push({
				part: a_part,
				against: the_domains[which_one],
				what_it_says: this_one[a_part],
				what_the_first_says: the_first[a_part],
			});
		}
	}
	return the_disagreements;
}

/**
 * What the four projects declare, and whether that is the same thing four times.
 *
 * **Three tables are compared and two conventions are only collected.** The stages, the
 * roles and the moves are the domain, and the domain is either shared or it is not. The
 * name a project gives the table of moves and the way it says who holds a stage are
 * conventions, and four projects are *expected* to differ on those — so the answer
 * carries them for the page to lay out side by side, and the verdict says nothing about
 * them.
 */
export function what_the_family_declares(the_state) {
	const the_projects = Array.isArray(the_state?.the_family) ? the_state.the_family : [];
	if (the_projects.length === 0) {
		return {
			verdict: "nothing to say",
			how_many_could_be_read: 0,
			how_many_were_asked_about: 0,
			the_projects: [],
			the_disagreements: [],
			why_not: "no state, so there is no family to compare",
		};
	}

	const the_domains = the_projects.map(what_one_project_declares);
	const those_unread = those_that_could_not_be_read(the_domains);
	const the_read = the_domains.filter((a_project) => a_project.was_read);

	// **Agreement needs more than one project to agree with.** A family of one is a
	// single project's domain, and "they declare the same domain" about it is a sentence
	// with no second subject — so a page whose state happened to hold one project would
	// print its central sentence about a comparison it never made. The floor is two, and
	// the verdict below names how many were asked about so a reader can see the gap.
	if (the_projects.length < 2) {
		return {
			verdict: "could not be read for " + those_unread.length,
			how_many_could_be_read: the_read.length,
			how_many_were_asked_about: the_projects.length,
			the_projects: the_domains,
			the_disagreements: [],
			why_not:
				`a verdict about a family needs at least two projects and this state holds ` +
				`${the_projects.length}, so nothing is said about whether they agree. The claim is ` +
				"about agreement, and one project cannot agree with itself.",
		};
	}

	if (the_read.length !== the_projects.length) {
		return {
			verdict: "could not be read for " + those_unread.length,
			how_many_could_be_read: the_read.length,
			how_many_were_asked_about: the_projects.length,
			the_projects: the_domains,
			the_disagreements: [],
			why_not:
				`the verdict about the family needs all ${the_projects.length} projects and ` +
				`${the_read.length} could be read, so nothing is said about whether they agree. ` +
				those_unread.map((a_project) => `${a_project.name}: ${a_project.why_not}`).join("; "),
		};
	}

	const the_disagreements = every_disagreement(the_read);
	if (the_disagreements.length > 0) {
		const they_differ = new Set(the_disagreements.map((a_disagreement) => a_disagreement.against.name));
		return {
			verdict: `${they_differ.size} of them differ`,
			how_many_could_be_read: the_read.length,
			how_many_were_asked_about: the_projects.length,
			the_projects: the_domains,
			the_disagreements,
			why_not: null,
		};
	}

	return {
		verdict: "they declare the same domain",
		how_many_could_be_read: the_read.length,
		how_many_were_asked_about: the_projects.length,
		the_projects: the_domains,
		the_disagreements: [],
		why_not: null,
	};
}
