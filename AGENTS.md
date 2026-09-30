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

**A fresh clone of this repository on its own runs one test red, and it is refusing.**
`test/the_documents_agree_with_the_tree.test.mjs` checks that what the documents claim about
the family is what the family's trees hold, so it needs the four projects checked out beside
this one. It says so in its failure message rather than passing, and a green run in its place
would have meant nothing — which is the arrangement working, not a bug to fix.

**It used to be four, and two of them were a test that had nowhere to look.** The page's own
test — the one that asks the built page whether it says only what the state says — read
`src/state/the_family.json` and refused to run without it. Every assertion in it is relative
to a state, and relative to a state is something a test brings or something it can only hope
for; it was a test that ran on the laptop where a collector had last run and nowhere else. It
now collects the four committed fixture trees, which is a real reading by the real collector
and is the same on every machine.

`test/the_page_says_it_has_nothing_to_say.test.mjs` carried a constant naming that same path
and never used it, and a guard against tests reaching into `src/state` found it on the run
after it was added. That is the second time a guard has earned its keep here by failing on
code written minutes earlier, which is the argument for writing them.

**That is a decision and it costs something.** The gate is not runnable on a machine that
does not have the family, so a contributor without it has no cheap way to check a change. It
is the right way round for a page whose whole argument is that a thing which was not read is
printed as not read: the alternative is a gate that reports green about a family it never
looked at.

**`npm run build` has no such requirement, and used to.** A fresh clone died with `ENOENT`
writing the stand-in state, because `writeFileSync` does not make the directory it writes
into and `src/state` is gitignored — in the one case the stand-in existed for. The comment
above that line said the fresh clone could not be built and then did nothing about it.

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

## The skip has never fired, and every time it has not fired it was right

**Measured on the 30th, after an hour spent assuming otherwise.** Every CI run reports
`has_changed=true`, and the suspicion was that a field which changes on every run is being
compared — the same shape as the duration that lived inside the suite's verdict sentence and
was fixed earlier today.

The measurement says the suspicion was wrong. Two full collects of all four projects, run one
after the other, differ in 21 fields and **every one of them is a real change**:

| | first collect | second |
|---|---|---|
| `ai-sdlc-os` | 1063 passed, 1 failed | 1064 passed, 0 failed |
| `ai-sdlc-os-plus` | 317 passed | 314 passed |
| `ai-sdlc-app-rs` | 590 passed, 9 failed | 599 passed, 0 failed |
| `ai-sdlc-app-rs-plus` | 140 passed, 2 failed | 142 passed, 0 failed |

Somebody was fixing these repositories while the two collects ran. `the_build.read_at` and the
rest are correctly ignored, and the suite's output is already read through a rule that takes
the duration out of it — so the mechanism works and the family is moving several times a day.

**The two projects whose suites were stable confirmed it independently.** `ai-sdlc-os` run by
hand twice printed `1064 passed, 1 skipped, 149 deselected` both times, and the only difference
between the two outputs in their entirety was `in 17.62s` against `in 17.21s` — a difference
the comparison already normalises away.

**The thing worth keeping is not the finding, it is the cost.** An hour went into looking for a
bug in the skip because the number looked wrong, and the number was right. The only thing that
would have answered it sooner is running the thing twice and reading the counts, which is what
should have happened first.

## Five numbers in this page's own prose, and the rule they produced

| the sentence | what it claimed |
|---|---|
| "One domain, four times over" | four projects were read |
| "Two of the four are imported … two are read out of Rust source" | two and two |
| "The same three things, said four ways" | four projects to compare |
| "Two of the four projects mark nothing" | which two |
| "Three of these four write about a sibling project without saying which one" | which three, and whether they name it |

**Five hand-typed numbers in a page whose argument is that every number on it was read out of a
repository.** Four became false the day a repository answered 404 — under a header that says
"Read from 3 of 4 repositories". The fifth was false on the live site from the day it was
written: one of the four has any lineage at all, and that one **names** its source three times
over, so both the count and the clause after it were about no project on the page.

**All five are counted from the state now, and none of them is a number somebody typed.**
`test/the_page_says_only_what_the_state_says.test.mjs` reads the page with one, two, three and
four projects unreadable and demands that the sentences follow.

**The rule that came out of it: this page may not contain a number about the family that it did
not count.** Prose about the family is fine, and most of this file is prose about the family.
A digit in a sentence above a table is a claim, and a claim in a paragraph is exactly as stale
as one in a cell.

