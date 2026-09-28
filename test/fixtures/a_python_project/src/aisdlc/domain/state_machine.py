"""The table of legal moves, and the two questions about who holds a stage.

Named `LEGAL_TRANSITIONS`, which is one of the two names the family uses for it. The
other is the second fixture, and a reader that only knows this one would report the
wrong name for half the family.
"""

from aisdlc.domain.stage import Stage

STAGES_WITHOUT_AN_AGENT = (Stage.DEPARTED,)
STAGES_WITH_AN_AGENT = (Stage.ARRIVED,)

LEGAL_TRANSITIONS: dict[Stage, tuple[Stage, ...]] = {
    Stage.ARRIVED: (Stage.DEPARTED,),
    Stage.DEPARTED: (),
}
