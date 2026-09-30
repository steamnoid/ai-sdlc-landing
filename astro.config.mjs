// @ts-check
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const where_the_state_lives = 'src/state/the_family.json';
const where_the_state_directory_lives = 'src/state';
const what_stands_in_for_a_missing_one = '{\n\t"the_family": []\n}\n';

/**
 * Hand the page a state to read, publish the one it read, and take away what was ours.
 *
 * **The page imports one path, and a missing file is a build error rather than a page.**
 * A fresh clone has no state — which is the point, because a committed snapshot is a
 * number nobody checked — so that clone could not be built at all. That is the wrong way
 * round: the state being absent is a **fact the page must be able to print**, so it needs
 * a shape to be printed from. An empty family says exactly that, in the page's own
 * vocabulary, and the page turns it into a sentence.
 *
 * **The stand-in is taken away, and never a real state.** An empty state and a state
 * recording an empty run are different things, and a leftover stand-in would be read by
 * the next build as a run that read nothing and wanted to. So the removal is keyed on
 * the file's own contents: a stand-in is removed, and a state a run wrote is left for
 * the developer to look at and delete, because deleting somebody else's work silently is
 * worse than leaving a build artifact in a gitignored directory.
 *
 * **Publishing is here rather than in the workflow, for the second reason.** A reader can
 * check every number on the page against the state it came from, which turns the page's
 * argument from a claim into a check; and the next run can ask the live site what is
 * already published, so deciding whether to skip a build needs no previous run, no token
 * and no deployment history. A step in the workflow would run in CI and nowhere else, so a
 * developer's `npm run build` produced a site without the file while CI produced one with
 * it — two artifacts called by the same name. This runs in both, so there is one artifact.
 */
const the_state_the_page_is_built_from = {
	name: 'the-state-the-page-is-built-from',
	hooks: {
		'astro:build:start': () => {
			if (!existsSync(where_the_state_lives)) {
				// **The directory, and not only the file.** `src/state` is gitignored, so a fresh
				// clone does not have it either — and this hook is the thing that makes a fresh
				// clone buildable, which is the only reason it exists. `writeFileSync` does not
				// create the directory it writes into, so the stand-in for the case the stand-in
				// was written for failed with `ENOENT` on a fresh clone: `npm run build` threw a
				// stack trace instead of building the page that says it has nothing to say.
				//
				// It was never seen because every run of it happened in a working tree where a
				// collector had already been run and the directory was there. The comment above
				// said "a fresh clone could not be built at all" and then did nothing to stop it.
				mkdirSync(dirname(where_the_state_lives), { recursive: true });
				writeFileSync(where_the_state_lives, what_stands_in_for_a_missing_one);
			}
		},
		'astro:build:done': async ({ dir, logger }) => {
			/**
			 * Every file that was read, copied beside the page under its own name.
			 *
			 * **Everything, and not a list of things.** This copied one file by name for as long as
			 * there was one file. A second arrived — what moved since the last read — and nothing
			 * failed; the page printed claims from it while the footer went on promising that every
			 * number is published beside it, which held for every number and not for the one a
			 * person caused. A list is a thing that is right until the next file.
			 */
			const where_the_output_goes = dir.pathname ?? dir;
			const what_was_read = readdirSync(where_the_state_directory_lives).filter((a_name) =>
				a_name.endsWith(".json"),
			);
			for (const a_name of what_was_read) {
				copyFileSync(join(where_the_state_directory_lives, a_name), join(where_the_output_goes, a_name));
			}

			const the_state = readFileSync(where_the_state_lives, "utf8");
			if (the_state === what_stands_in_for_a_missing_one) {
				rmSync(where_the_state_lives, { force: true });
				logger.warn("no state was read, so the published one is a stand-in saying so");
				return;
			}
			logger.info(`published ${what_was_read.join(", ")}`);
		},
	},
};

export default defineConfig({
	site: 'https://steamnoid.github.io',
	base: '/ai-sdlc-landing',
	build: { format: 'file' },
	integrations: [the_state_the_page_is_built_from],
	vite: {
		plugins: [tailwindcss()],
	},
});
