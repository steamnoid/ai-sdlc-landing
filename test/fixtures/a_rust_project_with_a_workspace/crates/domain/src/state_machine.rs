//! The moves, and no constant anywhere saying who holds a stage.

use crate::Stage;

/// The stages a work item at this stage may legally move to.
pub fn legal_transitions_from(from: Stage) -> &'static [Stage] {
    match from {
        Stage::Filed => &[Stage::Reading],
        Stage::Reading => &[Stage::Answered],
        Stage::Answered => &[Stage::Forgotten],
        Stage::Forgotten => &[],
    }
}
