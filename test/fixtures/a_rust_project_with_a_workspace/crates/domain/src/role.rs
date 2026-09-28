//! One discipline, and a fourth name for it.

/// One of the disciplines accountable for the work.
pub enum Role {
    /// The archivist.
    Archivist,
}

impl Role {
    /// How a discipline writes itself, in a `Display` rather than a `name`.
    pub fn how_it_is_written(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Role::Archivist => write!(formatter, "ARCHIVIST"),
        }
    }
}
