/** Read a Rust project's domain out of its source, or refuse.
 *
 * **A shell, and it is here so the tests can demand the rule rather than a file.**
 *
 * The first RED of this cycle failed on `Cannot find module`, which is a finding about
 * this repository and not about any project's domain. One test in it was also green for
 * the wrong reason: a reader that prints nothing is a reader that prints nothing. So
 * the shell refuses by name, with the project it was asked about in the refusal, and
 * every test now fails on an assertion about a domain.
 *
 * **A Rust project cannot be imported, and this script is the honest consequence.**
 * Every other fact on the page is imported or read from a file the project wrote. A
 * Rust project can only be read as text, and a text reader is the one thing here that
 * can produce a confidently wrong page.
 */

export class TheRustDomainHasNotBeenReadYetError extends Error {
	constructor(a_project) {
		super(
			`scripts/read_the_rust_domain.mjs does not read a Rust domain yet. It exists so the tests ` +
				`in test/the_rust_domain_is_what_the_page_says.test.mjs can fail on an assertion about a ` +
				`project rather than on the absence of this file. The project asked about was ${a_project}.`,
		);
		this.name = "TheRustDomainHasNotBeenReadYetError";
	}
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

/** Ask the reader about a project, and print the answer, or print why there is none. */
export function read_the_rust_domain(a_project) {
	throw new TheRustDomainHasNotBeenReadYetError(a_project);
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
