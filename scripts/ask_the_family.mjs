/** Read the four projects, and write one state for the page to render.
 *
 * **One collector, four projects, one file, written once at the end.** Each project's
 * answer is all-or-nothing and the file is written over all four, so nothing on the page
 * is ever half an answer about a project — while one project failing to be read does not
 * take the other three off the page. `AGENTS.md` says why the rule moved a level down
 * rather than away, and `test/the_family_is_read_one_project_at_a_time.test.mjs` holds it.
 *
 * **A project that was not read is a project on the page**, with a reason and with no
 * domain. A page that dropped it would be telling a reader the family has three members,
 * and the reason it could not be read is the part of that a reader needs.
 *
 *     node scripts/ask_the_family.mjs --where .. --out src/state/the_family.json
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { what_the_licence_says, what_the_phases_say } from "../src/page/what_the_documents_say.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** The four the page is about, in the order the page shows them. */
export const THE_FAMILY = [
	{ owner: "steamnoid", name: "ai-sdlc-os", language: "python", interpreter: ".venv/bin/python" },
	{ owner: "steamnoid", name: "ai-sdlc-os-plus", language: "python", interpreter: "python3" },
	{ owner: "steamnoid", name: "ai-sdlc-app-rs", language: "rust" },
	{ owner: "steamnoid", name: "ai-sdlc-app-rs-plus", language: "rust" },
];

/** The first line of a project's `AGENTS.md`, or `null` when it has none. */
function the_text_of(at, a_file_name) {
	const the_path = join(at, a_file_name);
	if (!existsSync(the_path)) {
		return null;
	}
	return readFileSync(the_path, "utf8");
}

/** What a project's code declares, or the refusal that says why it could not be read. */
function what_its_code_declares(a_project, where_it_is, a_family) {
	// **A project the tests ask to be missing is looked for under a name that says so**,
	// rather than under a path with a suffix bolted on. The reason the page prints then
	// names a directory a reader could go and look for, which a path like
	// `a_rust_project/a_rust_project-that-is-not-there` is not.
	const at =
		a_project.is_broken_on_purpose === true
			? join(where_it_is, "..", `${a_project.name}-is-not-on-disk`)
			: where_it_is;

	if (a_project.language === "python") {
		const the_interpreter =
			a_project.is_broken_on_purpose === true ? "python3" : the_python_to_read_it_with(at, a_project.interpreter);
		return what_a_python_project_declares(at, the_interpreter, a_project);
	}
	if (a_project.language === "rust") {
		return what_a_rust_project_declares(at, a_project);
	}
	return {
		was_read: false,
		why_not:
			`the page has no reader for a project written in ${a_project.language}, so nothing about ` +
			`${a_project.name} could be read. Naming the language is what lets somebody add one.`,
	};
}

/** The interpreter that can import a project, which is the one in its own `.venv` if it has one. */
function the_python_to_read_it_with(at, a_project_says) {
	const in_its_own = join(at, ".venv", "bin", "python");
	if (existsSync(in_its_own)) {
		return in_its_own;
	}
	return a_project_says ?? "python3";
}

function what_a_python_project_declares(at, the_interpreter, a_project) {
	const the_answer = spawnSync(the_interpreter, [join(here, "ask_the_python_domain.py"), "--repository", at], {
		encoding: "utf8",
	});
	if (the_answer.status !== 0) {
		return {
			was_read: false,
			why_not:
				`the domain of ${a_project.name} could not be read, and the collector that reads it said: ` +
				(the_answer.stderr.split("\n")[0] || "nothing, and said nothing at all"),
		};
	}
	return { was_read: true, how_it_was_read: "imported", ...JSON.parse(the_answer.stdout) };
}

function what_a_rust_project_declares(at, a_project) {
	const the_answer = spawnSync("node", [join(here, "read_the_rust_domain.mjs"), "--repository", at], {
		encoding: "utf8",
	});
	if (the_answer.status !== 0) {
		return {
			was_read: false,
			why_not:
				`the domain of ${a_project.name} could not be read, and the reader said: ` +
				(the_answer.stderr.split("\n")[0] || "nothing, and said nothing at all"),
		};
	}
	return { was_read: true, how_it_was_read: "read from source", ...JSON.parse(the_answer.stdout) };
}

