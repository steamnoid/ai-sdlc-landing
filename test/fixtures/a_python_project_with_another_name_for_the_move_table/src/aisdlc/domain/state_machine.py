"""The table of legal moves under the family's other name, with no router beside it.

A project with no router is a real shape in the family, and the page must print that it
has none rather than report an empty mapping that looks like a project whose router
decides nothing.
"""

from aisdlc.domain.stage import Stage

STAGES_WITHOUT_AN_AGENT = (Stage.KEPT, Stage.RETURNED)
STAGES_WITH_AN_AGENT = (Stage.BORROWED,)

THE_LEGAL_MOVES_FROM_EACH_STAGE: dict[Stage, tuple[Stage, ...]] = {
    Stage.BORROWED: (Stage.KEPT, Stage.RETURNED),
    Stage.KEPT: (Stage.RETURNED,),
    Stage.RETURNED: (),
}
