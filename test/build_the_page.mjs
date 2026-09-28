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
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const where_the_page_lands = "index.html";
const where_the_state_lives = join("src", "state", "the_family.json");

/**
 * Build the page from `at`, optionally with a state, and return the built HTML's path.
 *
 * The state is removed afterwards whatever happens, because a test that leaves one
 * behind turns every later test's "the state is absent" premise into a lie.
 */
export function build_the_page(at, a_directory_to_build_into, the_state_to_write = null) {
	const there_was_a_state = existsSync(join(at, where_the_state_lives));
	const what_was_there = there_was_a_state ? readFileSync(join(at, where_the_state_lives), "utf8") : null;

	if (the_state_to_write !== null) {
		writeFileSync(join(at, where_the_state_lives), `${JSON.stringify(the_state_to_write, null, "\t")}\n`);
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
		if (the_state_to_write !== null || there_was_a_state) {
			rmSync(join(at, where_the_state_lives), { force: true });
		}
		if (what_was_there !== null) {
			writeFileSync(join(at, where_the_state_lives), what_was_there);
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
