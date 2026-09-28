"""The table of moves, and no tuple saying who holds a stage at all."""

from aisdlc.domain.stage import Stage

THE_LEGAL_MOVES_FROM_EACH_STAGE: dict[Stage, tuple[Stage, ...]] = {
    Stage.HELD: (Stage.FREED,),
    Stage.FREED: (Stage.ARCHIVED,),
    Stage.ARCHIVED: (Stage.LOST,),
    Stage.LOST: (),
}
