"""Four stages, and each one says for itself whether an agent must be holding it.

**The family has two ways of saying this and both of them are in it.** `ai-sdlc-os`
declares two tuples in the state machine, and `ai-sdlc-os-plus` makes it a property of
the stage with the constant declared after the enumeration — which is what this file
does, because that ordering is the shape a reader has to cope with. A collector that
knows one of the two reports the other as a stage nobody holds, and reports it with
confidence.

The stages are named so a reader that answered from another fixture is caught: nothing
here appears in the other two trees.
"""

from enum import Enum


class Stage(Enum):
    HELD = "HELD"
    FREED = "FREED"
    ARCHIVED = "ARCHIVED"
    LOST = "LOST"

    @property
    def the_agent_must_be_present(self) -> bool:
        """Whether an agent must be holding work at this stage. One of the four does."""
        return self in THE_STAGES_AN_AGENT_MAY_BE_HOLDING


THE_STAGES_AN_AGENT_MAY_BE_HOLDING = (
    Stage.HELD,
)
