/** Read a Rust project's domain out of its source, or refuse.
 *
 * **A Rust project cannot be imported, and this is the honest consequence.** Every
 * other fact on the page is imported or read out of a file the project wrote. A Rust
 * project can only be read as text, and a text reader is the one thing in this
 * repository that can produce a confidently wrong page.
 *
 * **No name is ever derived.** A stage is written `Stage::Idle` in Rust and `IDLE` in
 * the specification, in the glossary and in every artifact, and the two spellings are
 * not related by a rule anybody can rely on — so every written name here is a string
 * literal lifted out of the project's own `match`. Both real Rust projects write that
 * match, one in a `name()` and one in a `Display`, and one of them says why in its own
 * comment: the Rust name and the written name are not the same spelling, so the
 * writing has to be asked for rather than assumed. A reader that derived the capitals
 * from the variant would be right today and wrong the day somebody's project disagreed,
 * and nothing would fail.
 *
 * **Everything here is allowed to be missing, and missing means a refusal.** A stage
 * with no written name, a transition table that is not a `match`, an invariant that is
 * neither two constants nor a `matches!`, a tree holding two domains — each is refused
 * by name rather than filled in. The alternative is a page that draws a domain nobody
 * wrote, which is the one thing this page exists not to do.
 *
 *     node scripts/read_the_rust_domain.mjs --repository ../ai-sdlc-app-rs
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

/** A tree that has no domain in it at all, and where the reader looked for one. */
export class TheRustDomainIsNotReadableError extends Error {
	constructor(why) {
		super(why);
		this.name = "TheRustDomainIsNotReadableError";
	}
}

/** The directories a build leaves behind, and which are never the project's own source. */
const NOT_SOURCE = new Set(["target", ".git", "node_modules", "build", "dist", ".astro"]);

/** The file a stage set is declared in, and the two words its declaration may start with. */
const WHERE_THE_STAGES_ARE = "stage.rs";
const WHERE_THE_MOVES_ARE = "state_machine.rs";
const WHERE_THE_ROLES_ARE = "role.rs";

/** The stages of the real family, which no fixture declares and which are used to catch a leak. */
const a_stage_of_the_real_family = "AWAITING_HUMAN_APPROVAL";

/** Every source file under a project, skipping what a build leaves behind. */
function every_rust_file_under(a_directory) {
	const found = [];
	for (const an_entry of readdirSync(a_directory, { withFileTypes: true })) {
		if (NOT_SOURCE.has(an_entry.name)) {
			continue;
		}
		const its_path = join(a_directory, an_entry.name);
		if (an_entry.isDirectory()) {
			found.push(...every_rust_file_under(its_path));
			continue;
		}
		if (an_entry.name.endsWith(".rs")) {
			found.push(its_path);
		}
	}
	return found;
}

/**
 * The one file of a kind, or a refusal.
 *
 * **A tree holding two is refused rather than resolved.** A project that declares two
 * domains is either a project with a vendored copy or a project mid-move, and a page
 * that quietly picked one would be describing a project that does not exist. Choosing
 * is a decision, and this script does not make it on a reader's behalf.
 */
function the_only_file_named(a_project, the_name, what_it_is) {
	const where_they_are = every_rust_file_under(a_project).filter((a_path) => basename(a_path) === the_name);
	if (where_they_are.length === 0) {
		throw new TheRustDomainIsNotReadableError(
			`this project declares no ${what_it_is}, and the reader looked in every .rs file under ${a_project} ` +
				`for one named ${the_name}. A page that drew a domain for it would be drawing one nobody wrote.`,
		);
	}
	if (where_they_are.length > 1) {
		throw new TheRustDomainIsNotReadableError(
			`this project has ${where_they_are.length} files named ${the_name}, and the reader refuses to ` +
				`choose between them: ${where_they_are.map((a_path) => relative(a_project, a_path)).join(", ")}. ` +
				"A project with two domains is one mid-move or one with a vendored copy, and a page that " +
				"picked one would describe a project that does not exist.",
		);
	}
	return where_they_are[0];
}