**And the counts are read from the right object, which was its own bug.** The count of projects
that mark nothing is read out of the raw state and not out of the family's projection: the
projection carries what a project *declares* — stages, roles, moves — and carries no documents,
so counting marks there found zero and printed "every project that could be read marks
something" on a page where two of the four mark nothing. **A number read from the wrong object is
not a number, and this one erred towards the nicer sentence.**

## The section that is usually absent

**`Since the last read` prints nothing, and that is the correct state of it today.** It names
the items of the family's own lists that stopped being owed since the reading the site last
published, and the last three runs found none in any of the four projects — because nobody has
struck a line in that time. The section, and its link in the navigation, both appear only when
there is something under them, because a heading with nothing under it reads as a section that
was considered and found empty.

**For two of the four it will never appear.** `ai-sdlc-os-plus` and `ai-sdlc-app-rs-plus` mark
no phase either way, so nothing in their lists can move. That is not a limitation of the section;
it is the finding the page already prints for them, with the place a mark would go.

**A difference is not a movement, and the two answers come from one fetch.** The run re-reads
the family and most of what changed is suite counts, licences and commit pins — sixteen facts on
the last run, none of them work. `scripts/what_differs_from_what_is_published.mjs` answers both
"should this be published" and "what stopped being owed" from a single comparison of the site
against this run, because asking twice would mean fetching twice with a deployment landing
between the calls.

---

# What the schedule actually does, measured rather than assumed

**An earlier version of this section was worse than having none, and it is worth saying how.**
It read: *"`17 * * * *` fires between one and two hours late — one that should have run at
19:17 started at 23:19, and one that should have run at 21:17 started at 05:47"* and concluded
the page publishes every two hours. Both correspondences were invented. Nothing said which
cron slot a run was answering, the two runs were five and a half hours apart, and a rate was
built out of two points by choosing which hour each one belonged to. A confident number
nobody measured is worse than a missing one, because the missing one gets looked up.

**What was measured, with the window it was measured over — twice, and the second time
differed.** The first measurement was taken eighteen hours after the repository was created:
seventeen hourly slots came due and **two ran**. It was written down as a small sample with an
instruction to measure it again rather than believe it, and the point of writing it that way was
to make the re-measurement a thing the next reader could do.

The second window gives eight consecutive scheduled runs and the gap between each of them:

| | |
|---|---|
| 6h 28m | |
| 7h 10m | |
| 5h 41m | |
| 4h 19m | |
| 3h 09m | |
| 6h 28m | |
| 7h 18m | |

**Mean five hours forty-seven, and a range from three to seven.** **None of them was dropped.**
Every one arrived; all of them were hours late, by amounts that do not look like a queue.

**This file said "roughly every four to five hours" after five samples, and it was wrong by
about an hour** — the same fault as the "two hours" it replaced, in the same place, measured the
same careless way. Eight samples put the mean at 5h47m. It is written here as a range because a
range is what was observed, and the next reader is expected to add to it rather than to round
it.

**What the honest reading is, and what it is not.** Not "GitHub loses most of them": nothing is
lost. Not "the schedule is hourly": it has never been hourly in any window measured here. It
runs **every five to seven hours**, and the page says on its own face when it last read the
family, so a reader is never misled by how old it is.

**One of the five failed, and it is worth saying which job.** `Keep the schedule alive` was red
on the 08:38 run with *"the limit and the commit did not arrive"*, and it is the sixth run in a
row that pushed a keepalive commit — a race between two runs committing to the same branch,
caused by the bug the entry above describes. Nothing about the schedule, and everything about a
defect the schedule happened to walk into twice.

**The page says when it last read the family** — `Read from 4 of 4 repositories, 2026-09-29
10:42 UTC` is on it, and in the sentence about what a reader may check. That is why the
cadence does not have to be right to be honest: a reader can see the age of the page rather
than trust a claim about it. **This paragraph is the claim, and it is the one that goes
stale.** Eighteen hours is a small window and a schedule meant to run for years is not
judged by it, so the honest statement is what was seen, over how long, and the instruction to
a later reader is to measure it again rather than to believe it.

**The argument that hourly beats daily has stopped holding and is not repeated here.** It
rested on a dropped job costing an hour of staleness rather than a day. If most of them are
dropped then a dropped job costs five, and picking one interval over another buys nothing
that the page's own provenance line does not already give the reader for free.

