//! Where a work item is in its lifecycle, and each stage says for itself.

use std::fmt;

/// One lifecycle position of a work item.
pub enum Stage {
    /// Filed and not yet looked at.
    Filed,
    /// Being read.
    Reading,
    /// Answered.
    Answered,
    /// Forgotten, and terminal.
    Forgotten,
}

impl Stage {
    /// Whether an agent must be holding work at this stage.
    pub fn an_agent_must_be_holding_it(self) -> bool {
        matches!(self, Stage::Reading)
    }
}

impl fmt::Display for Stage {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Stage::Filed => "FILED",
            Stage::Reading => "READING",
            Stage::Answered => "ANSWERED",
            Stage::Forgotten => "FORGOTTEN",
        }
    }
}
