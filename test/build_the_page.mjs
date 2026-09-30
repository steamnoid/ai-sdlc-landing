/** Build the page, and hand back where it landed.
 *
 * **A test of what the page says has to build the page.** Astro's frontmatter is
 * TypeScript run through Vite, so the only place a template's own arithmetic exists is
 * the built artifact. Testing the components would test Astro.
 *
 * **The state is written only when a test asks for one.** A fresh clone has no state —
 * that is the point of it being a build artifact — so a test that wants to see the page
 * with a state writes one, builds, and removes it. Writing it into `src/state` is
 * deliberate rather than convenient: the page reads one path, so a state handed in
 * anywhere else would be a state the page never saw, and the test would pass against a
 * page that ignored it.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const where_the_page_lands = "index.html";
const where_the_state_lives = join("src", "state", "the_family.json");

/** A fresh clone has no state and no directory to put one in, and those are two different absences. */
const where_the_state_directory_lives = dirname(where_the_state_lives);

/**
 * Build the page from `at` and return the built HTML's path.
 *
 * **What to do about the state is the third argument, and it has three answers** because
 * the suite needs all three: leave whatever the tree has, write one, or build as though
 * there is none. The last one is what the first test of this repository needs, and it used
 * to be the only one — so the suite passed on a fresh clone and failed the moment a
 * collector had run, which is the shape of a test that only ever sees one world.
 *
 * **The tree is put back whatever happens**, and a test that leaves a state behind turns
 * every later test's premise into a lie.
 */
export function build_the_page(at, a_directory_to_build_into, what_to_do_about_the_state = {}) {
	const the_state_file = join(at, where_the_state_lives);
	const the_directory = join(at, where_the_state_directory_lives);
	const what_was_in_the_directory = what_the_directory_holds(the_directory);

	if (what_to_do_about_the_state.none === true) {
		rmSync(the_directory, { recursive: true, force: true });
	} else if ("write" in what_to_do_about_the_state) {
		mkdirSync(the_directory, { recursive: true });
		writeFileSync(the_state_file, `${JSON.stringify(what_to_do_about_the_state.write, null, "\t")}\n`);
	}

	try {
		const the_build = spawnSync(
			process.execPath,
			[join(at, "node_modules", "astro", "bin", "astro.mjs"), "build", "--outDir", a_directory_to_build_into],
			{ cwd: at, encoding: "utf8" },
		);
		if (the_build.status !== 0) {
			throw new Error(`the page did not build, and said:\n${the_build.stdout}\n${the_build.stderr}`);
		}
		return join(a_directory_to_build_into, where_the_page_lands);
	} finally {
		put_the_directory_back(the_directory, what_was_in_the_directory);
	}
}

/**
 * Every file in the state directory, with its contents.
 *
 * **The whole directory and not the state file, and this is a repair.** It moved `the_family.json`
 * aside and put that one file back, while the file it had removed was `src/state` itself — so every
 * other file in there was deleted by a green test run. `npm run test:page` runs in the build job
 * against the state that job produced, so the first time this repository kept a second file beside
 * the state, a passing test suite deleted it between the run that wrote it and the run that
 * publishes it. Nothing was red at any point.
 */
function what_the_directory_holds(a_directory) {
	if (!existsSync(a_directory)) {
		return [];
	}
	return readdirSync(a_directory).map((a_name) => [a_name, readFileSync(join(a_directory, a_name), "utf8")]);
}

function put_the_directory_back(a_directory, what_was_there) {
	rmSync(a_directory, { recursive: true, force: true });
	if (what_was_there.length === 0) {
		return;
	}
	mkdirSync(a_directory, { recursive: true });
	for (const [a_name, what_it_held] of what_was_there) {
		writeFileSync(join(a_directory, a_name), what_it_held);
	}
}

/**
 * The page as text, with every tag turned into a space.
 *
 * Tags go rather than being parsed, because a tag is a structure the page uses to say
 * something and a reader of a test wants the sentence, not the markup. Collapsing the
 * whitespace afterwards is what lets a test match a phrase the template wrapped across
 * three lines — which it always does, and which is a layout fact, not a wording one.
 */
export function the_words_on_the_page(the_path_to_the_built_page) {
	return readFileSync(the_path_to_the_built_page, "utf8")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ");
}