**A page that updates itself still has to have a way not to.** The skip is worth keeping for
the case where nothing changes, and this repository did not have one that worked: the suite's
own duration was inside the sentence explaining its verdict, so every state differed from the
last one and the skip could never fire. That is the failure the skip exists to prevent,
prevented by the thing it was comparing.

**The two toolchains are cached, and the saving is smaller than expected: thirty seconds.**
Measured on consecutive runs, three minutes forty-seven cold and three minutes seventeen with
all three caches restored — the uv tree at 77 MB, the two Rust workspaces at 192 MB, the
node modules at 50 MB. What the cache saved was the compilation, and what the run mostly
waits for is the four test suites actually executing. It is kept because thirty seconds every
five to seven hours is free, and it is written here because the estimate this repository started
with was a guess and the sentence above is not.

---

# Three ways a green run publishes nothing, and what they had in common

All three passed every test and reported success, and all three are the same mistake: a
condition in a place nothing evaluates until the day it matters.

| | |
|---|---|
| `collect` never declared the `outputs` `build` reads | `build` skipped itself, `deploy` was skipped as its dependency, and the run was green having published nothing |
| `build` was guarded on `has_changed` alone | a person pressing *Run workflow* got a green first stage and then silence, because the state was identical to the published one — which is the normal state of a page that is working |
| `keepalive` needed `deploy` | the job that stops GitHub disabling the schedule after sixty quiet days could only run when something had changed, and nothing changing is what a keepalive exists to survive. It entered on its first run by luck, because that run found changed facts |

**The lesson is not "add a test". Two of the three were found by reading, and one by a real
run.** It is that **anything a green run does not execute is not tested**, and that the
places where that is true — a workflow's conditions, a YAML shell line, a job that only runs
on a schedule — are exactly the places a rescue mechanism lives.

**What this repository does about it now**, beyond the tests in
`test/the_workflow_publishes_the_page.test.mjs`:

- **A shell line in a workflow is a script in `scripts/`.** The day count was an `awk` one-liner
  calling `mktime` with seven arguments where gawk takes six, and it failed on the first
  scheduled run that reached it — having been in the file since the repository was pushed. It
  is now `scripts/how_many_days_since_the_last_commit.mjs`, tested at 44 and 45 days because
  those are the two numbers the workflow acts on.
- **A default that a test cannot replace is a constant wearing a default's name.** A project's
  suite command is declared per project, not looked up from its language, so that a test can
  run a suite at all.
- **A test that finds nothing to check passes.** Four of them in this repository's history did,
  each fixed by asserting the count before the loop: a regex looking for a single quote where
  JSON produces none, a heading test matching a navigation link, a suite verdict reading a
  field nobody was given, and a comparator asked to tolerate a value its producer should not
  have written.

---

# Two ways the keepalive had never been kept alive

The table above is about runs that go green having published nothing. These are the other kind,
and they are worse, because a run that has never happened cannot report anything at all.

**The job could not push the commit it existed to push.** The workflow grants `contents: read`
to everything, and the keepalive ran `git push` — so the one job whose entire purpose is a commit
had no token to make one with. It had already failed twice, both times on the `awk` above, and
**fixing the `awk` was credited with repairing the job.** That left the second reason it could
not work sitting in the same file, and no run could have found it, because the `git push` it
blocked is the reason the job rarely runs.

**The branch was unreachable for forty-five days, so the day the keepalive was most needed
would have been the first day anybody saw it.** The count was a script by then, and the decision,
the identity, the commit and the push were still four lines of shell in the YAML — the same rule
this file writes, applied to half of what it named.

Both are fixed and both are now observable: `scripts/keep_the_schedule_alive.mjs` is the whole of
it, and `test/keep_the_schedule_alive.test.mjs` builds a checkout with a bare remote, ages its
first commit, and asserts that a commit **arrived at the remote** rather than merely appearing
locally. That distinction is the entire purpose. GitHub watches the repository and not the runner,
so a commit that stays in the checkout is not activity and keeps nothing alive.

