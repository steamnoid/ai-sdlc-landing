// @ts-check
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const where_the_state_lives = 'src/state/the_family.json';

/**
 * Copy the state the page was built from next to the page.
 *
 * **Two reasons, and the second is the one that broke on the page this one is a view
 * of.** A reader can check every number on the page against the state it came from,
 * which turns the page's argument from a claim into a check. And the next run can ask
 * the live site what is already published, so deciding whether to skip a build needs
 * no previous run, no token and no deployment history.
 *
 * **This is a build hook rather than a step in the workflow.** A step in the workflow
 * runs in CI and nowhere else, so a developer's `npm run build` produced a site without
 * the file while CI produced one with it — and the two were then different artifacts
 * called by the same name. The hook runs in both, so there is one artifact.
 */
const publish_the_state = {
	name: 'publish-the-state',
	hooks: {
		'astro:build:done': async ({ dir, logger }) => {
			if (!existsSync(where_the_state_lives)) {
				logger.warn(
					`no state at ${where_the_state_lives}, so it was not published. Run \`npm run collect\` before building.`,
				);
				return;
			}
			copyFileSync(where_the_state_lives, join(dir.pathname ?? dir, 'the_family.json'));
			logger.info(`published the_family.json`);
		},
	},
};

export default defineConfig({
	site: 'https://steamnoid.github.io',
	base: '/ai-sdlc-landing',
	build: { format: 'file' },
	integrations: [publish_the_state],
	vite: {
		plugins: [tailwindcss()],
	},
});
