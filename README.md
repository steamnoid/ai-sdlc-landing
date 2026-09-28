# AI SDLC — the page for the family

**The page:** <https://steamnoid.github.io/ai-sdlc-landing>

Four repositories building the same AI SDLC system in two languages, from the same six stages
and the same table of legal moves. This repository is the page that says so — and every fact
on it was read out of those four rather than typed here.

```text
ai-sdlc-os           Python  the original; the only one that has delivered a real pull request
ai-sdlc-os-plus      Python  the same system with the glossary written before the code
ai-sdlc-app-rs       Rust    a port of ai-sdlc-os with no agent framework at all
ai-sdlc-app-rs-plus  Rust    the same system in a workspace, domain first, wiped and restarted
```

## The two rules

> **A fact is generated, or it is not on the page.**
>
> **A project is read, or the page says in words that it could not be.**

The first is the rule the page this grew out of has. The second exists because this page
serves four repositories rather than one: a page about one can treat a failed run as fatal,
while a page about four would go down for everybody because one checkout would not clone.

**A third thing this repository is for, which is not on the page:** the documents of the four
are stale in about fifteen places, and the findings are in
[`docs/what-the-documents-claim.md`](docs/what-the-documents-claim.md) — held against the
trees by a test on every run, so the document can understate a project and cannot overstate
one.

## Working here

```bash
npm ci                     # the lockfile is committed
npm test                   # the collectors' own tests, and a build of the page
npm run collect            # read the four projects, run their suites, write the state
npm run build              # the page, from the state
./scripts/gate             # all of it, in that order, stopping at the first refusal
```

`npm run collect` reads `../ai-sdlc-os` and its three siblings as they are on this machine.
To read the branches as everybody else sees them, pass `--where` a directory of checkouts —
which is what the workflow does, because a page that describes a working tree somebody is
halfway through changing is describing something else.

**The default run reaches no network.** GitHub is not asked, and the page says which fields
could not be read. A build that cannot be run offline cannot be checked.

## How it is put together

```text
src/page/what_the_page_says.mjs         a fact becomes a sentence, and nowhere else
src/page/what_the_family_declares.mjs   the one verdict that is about all four at once
src/page/what_the_documents_says.mjs    a phase's mark, a licence, and the absence of a table
src/page/what_the_lineage_says.mjs      which project came from which, and on what evidence
src/page/what_a_claim_is_worth.mjs      a document's claim, judged against a tree

scripts/ask_the_python_domain.py        imports a Python project's own code
scripts/read_the_rust_domain.mjs        reads a Rust project's source, and refuses rather than guesses
scripts/read_a_suite.mjs                runs a project's own suite, and stores the command
scripts/ask_the_family.mjs              all four, one state, written once at the end
scripts/compare_the_states.mjs          what differs, and what is only about the run
scripts/has_anything_changed.mjs        whether the live site already says this

src/state/the_family.json               the only bridge — a build artifact, never committed
```

## What this repository will not do

**It will not derive a name.** A Rust stage is `Stage::Idle` in the source and `IDLE` in the
specification, and the two are not related by a rule anybody can rely on — so every written
name on the page is a string literal lifted out of that project's own `match`, and
`a_stage_name_was_derived` is a fact the page prints beside the table it drew.

**It will not draw a lineage nothing records.** Three of the four projects write about a
sibling project and never name it. The page says that, and draws its two edges from the one
file that does record them.

**It will not report a phase's state from a marker's absence.** Two of the four mark no phase
done at all, and a reader that read "done" out of a strikethrough would have reported ten
phases as undelivered for each of them.

**It will not publish a page that says what it does not know.** A project that could not be
read keeps its place on the page with the reason and no domain at all.

## The rule the page is measured against

`test/the_page_says_only_what_the_state_says.test.mjs` builds the page, reads it as a reader
reads it, and uses the state to ask whether what came out could have been typed. One test for
each way a page gets that wrong: a hand-typed stage, a hand-typed count, a hand-typed
project, a hand-typed verdict, and a number welded to a word by a template line break.

## Licence

MIT. See [`LICENSE`](LICENSE).
