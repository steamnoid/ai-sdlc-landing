//! The closed set of disciplines, named so a reader cannot mistake them for another
//! project's.

/// One of the disciplines accountable for the work.
pub enum Role {
    /// The pilot.
    Pilot,
    /// The engineer.
    Engineer,
}

impl Role {
    /// How a discipline writes itself, which is not its variant name.
    pub const fn name(self) -> &'static str {
        match self {
            Role::Pilot => "PILOT",
            Role::Engineer => "ENGINEER",
        }
    }
}
