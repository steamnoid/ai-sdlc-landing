"""A domain with a stage set of its own, so a reader that answers with another
project's stages is caught.

The names here are deliberately not the six of the real family. A test that checked
for `IDLE` and found it would pass against a reader that ignored the tree it was
pointed at and answered from somewhere else, because the real family has a stage
called `IDLE` and the family is what this repository is pointed at most of the time.
"""

from enum import Enum


class Stage(Enum):
    ARRIVED = "ARRIVED"
    DEPARTED = "DEPARTED"

    @property
    def the_agent_must_be_holding_it(self) -> bool:
        return self is Stage.ARRIVED