/** Everything about one project that could be read, with the reason for what could not. */
export function read_one_project(a_project, where_they_are) {
	// `--where` is the directory the projects are checked out *in*, and the project's own
	// name is always part of the path. Treating an absolute `--where` as though it were
	// already a project is right for exactly one of the four, and a bug that only appears
	// when a caller passes the path the way its own usage describes.
	const at = resolve(where_they_are, a_project.name);
	const the_code = what_its_code_declares(a_project, at, null);
	const the_agents = the_text_of(at, "AGENTS.md");
	const the_licence = the_text_of(at, "LICENSE");

	return {
		owner: a_project.owner,
		name: a_project.name,
		url: `https://github.com/${a_project.owner}/${a_project.name}`,
		language: a_project.language,
		was_read: the_code.was_read === true,
		why_not: the_code.was_read === true ? null : the_code.why_not,
		how_the_domain_was_read: the_code.how_it_was_read ?? null,
		what_its_code_declares: the_code.was_read === true ? the_code : null,
		what_its_documents_say: {
			phases: the_agents === null ? null : what_the_phases_say(the_agents, "AGENTS.md"),
			licence: the_licence === null ? null : { is_stated: true, name: what_the_licence_says(the_licence) },
		},
	};
}

/** Where the page's own code is, which it links to and which the state has to account for. */
const THIS_PAGE = { owner: "steamnoid", name: "ai-sdlc-landing" };

/** The four projects, and the state the page is built from. */
export function collect_the_family(the_family, where_they_are) {
	return {
		// **The page's own repository is in the state rather than typed into the template**, so a
		// test can hold that every repository the page links to is one the state mentions. A page
		// that links to itself with a hand-written address is a link nothing can check.
		this_page: { ...THIS_PAGE, url: `https://github.com/${THIS_PAGE.owner}/${THIS_PAGE.name}` },
		the_family: the_family.map((a_project) => read_one_project(a_project, where_they_are)),
		the_build: { read_at: new Date().toISOString() },
	};
}

/** The flags, read one at a time, and refused when one is given a value it cannot take. */
export function the_flags_in(process_arguments) {
	const a_flag_with_no_value = ["--help"];
	const what_was_asked_for = {};
	for (let where_it_is = 0; where_it_is < process_arguments.length; where_it_is += 1) {
		const the_argument = process_arguments[where_it_is];
		if (a_flag_with_no_value.includes(the_argument)) {
			what_was_asked_for[the_argument.slice(2)] = true;
			continue;
		}
		if (!the_argument.startsWith("--")) {
			continue;
		}
		const the_value = process_arguments[where_it_is + 1];
		if (the_value === undefined) {
			throw new Error(`${the_argument} was given no value.`);
		}
		what_was_asked_for[the_argument.slice(2).replace(/-/g, "_")] = the_value;
		where_it_is += 1;
	}
	return what_was_asked_for;
}

const usage = `Read the four projects, and write the state the page is built from.

    node scripts/ask_the_family.mjs --where <path> [--out <path>] [--family <json>]

    --where <path>       the directory the four projects are checked out in
    --out <path>         where the state is written (default: src/state/the_family.json)
    --family <json>      the projects to read, as a JSON array (default: the four)
`;

async function main() {
	const what_was_asked_for = the_flags_in(process.argv.slice(2));
	if (what_was_asked_for.help === true || process.argv.length === 2) {
		process.stdout.write(usage);
		return 0;
	}
	if (!what_was_asked_for.where) {
		process.stderr.write(`${usage}\nnothing was asked for: pass --where <path>.\n`);
		return 2;
	}

	const the_family = what_was_asked_for.family ? JSON.parse(what_was_asked_for.family) : THE_FAMILY;
	const the_state = collect_the_family(the_family, what_was_asked_for.where);
	const where_the_state_should_land = resolve(what_was_asked_for.out ?? "src/state/the_family.json");

	mkdirSync(dirname(where_the_state_should_land), { recursive: true });
	writeFileSync(where_the_state_should_land, `${JSON.stringify(the_state, null, "\t")}\n`);
	process.stdout.write(
		`read ${the_state.the_family.length} projects, ${the_state.the_family.filter((a) => a.was_read).length} ` +
			`of them, wrote ${where_the_state_should_land}\n`,
	);
	return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	process.exitCode = await main().catch((the_refusal) => {
		process.stderr.write(`${the_refusal.name ?? "Error"}: ${the_refusal.message}\n`);
		return 1;
	});
}
