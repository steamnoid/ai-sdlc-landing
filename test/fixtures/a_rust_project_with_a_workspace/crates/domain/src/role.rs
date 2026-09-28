//! One discipline, and a fourth name for it.
//!
//! **The written names are not the variant names**, and the comment on `Role` in the
//! real project says why: "Clippy accepts `PO` and `QA` and refuses `DEV`, so writing
//! two of the five one way on purpose would be a style nobody can hold". A reader that
//! printed `Product` where the project writes `PO` would be printing Rust's spelling
//! on a page whose whole subject is four projects' conventions.

use std::fmt;

/// One of the disciplines accountable for the work.
pub enum Role {
    /// The archivist.
    Archivist,
    /// The editor.
    Editor,
}

impl fmt::Display for Role {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Role::Archivist => "ARCHIVIST",
            Role::Editor => "EDITOR",
        }
    }
}