/** The text of a file, or a refusal naming the file. */
function the_text_of(a_path, what_it_is) {
	try {
		return readFileSync(a_path, "utf8");
	} catch (the_problem) {
		throw new TheRustDomainIsNotReadableError(`${what_it_is} could not be read at ${a_path}: ${the_problem}`);
	}
}

/**
 * The written name of every stage, out of the project's own `match`.
 *
 * **A string literal per variant, and never a conversion.** Two forms are accepted
 * because the family has both: `Stage::Idle => "IDLE"` and `Stage::Idle => 'IDLE'`.
 * A project that writes the name any other way is refused, because the only other
 * thing to do with it is to invent it.
 */
function the_written_names_in(a_text, a_path) {
	const a_name_after_a_variant = /Stage::([A-Za-z][A-Za-z0-9]*)\s*=>\s*["']([A-Z0-9_]+)["']/g;
	const the_names = new Map();
	for (const a_found of a_text.matchAll(a_name_after_a_variant)) {
		the_names.set(a_found[1], a_found[2]);
	}
	if (the_names.size === 0) {
		throw new TheRustDomainIsNotReadableError(
			`no stage writes its own name in ${a_path}. The reader is looking for a match whose arms ` +
				'pair a variant with a name in capitals — Stage::Idle => "IDLE" — because that string is ' +
				"the only place a project's own spelling of a stage can be read from. Deriving it from the " +
				"variant's letters would be right until a project disagreed, and then nothing would fail.",
		);
	}
	return the_names;
}

/** The variants of `enum Stage`, in the order the enumeration declares them. */
function the_variants_in(a_text, a_path) {
	const the_enumeration = /pub enum Stage \{([^}]*)\}/.exec(a_text);
	if (the_enumeration === null) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} declares no \`pub enum Stage\`. The stages of a Rust project cannot be imported, so ` +
				"reading the enumeration is the only way to know which stages exist and in what order.",
		);
	}
	const variants = [];
	for (const a_line of the_enumeration[1].split("\n")) {
		const a_variant = /^\s{4}([A-Z][A-Za-z0-9]*)\s*,\s*(?:\/\/.*)?$/.exec(a_line);
		if (a_variant !== null) {
			variants.push(a_variant[1]);
		}
	}
	if (variants.length === 0) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} declares \`enum Stage\` with no members the reader could see. An empty stage set ` +
				"draws an empty table, and an empty table reads as a project with no stages.",
		);
	}
	return variants;
}

/** Who must be holding each stage, and the way this project says so. */
function the_holder_of_a_stage_in(a_state_machine_text, a_stage_text, the_variant) {
	// The first of the family's two Rust ways: two constants beside the table.
	const without = /STAGES_WITHOUT_AN_AGENT[^=]*=\s*\[([^\]]*)\]/.exec(a_state_machine_text);
	const with_ = /STAGES_WITH_AN_AGENT[^=]*=\s*\[([^\]]*)\]/.exec(a_state_machine_text);
	if (without !== null || with_ !== null) {
		const are_in = (a_declaration) =>
			new Set([...(a_declaration?.[1] ?? "").matchAll(/Stage::([A-Za-z][A-Za-z0-9]*)/g)].map((a) => a[1]));
		const the_without = are_in(without);
		const the_with = are_in(with_);
		if (the_without.size === 0 && the_with.size === 0) {
			throw new TheRustDomainIsNotReadableError(
				"this project declares STAGES_WITHOUT_AN_AGENT and STAGES_WITH_AN_AGENT and both are " +
					"empty, so nothing says who holds a stage. A stage drawn with an invented holder is a " +
					"stage the page made up.",
			);
		}
		return {
			holds: the_with.has(the_variant),
			how: "two constants beside the table",
		};
	}

	// The second: a method on the stage that says so for itself.
	const a_method = /fn an_agent_must_be_holding_it\([^)]*\)[^{]*\{([^{}]*)\}/.exec(a_stage_text);
	if (a_method !== null) {
		const what_it_matches = /matches!\(\s*self\s*,\s*([^)]*)\)/.exec(a_method[1]);
		if (what_it_matches === null) {
			throw new TheRustDomainIsNotReadableError(
				"this project has a method called an_agent_must_be_holding_it and the reader could not " +
					"read what it matches. A page drawing a holder from a method it did not read would be " +
					"guessing with a method's name on it.",
			);
		}
		const it_holds = [...what_it_matches[1].matchAll(/Stage::([A-Za-z][A-Za-z0-9]*)/g)].map((a) => a[1]);
		return { holds: it_holds.includes(the_variant), how: "a method on the stage" };
	}

	throw new TheRustDomainIsNotReadableError(
		"nothing in this project says which stages an agent must be holding. The three ways the family " +
			"says it are two constants beside the table — STAGES_WITHOUT_AN_AGENT and " +
			"STAGES_WITH_AN_AGENT — a method on the stage called an_agent_must_be_holding_it, and in " +
			"Python a property of the same name. None of them is here, so the page would have to invent a " +
			"holder for each of the stages it found.",
	);
}

