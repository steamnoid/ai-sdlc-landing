# A rust project

A fixture. It exists so that the collectors can be run against a tree that is committed.

**Its backlog marks nothing at all, and that is on purpose.** Two of the four real projects
mark no phase either way, and the page has a sentence for exactly that case — a sentence that
was untested, because every fixture this repository had carried no `AGENTS.md` at all and the
page's backlog block had therefore never been built in a test.

# The domain in one page

```text
STAGE  IDLE | AWAITING_AGENT_PICKUP | IN_PROGRESS_BY_AGENT
       | AWAITING_HUMAN_APPROVAL | READY | DONE
```

# Backlog

| Phase | Slice | Gate |
|---|---|---|
| 0 | the workspace, the glossary, and the gates themselves | every gate fails on its own fixtures first |
| 1 | the domain: entities, the state machine, approval | a seventh `Stage` does not compile |
| 2 | `aisdlc-outside`: GitHub | a real push to a real fork |
| 3 | the lifecycle: eight gates, one router, suspend and resume | no route without a destination |
