//! Where a work item is in its lifecycle. The set of values is closed.

/// One lifecycle position of a work item.
///
/// A stage is **written** with its own name, in capitals, and it is read back from
/// that name. The Rust name and the written name are not the same spelling, which is
/// why the writing has to be asked for rather than assumed.
pub enum Stage {
    /// Nothing is happening.
    Idle,
    /// An agent may claim this work item.
    AwaitingAgentPickup,
    /// An agent is acting on this work item.
    InProgressByAgent,
    /// Finished. Terminal, no outgoing transition.
    Done,
}

/// Every stage there is, so that a caller can cross one thing with all of them.
pub struct EveryStage;

impl EveryStage {
    /// All four, in the order the specification lists them.
    pub const ALL: [Stage; 4] = [
        Stage::Idle,
        Stage::AwaitingAgentPickup,
        Stage::InProgressByAgent,
        Stage::Done,
    ];
}

impl Stage {
    /// The stage's name, as the specification and every artifact spell it.
    pub const fn name(self) -> &'static str {
        match self {
            Stage::Idle => "IDLE",
            Stage::AwaitingAgentPickup => "AWAITING_AGENT_PICKUP",
            Stage::InProgressByAgent => "IN_PROGRESS_BY_AGENT",
            Stage::Done => "DONE",
        }
    }
}