/** Every legal move, out of an exhaustive `match` over the stages. */
function the_moves_in(a_text, a_path, the_written_names) {
	const the_table = /legal_transitions_from\([^)]*\)[^{]*\{([\s\S]*?)\n\}/.exec(a_text);
	if (the_table === null) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} declares no \`legal_transitions_from\`. That function is one of the two names the ` +
				"family gives the table of legal moves, and it is the only one written as a `match`, so a " +
				"reader that found a table some other way would be reading a shape this repository has " +
				"never seen and could not check against a test in the project.",
		);
	}
	const an_arm = /Stage::([A-Za-z][A-Za-z0-9]*)\s*=>\s*&\[([^\]]*)\]/g;
	const the_moves = [];
	for (const a_found of the_table[1].matchAll(an_arm)) {
		the_moves.push({
			from: written_or_refuse(the_written_names, a_found[1], a_path),
			to: [...a_found[2].matchAll(/Stage::([A-Za-z][A-Za-z0-9]*)/g)].map((a_variant) =>
				written_or_refuse(the_written_names, a_variant[1], a_path),
			),
		});
	}
	if (the_moves.length === 0) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} has a legal_transitions_from and the reader could not read a single move out of ` +
				"it. A page drawing an empty table of moves would be drawing a project with no moves.",
		);
	}
	return the_moves;
}

/** A variant's written name, or a refusal naming the variant nobody wrote down. */
function written_or_refuse(the_written_names, a_variant, a_path) {
	const the_name = the_written_names.get(a_variant);
	if (the_name === undefined) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} uses the stage ${a_variant} and never writes its name. The reader takes every ` +
				"written name from a string literal in this project, so a stage whose name is nowhere here " +
				"cannot be given one — deriving it from the variant's letters is right until somebody's " +
				"project disagrees, and then nothing fails.",
		);
	}
	return the_name;
}

/** Every discipline the project declares, in the order the enumeration declares them. */
function the_roles_in(a_text, a_path) {
	const the_enumeration = /pub enum Role \{([^}]*)\}/.exec(a_text);
	if (the_enumeration === null) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} declares no \`pub enum Role\`, so the page cannot name a discipline for this project.`,
		);
	}
	const the_roles = [];
	for (const a_line of the_enumeration[1].split("\n")) {
		const a_role = /^\s{4}([A-Z][A-Za-z0-9]*)\s*,\s*(?:\/\/.*)?$/.exec(a_line);
		if (a_role !== null) {
			the_roles.push(a_role[1]);
		}
	}
	if (the_roles.length === 0) {
		throw new TheRustDomainIsNotReadableError(
			`${a_path} declares \`enum Role\` with no members the reader could see, and a page naming no ` +
				"discipline reads as a project that has none.",
		);
	}
	return the_roles;
}

