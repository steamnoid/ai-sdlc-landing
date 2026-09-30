# A python project

A fixture. It exists so that the collectors can be run against a tree that is committed, and
so that the page's reading of a backlog can be tested without four real repositories beside
this one.

Nothing here is a claim about a real project. The stages, the moves and the table below are
written to be read, not to be believed.

# The domain in one page

```text
STAGE  IDLE | AWAITING_AGENT_PICKUP | IN_PROGRESS_BY_AGENT
       | AWAITING_HUMAN_APPROVAL | READY | DONE
```

# Backlog

| Phase | Slice | Gate |
|---|---|---|
| 1 | ~~the domain: entities, the state machine, approval~~ **done** | 36 stage/agent pairs crossed, and a seventh `Stage` does not compile |
| 2 | ~~`tools` — git, docker, filesystem, github~~ **done**; **exposure through MCP is not** | every tool has typed in and out, and the container command is asserted on its arguments |
| 3 | the interface: a gate is decided by a person and recorded as a person | a decision made by an agent is refused by name |
| 4 | the whole run, on a real model and a real repository | one end-to-end run produces a traceable pull request |
