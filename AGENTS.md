# AGENTS.md — `ai-sdlc-landing`

**This repository is a view.** The page at `steamnoid.github.io/ai-sdlc-landing` says
things about four other repositories, and every thing it says about them is read out of
them by a program rather than typed by a person. There are two rules here, and the rest of
this file is about how to keep them.

---

# The two rules

> **A fact is generated, or it is not on the page.**
>
> **A project is read, or the page says in words that it could not be.**

The first is the rule the page it grew out of has, unchanged. The second exists because
this page serves four repositories rather than one, and the first rule alone does not
survive the difference.

**What is generated, and from where.**

| On the page | Read from |
|---|---|
| the stages, the roles, the table of legal moves | the project's own code — imported for Python, read from source for Rust |
| the name the move table goes by | whichever name that project declares it under |
| where a gate's answer leads | the router's own mapping, where a router exists |
| the agents, the artifacts, the errors | the glossary, which is each project's source of truth for naming |
| the test count, and what it printed | the suite, run in the build, output byte for byte |
| the commits, and how the RED/GREEN pairing holds up | `git log` |
| the phases, and what is not built | the project's `AGENTS.md`, and the disk |
| the licence, the stack, the commands | `LICENSE`, `pyproject.toml` / `Cargo.toml`, `README.md` |
| who named which project | `SOURCES.lock`, and the licence headers |
| the CI status | the check runs on the tip commit — **including that there are none** |

**What is written by hand, and why that is allowed.** The pitch, and who to write to. No
test in another repository could refute a sentence about why the work matters, so
generating it would be theatre. A *fact* can be refuted, and those are the ones that get
read.

## Why the second rule is a rule and not a convenience

The page this one grew out of serves one repository, and there a failed run means a stale
site — bad, and not a lie. This page serves four, in two languages, one of them with a
`sources.lock` and two of them with histories of their own. Something will fail to
answer: a checkout that will not clone, a toolchain that will not build, a project whose
source moved under the reader that was pointed at it.

**A page that renders four empty cards has claimed that the family has nothing to
report.** Every one of the four has a stage table, a history and a licence. So an absence
is a value with a reason, and the reason is printed — the same rule
`what_the_deliveries_say` already applies to a pull request whose body could not be read.

---

# The shapes a page gets wrong, and the tests for each

| It looks like | Which is not | Where it is decided | Where it is tested |
|---|---|---|---|
| `nothing to say` | four projects with nothing to show | `src/page/what_the_page_says.mjs` | `test/the_page_says_it_has_nothing_to_say.test.mjs` |
| green | a suite that printed a lot of passes | same | same, and `what_the_page_says.test.mjs` |
| not run | a suite that failed | same | same |
| no history | a project with no commits | same | same |
| no workflow | a repository whose CI is green | same | same |
| unread | an answer of no | same | same |
| a claim | a finding — the two are kept apart | `docs/what-the-documents-claim.md` | `test/the_documents_agree_with_the_tree.test.mjs` |

**The suite is green when it exited zero, and not when it passed a lot.** A run that
printed `1 failed, 449 passed` is a run that failed. A run that was never asked to run is
neither, and it says which flag would run it.

**A refusal is a value, not an absence.** Where the state says a fact could not be read,
the page says so in words. A field that is simply missing on a page reads as a project
with nothing to report, which is the one thing a page about unfinished work must never do.

**The state file is written once, at the end, or not at all — per project.** A collector
that refuses halfway through one project leaves no state for that project, so a page can
never be built from half an answer about it. The other three are unaffected: each
project's answer is all-or-nothing, and the file is written once over all four.

---

# Working here

```bash
npm ci                     # the lockfile is committed; `npm ci` needs it
npm test                   # the collectors' own tests, and a build of the page
npm run collect            # read the four projects, run their suites, write the state
npm run build              # the page, from the state
./scripts/gate             # all of it, in that order
```

**The default run reaches no network.** GitHub is asked only when `--github-api` is
named, and the page then says which fields it could not read. A build that cannot be run
offline cannot be checked.

**Read the working tree, or read what is published.** `../` reads the checkouts that are
already there, which is what you want while you are changing a project. `--clone` reads
the branch as everybody else sees it, which is what the page is about.

## What not to do

- **Do not commit `src/state/the_family.json`.** It is a build artifact, and the first
  deployment of the page this one grew out of published a stale one precisely because it
  was there to be used.
- **Do not type a fact into `src/pages/index.astro`.** The test that catches it is
  `test/the_page_says_only_what_the_state_says.test.mjs`.
- **Do not add a field to the state and print it raw.** Decide what it is allowed to say
  first, in `src/page/what_the_page_says.mjs`, and test that decision.
- **Do not make a missing document render as an empty section.** A document that has been
  reorganised is refused by name. An empty section reads as "nothing to report", which is
  the one answer a reorganised document gives by accident.
- **Do not read a phase's `done` out of a strikethrough.** Two of the four projects mark
  a finished phase with `~~…~~` and two mark nothing at all, and a reader of a plain row
  that reports "not done" is reporting a marker's absence as a fact about the work.
- **Do not reach for the network to make a test pass.** Inject the address; a test that
  needs a network is a test that was not run.
- **Do not clone one commit deep.** It is the fast way to get a build and it reports a
  history of one commit, so the page would state a year of work as a single commit in
  total confidence.

---

# The parts that are not built yet

Written down because a repository that lists its intentions next to its code is a
repository whose reader can tell which is which.

| | |
|---|---|
| the domain of a Python project | slice 1 — the import, and the refusals |
| the domain of a Rust project | slice 2 — read from source, refusing rather than guessing |
| the verdict about the family | slice 3 — the one thing that could not exist if the projects were unrelated |
| the documents | slice 4 — glossary, phases, licence, commands |
| the suites | slice 5 — four runners, two toolchains, hourly |
| the lineage | slice 6 — `SOURCES.lock` and the licence headers |
| the eight sections of the page | slice 8 |

---

# Where the rest of the rules live

The three rules this whole family of repositories is built on — strict TDD, readability
over cleverness, and code that mirrors the domain — are in the `AGENTS.md` of
[`ai-sdlc-os`](https://github.com/steamnoid/ai-sdlc-os), and this repository is written
against them rather than restating them. The two rules above are the only ones local to
it, because they are the only two a view of other people's work needs.