/** How this project writes a stage's name, which is a fact the page compares. */
function how_a_stage_is_written_in(a_text) {
	if (/\bfn fmt\(&self[^)]*\)[^{]*\{[\s\S]*?Stage::[A-Za-z0-9]*\s*=>\s*["'][A-Z0-9_]+["']/.test(a_text)) {
		return "a Display that matches every stage";
	}
	if (/\bfn name\([^)]*\)[^{]*\{[\s\S]*?Stage::[A-Za-z0-9]*\s*=>\s*["'][A-Z0-9_]+["']/.test(a_text)) {
		return "a name() that matches every stage";
	}
	return "a match somewhere this reader did not recognise";
}

/** Everything the page may say about a Rust project, asked of its source. */
export function read_the_rust_domain(a_project) {
	const at = resolve(a_project);
	if (!existsSync(at) || !statSync(at).isDirectory()) {
		throw new TheRustDomainIsNotReadableError(
			`${at} is not a directory, so there is no source to read. The reader takes a checkout, not ` +
				"an address, because a page that describes a repository it never read is a page about a " +
				"repository it cannot check.",
		);
	}

	const where_the_stages_are = the_only_file_named(at, WHERE_THE_STAGES_ARE, "stage set");
	const where_the_moves_are = the_only_file_named(at, WHERE_THE_MOVES_ARE, "table of legal moves");
	const where_the_roles_are = the_only_file_named(at, WHERE_THE_ROLES_ARE, "set of disciplines");

	const the_stage_text = the_text_of(where_the_stages_are, "the stage set");
	const the_move_text = the_text_of(where_the_moves_are, "the table of legal moves");

	const the_written_names = the_written_names_in(the_stage_text, where_the_stages_are);
	const the_variants = the_variants_in(the_stage_text, where_the_stages_are);
	const how_each_is_written = how_a_stage_is_written_in(the_stage_text);

	const the_stages = the_variants.map((a_variant) => {
		const the_holder = the_holder_of_a_stage_in(the_move_text, the_stage_text, a_variant);
		return {
			name: written_or_refuse(the_written_names, a_variant, where_the_stages_are),
			an_agent_must_be_holding_it: the_holder.holds,
			how_the_project_says_who_must_hold_a_stage: the_holder.how,
		};
	});

	return {
		the_files_that_answered: [where_the_stages_are, where_the_moves_are, where_the_roles_are].map((a_path) =>
			relative(at, a_path),
		),
		stages: the_stages.map((a_stage) => ({
			name: a_stage.name,
			an_agent_must_be_holding_it: a_stage.an_agent_must_be_holding_it,
		})),
		how_a_stage_is_written: how_each_is_written,
		// Always false, and a fact the page prints: every name above came out of a string
		// literal in this project, and the page says so next to the table it drew.
		a_stage_name_was_derived: false,
		how_the_project_says_who_must_hold_a_stage: the_stages[0].how_the_project_says_who_must_hold_a_stage,
		roles: the_roles_in(the_text_of(where_the_roles_are, "the set of disciplines"), where_the_roles_are),
		moves: the_moves_in(the_move_text, where_the_moves_are, the_written_names),
		the_name_the_move_table_goes_by: "legal_transitions_from",
		gates: null,
		why_the_gates_could_not_be_read: null,
	};
}

/** The flags, read one at a time, and refused when one is given a value it cannot take. */
export function the_flags_in(process_arguments) {
	const what_was_asked_for = { was_asked_to_read: false };
	for (let where_it_is = 0; where_it_is < process_arguments.length; where_it_is += 1) {
		const the_argument = process_arguments[where_it_is];
		if (the_argument === "--repository") {
			what_was_asked_for.repository = process_arguments[where_it_is + 1];
			where_it_is += 1;
			continue;
		}
		if (the_argument === "--help") {
			what_was_asked_for.help = true;
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

const usage = `Read the domain of a Rust project out of its source.

    node scripts/read_the_rust_domain.mjs --repository <path>
`;

async function main() {
	const what_was_asked_for = the_flags_in(process.argv.slice(2));
	if (what_was_asked_for.help === true || process.argv.length === 2) {
		process.stdout.write(usage);
		return 0;
	}
	if (!what_was_asked_for.repository) {
		process.stderr.write(`${usage}\nnothing was asked for: pass --repository <path>.\n`);
		return 2;
	}
	try {
		process.stdout.write(`${JSON.stringify(read_the_rust_domain(what_was_asked_for.repository), null, 2)}\n`);
		return 0;
	} catch (the_refusal) {
		process.stderr.write(`${the_refusal.name ?? "Error"}: ${the_refusal.message}\n`);
		return 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	process.exitCode = await main().catch((the_refusal) => {
		process.stderr.write(`${the_refusal.name ?? "Error"}: ${the_refusal.message}\n`);
		return 1;
	});
}
