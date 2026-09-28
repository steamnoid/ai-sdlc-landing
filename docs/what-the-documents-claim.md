# What the documents say, and what the trees hold

**The page may only print facts, so the findings about the *documents* have nowhere to live
on it — and they are the most useful thing this repository found.** This file is where they
go, and it is checked against the four trees on every run of the suite.

**A claim here may be wrong in one direction only.** It may *understate* a project, and the
suite stays green. It may not *overstate* one, and
`test/the_documents_agree_with_the_tree.test.mjs` turns the suite red. That is what makes a
hand-written document possible in a repository whose whole argument is that prose drifts
quietly: understating is the harmless direction, because a reader who believes less is not
misled.

Every claim below is a claim a project makes about itself, in its own `README.md`, and a
verdict from counting the tree it is about. A reader who disagrees with one can go and count.

---

## The four projects, and what their own documents say

- `ai-sdlc-os-plus` claims that there is no production code here yet. **Refuted.** The project
  holds 19 modules and about 1,500 lines under `src/aisdlc/`, a domain with a transition table,
  an approval protocol, a model factory, a clone tool and a discovery agent. It is also two
  commits behind its own tree: a router's test is on disk importing a module that is not
  written yet, which is a RED in flight.
- `ai-sdlc-app-rs` claims that phase 1 and the first two tools of phase 2 are built and the
  pipeline is not. **Understated, and left as it stands.** The tree holds 64 modules and about
  12,400 lines, 63 test files with 480 test functions, all 15 tools, 18 agents, a graph, a run
  and a binary. The sentence is not false — the pipeline has never run against a real model —
  and it is not the whole truth either.
- `ai-sdlc-app-rs-plus` claims that `aisdlc-domain` is still empty on purpose. **Refuted.** The
  crate holds 11 modules and about 980 lines, and every type the specification lists is in it.
  The same README says "twenty-seven tests" where the tree holds 242.
- `ai-sdlc-os` is the one whose documents match its tree. **Left as it stands**, and that is
  worth saying: the same author wrote a README that ages in one project and not in another, and
  the difference is which one has a test that compares the two.

## What each of the four declares about the same domain

**All four declare the same six stages, the same five roles and the same seven legal moves.**
That is not a resemblance — it is the finding the page exists to publish, and it is computed
from two Python projects' imported code and two Rust projects' source rather than typed here.

**And they say it four different ways**, which is what a family overview is for:

| project | the move table is called | a stage is written by | who holds a stage is said by |
|---|---|---|---|
| `ai-sdlc-os` | `LEGAL_TRANSITIONS` | a Python enumeration's value | two tuples in the state machine |
| `ai-sdlc-os-plus` | `THE_LEGAL_MOVES_FROM_EACH_STAGE` | a Python enumeration's value | a property on the stage |
| `ai-sdlc-app-rs` | `legal_transitions_from` | a `name()` that matches every stage | two constants beside the table |
| `ai-sdlc-app-rs-plus` | `legal_transitions_from` | a `Display` that matches every stage | a method on the stage |

**One specification, four conventions, and no shared file** — the two `+` projects each write
about a sibling project and neither names it, and no `SOURCES.lock` ties them to anything.

## What the four say about their own progress

| project | phases its backlog declares | phases carrying a mark saying they are done |
|---|---|---|
| `ai-sdlc-os` | 12 | 3 |
| `ai-sdlc-os-plus` | 10 | 0 |
| `ai-sdlc-app-rs` | 15 | 4 |
| `ai-sdlc-app-rs-plus` | 10 | 0 |

**The two rows with no marks are not projects that have done nothing.** `ai-sdlc-os-plus` has
its domain, its approval gate, its model factory, its clone tool and its discovery agent;
`ai-sdlc-app-rs-plus` has 242 tests, 18 gates and every domain type. **Both projects simply
stopped marking their phases**, and a page that read a phase's state out of a strikethrough
would have reported ten phases as undelivered for each of them — which is the one direction of
error a reader is least likely to check, because "not done" is what a phase usually is.

The page therefore prints a phase's verdict *and* the mark the verdict came from, and a phase
with no mark says it is marked in neither way.

## What the family agreed to disagree about

**`ai-sdlc-app-rs` is the only one of the four that records where it came from**, and it
records it three times over: a pin to `ai-sdlc-os` at commit `98fab0f` on
`phase-8-analysis-pipeline`, a design reference to this page's own predecessor at `f44cf12`,
and a line in its own licence.

**A pin is a promise about a moment, and the moment is what the page prints.** It cannot
re-hash a sibling's tree from here, so it reports the commit and reports that it did not
check — because "read from this commit" and "still matches it" are different claims and a
reader of a family overview is exactly the person who needs the difference held open.

## How much of this is checked, and by what

| this file's claim | checked by |
|---|---|
| a project's own claim is refuted or true | `what_a_claim_is_worth.mjs`, run by `the_documents_agree_with_the_tree.test.mjs` |
| the four declare the same domain | `what_the_family_has_in_common.mjs` |
| each declares it its own way | `the_python_domain_is_what_the_page_says.test.mjs` and `the_rust_domain_is_what_the_page_says.test.mjs` |
| the phase counts and their marks | `the_documents_say_what_the_tree_holds.test.mjs` |
| the lineage | `the_lineage_is_where_a_file_says.test.mjs` |

**And the numbers on the page itself** are checked by
`the_page_says_only_what_the_state_says.test.mjs`, which builds the page, reads it as a reader
reads it, and uses the state to ask whether what came out could have been typed.
