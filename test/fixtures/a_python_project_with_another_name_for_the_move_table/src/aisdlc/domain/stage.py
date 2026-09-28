"""Three stages, none of them the two of the other fixture, and none of them the six
of the real family."""

from enum import Enum


class Stage(Enum):
    BORROWED = "BORROWED"
    KEPT = "KEPT"
    RETURNED = "RETURNED"

    @property
    def the_agent_must_be_holding_it(self) -> bool:
        return self is Stage.BORROWED
