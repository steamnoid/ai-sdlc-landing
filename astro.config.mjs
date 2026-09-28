// @ts-check
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const where_the_state_lives = 'src/state/the_family.json';
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
				writeFileSync(where_the_state_lives, what_stands_in_for_a_missing_one);
			}
		},
		'astro:build:done': async ({ dir, logger }) => {
			const the_state = readFileSync(where_the_state_lives, "utf8");
			copyFileSync(where_the_state_lives, join(dir.pathname ?? dir, "the_family.json"));
			if (the_state === what_stands_in_for_a_missing_one) {
				rmSync(where_the_state_lives, { force: true });
				logger.warn("no state was read, so the published one is a stand-in saying so");
				return;
			}
			logger.info("published the_family.json");
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
