//! The biconditional invariant: an agent is present if and only if the stage is one
//! an agent owns.

use crate::domain::Stage;

/// The stages at which nobody holds a work item.
pub const STAGES_WITHOUT_AN_AGENT: [Stage; 2] = [Stage::Idle, Stage::Done];

/// The stages an agent owns while the work item is there.
pub const STAGES_WITH_AN_AGENT: [Stage; 2] = [Stage::AwaitingAgentPickup, Stage::InProgressByAgent];

/// The stages a work item at this stage may legally move to.
///
/// Written as a `match` rather than a lookup table, and that is the whole reason:
/// an exhaustive `match` on `Stage` does not compile until a fifth stage says
/// where it goes.
pub const fn legal_transitions_from(stage: Stage) -> &'static [Stage] {
    match stage {
        Stage::Idle => &[Stage::AwaitingAgentPickup],
        Stage::AwaitingAgentPickup => &[Stage::InProgressByAgent],
        Stage::InProgressByAgent => &[Stage::AwaitingAgentPickup, Stage::Done],
        // Terminal, and written as an empty list rather than an absent row.
        Stage::Done => &[],
    }
}
