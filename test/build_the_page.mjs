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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
	const there_was_a_state = existsSync(the_state_file);
	const what_was_there = there_was_a_state ? readFileSync(the_state_file, "utf8") : null;

	if (what_to_do_about_the_state.none === true) {
		rmSync(join(at, where_the_state_directory_lives), { recursive: true, force: true });
	} else if ("write" in what_to_do_about_the_state) {
		mkdirSync(join(at, where_the_state_directory_lives), { recursive: true });
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
		rmSync(join(at, where_the_state_directory_lives), { recursive: true, force: true });
		if (what_was_there !== null) {
			mkdirSync(join(at, where_the_state_directory_lives), { recursive: true });
			writeFileSync(the_state_file, what_was_there);
		}
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
