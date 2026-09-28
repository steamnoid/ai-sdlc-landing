/** What differs between two states, and whether that is worth publishing again.
 *
 * **The page reads the family every hour, and a run that found it exactly where it was
 * would otherwise publish a byte-identical artifact four times a day.** So the build and
 * deploy steps are skipped when nothing changed, which is cheap — and which is worthless if
 * the comparison is wrong, because the page then stops moving while the projects do not.
 *
 * | what must be compared | what must not |
 * |---|---|
 * | every tip commit, all four | the moment the state was read |
 * | the page's own commit | whether a fresh clone was made |
 * | the suite counts | the path a project was read from |
 * | stars, and anything else GitHub reports | a duration in a timing line |
 *
 * **Two ways this goes wrong, and both are silent.**
 *
 * **Keying the skip on the project's commit alone.** The projects stand still between commits
 * and a template gets fixed, so the page would keep the old template for ever. The state
 * therefore carries `the_build.page_code_commit` beside the four tips — *what was read* and
 * *what rendered it* — and one comparison covers both.
 *
 * **Comparing `read_at` or `was_cloned`.** Both differ on every run by definition, so a
 * comparison that includes them always finds a difference, skips nothing, and behaves exactly
 * like having no comparison at all.
 *
 * **A state that cannot be read is a change, never agreement.** Nothing published yet, a 404,
 * a rate limit — every one of those means the comparison did not happen, and reporting it as
 * "no change" is how a page quietly stops updating.
 */

/** The four paths that are about the run and not about the family. */
export const ABOUT_THE_RUN_AND_NOT_THE_FAMILY = [
	"the_build.read_at",
	"the_build.was_cloned",
	"the_repository.on_disk",
	"the_code_that_answered",
];

/**
 * One field that is read differently each time, and how to read it the same way twice.
 *
 * **Matched on the end of the path rather than the whole of it**, because the suite's output
 * is not at the top of a state about four projects — it is one field per project, and a rule
 * keyed on the whole path silently stopped applying the moment the second project existed.
 * A rule that quietly does nothing is a rule that reports agreement.
 */
export const HOW_A_FIELD_IS_READ = {
	what_it_printed: (a_value) => String(a_value).replace(/in \d+\.\d+s/g, "in some number of seconds"),
};

/** Every leaf of an object as a dotted path, descending arrays by index. */
function every_leaf_of(a_value, a_prefix = "") {
	if (a_value === null || typeof a_value !== "object") {
		return [[a_prefix, a_value]];
	}
	const the_leaves = [];
	for (const [a_key, a_nested] of Object.entries(a_value)) {
		const its_path = a_prefix === "" ? a_key : `${a_prefix}.${a_key}`;
		if (Array.isArray(a_nested)) {
			a_nested.forEach((an_item, where_it_is) => the_leaves.push(...every_leaf_of(an_item, `${its_path}.${where_it_is}`)));
			continue;
		}
		if (a_nested !== null && typeof a_nested === "object") {
			the_leaves.push(...every_leaf_of(a_nested, its_path));
			continue;
		}
		the_leaves.push([its_path, a_nested]);
	}
	return the_leaves;
}

/** What a state holds at a path, read by the field's own rule where it has one. */
function the_value_at(a_state, a_path) {
	const the_rule = a_path.split(".").findLast((a_key) => a_key in HOW_A_FIELD_IS_READ);
	const the_value = a_path
		.split(".")
		.reduce((a_nested, a_key) => (a_nested === null || a_nested === undefined ? undefined : a_nested[a_key]), a_state);
	return the_rule === undefined ? the_value : HOW_A_FIELD_IS_READ[the_rule](the_value);
}

/**
 * The paths that differ between two states, and nothing else.
 *
 * **A deep walk rather than a list of fields to watch**, so a field added to the state is
 * compared from the day it exists without anybody remembering to add it here — and the union
 * of both states' paths, so a key that is in one and absent from the other is a difference
 * rather than a silence.
 */
export function what_differs_between(the_first, the_second) {
	const the_first_leaves = new Map(every_leaf_of(the_first));
	const the_second_leaves = new Map(every_leaf_of(the_second));
	const every_path = new Set([...the_first_leaves.keys(), ...the_second_leaves.keys()]);

	const the_differences = [];
	for (const a_path of every_path) {
		if (ABOUT_THE_RUN_AND_NOT_THE_FAMILY.includes(a_path)) {
			continue;
		}
		const before = the_value_at(the_first, a_path);
		const after = the_value_at(the_second, a_path);
		if (!Object.is(before, after)) {
			the_differences.push(a_path);
		}
	}
	return [...the_differences].sort();
}