**And it is now exercised, which took making it reachable.** A dispatch carries *the number of
days of silence that counts as long enough*, defaulting to 45, and the keepalive runs on a
dispatch that fills it in. Typing `0` runs it now. This is a number rather than a yes because a
boolean has to become a number by an expression, and the first one was
`inputs.x && 0 || 45` — where zero is the falsy half, so it produced forty-five. **The run
proved it:** the job went green, the script ran, and the log said *the limit is 45, so the
schedule pushed nothing*. A green job that did the wrong thing, caught by reading its own log.

Typed `0` on the 29th, and `origin/main` carries `01f095d` — *the schedule kept itself alive*,
by `github-actions[bot]`, touching no file. That is the branch, on a real runner, with a real
token, forty-five days before the schedule would have needed it.

**A test checked that the input's name was in the environment and was satisfied by a name that
never reached anything.** A truthiness bug in a value that is usually forty-five is invisible
until somebody asks for zero and the run quietly does nothing. So the test now requires the
environment to be exactly the input, and the workflow has no expression between what a person
typed and what the script acts on.

---

# The parts that are not built yet

Written down because a repository that lists its intentions next to its code is a
repository whose reader can tell which is which. **The list is kept short on purpose**: a
section that grows as the project grows is a section that gets skimmed, and this one is
skimmed precisely when somebody is about to add the thing it does not mention.

| | |
|---|---|
| the suites, per project kind | **built** — `uv run pytest -q` and `cargo test --no-fail-fast`, both run in the build |
| the lineage | **built** — the three edges the family records, and the three projects that record none |
| the page | **built** — the family, the one domain, the four conventions, the suites, the phases, the lineage |
| a share card | not built. One was copied from the page this grew out of and removed: it said "ai-sdlc-os" in that project's colours and nothing referenced it. When one is drawn it carries no numbers |
| the GitHub API | not read. Stars, forks, check runs and pull requests are on the page this grew out of and not on this one, because a claim that needs a network stops being checkable offline |
| `github.read_file`-style reading at a ref | not built, and not wanted here — this page reads checkouts, not revisions |
| per-phase delivery dates | not built. The phases are read and their marks reported; nothing says when a phase moved |
| an activity history | not built. The commits of the four are not on the page, because a page that rebuilds hourly would republish a history it read fresh each time and the reader would learn nothing from the difference |

**And the two things that are deliberately not here.** A `SOURCES.lock` for this page, because
it is a view and pins a *source* — the family itself is four changing repositories, and a hash
of any one of them would be a number that is wrong the moment a cycle lands. And a formatter in
the gate, because a check with no rule behind it is this repository's own argument turned
round: a rule with no gate is a wish, and so is a gate with no rule.

---

# What the four projects said, and what their trees hold

**Kept here rather than on the page, because the page may only print facts.** The full
version, held against the trees by a test on every run, is
[`docs/what-the-documents-claim.md`](docs/what-the-documents-claim.md). In short:

- **All four declare the same domain** — six stages, five roles, seven legal moves — and say
  it four different ways. That is the finding the page exists to publish.
- **Three of the four name no other project.** They write about a sibling project and do not
  say which one. `ai-sdlc-app-rs` is the only one that records where it came from.
- **Two of the four mark no phase done at all**, while phases 0 to 2 of both are delivered.
  A reader that read a phase's state out of a strikethrough would have reported ten phases
  each as undelivered, which is the one direction of error a reader is least likely to check.
- **The three `+`-shaped READMEs are stale**; `ai-sdlc-os`'s is not. The difference is which
  project has a test that compares the two.

---

# Where the rest of the rules live

The three rules this whole family of repositories is built on — strict TDD, readability
over cleverness, and code that mirrors the domain — are in the `AGENTS.md` of
[`ai-sdlc-os`](https://github.com/steamnoid/ai-sdlc-os), and this repository is written
against them rather than restating them. The two rules above are the only ones local to
it, because they are the only two a view of other people's work needs.

**Two habits this repository's own cycles needed, recorded because both cost a cycle here.**

**A shell that accepts the absence cannot prove the rule.** The first RED of every cycle in
this repository failed on a missing file, and twice one of its tests was *green* for that
reason — a reader that prints nothing and a reader that leaves no bytecode behind are both
true of a file that was never written. The collector is now a refusing shell first, and the
tests fail on assertions.

**A count that understates a failure is a count nobody should read.** A throw in a `describe`
body aborts its suite, its tests never run, and this runner printed `19 passed, 0 failed`
with a red suite on the screen. The exit code was correct and is the only thing the gate
reads; the tests now ask inside each test so the number a person reads is the number that
happened.
