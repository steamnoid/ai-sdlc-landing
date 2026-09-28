"""Ask a Python project what its domain is, and print the answer as JSON.

**The page this feeds is a view of four repositories, and the facts it draws are
imported rather than typed.** Every stage, every role and every legal move the page
shows is read out of the code that declares it, so a change to a domain reaches the
page without anybody editing the page. A table written out by hand would look the
same on screen and be wrong the first time the domain moved, which is the one
failure this whole repository is arranged to prevent.

**Three things are required and one is not, and the split is the design.** Stages,
roles and the table of legal moves are required: a page without them has no table to
draw, and a collector that drops a section quietly is a page lying quietly. The routes
a gate's answer leads to are *not* required — one of the four projects has no router
yet — and a project that could not be read is answered for anyway, with the routes as
`null` and a reason. Refusing the whole project would take three readable projects
off the page to serve the rule properly applied to the fourth.

**The table of legal moves is found under whichever name this project gives it.** The
family declares one table under two names, and which one a project uses is one of the
things the page exists to compare — so the name found is part of the answer rather
than an implementation detail of this script. A collector that knew one name would
report half the family as unreadable, correctly and uselessly.

**The tree that answers is checked against the tree that was asked for.** An editable
install of the same package is on the path of the machine that builds this page, and a
checkout on the path answers in preference to the one named on the command line. A
page built from another project's domain would then be indistinguishable from a
correct one, so the check is not defensive decoration.

Reading a project must also not change it, so nothing is written into somebody else's
working tree.

Run it the way the build runs it:

    python3 scripts/ask_the_python_domain.py --repository ../ai-sdlc-os
"""

from __future__ import annotations

import argparse
import json
import sys
from enum import Enum
from importlib import import_module
from pathlib import Path
from types import ModuleType
from typing import Any

#: The names the family declares the table of legal moves under, and where each lives.
#:
#: **A list rather than a preference, because two of the four projects use the second.**
#: `LEGAL_TRANSITIONS` is a Python constant and `THE_LEGAL_MOVES_FROM_EACH_STAGE` is
#: that same table read as English; both are in the family, and a collector that
#: preferred one would report the other project's table as missing.
THE_NAMES_THE_MOVE_TABLE_GOES_BY = (
    ("LEGAL_TRANSITIONS", "aisdlc.domain.state_machine"),
    ("THE_LEGAL_MOVES_FROM_EACH_STAGE", "aisdlc.domain.state_machine"),
    ("legal_transitions_from", "aisdlc.domain.state_machine"),
)


class TheStagesAreNotReadableError(Exception):
    """`aisdlc.domain.stage` declares no `Stage` for the page to draw."""


class TheRolesAreNotReadableError(Exception):
    """`aisdlc.domain.role` declares no `Role` for the page to name."""


class TheTableOfMovesIsNotReadableError(Exception):
    """No table of legal moves is declared under any of the names the family uses."""


class TheRoutesAreNotReadableError(Exception):
    """There is no `aisdlc.graph.router`, so nothing says where a gate's answer leads."""


class TheInvariantSaysNothingAboutAStageError(Exception):
    """A stage that neither tuple names, or that both name.

    The page prints who must be holding each stage, and that answer comes from the two
    tuples rather than from a third place. A stage in neither would have to be guessed
    and a stage in both would have two owners, and either of those is a hole in the
    domain rather than a fact about it.
    """


class TheCodeAnsweredFromAnotherTreeError(Exception):
    """`import aisdlc` found a tree other than the one that was asked about."""


def the_source_directory_of(a_repository: Path) -> Path:
    """Where the code of a repository is, which is `<repository>/src`."""
    return a_repository / "src"


def forget_any_aisdlc_already_imported() -> None:
    """Drop every `aisdlc` module this interpreter brought in before it was asked.

    **This is what makes a second tree in one process answer about itself.** A module
    already in `sys.modules` is not looked up again, so without this the second tree
    read in a run would be handed the first one's answer — and the second tree's
    stages would be drawn on a page describing the first. An editable install of the
    family's own package is also a real thing on the machine that builds this page, and
    it may already have answered a previous import.
    """
    for a_module_name in [name for name in sys.modules if name == "aisdlc" or name.startswith("aisdlc.")]:
        del sys.modules[a_module_name]


def the_tree_that_answered(must_be_inside: Path) -> str:
    """Import `aisdlc` and prove it came from the tree that was asked for."""
    forget_any_aisdlc_already_imported()
    the_package = import_module("aisdlc")
    where_it_came_from = Path(the_package.__file__ or "").resolve()

    if not where_it_came_from.is_relative_to(must_be_inside):
        raise TheCodeAnsweredFromAnotherTreeError(
            f"the code that answered came from {where_it_came_from}, which is outside the source "
            f"directory that was asked for, {must_be_inside}. A copy of this package is on the path, "
            "so the page would be describing a different project than the one it was told to read."
        )

    return str(where_it_came_from)


def read_a_module(what_it_is_declared_in: str, what_the_page_needs: str) -> ModuleType:
    """One module of the project, or a refusal naming the file it is declared in."""
    try:
        return import_module(what_it_is_declared_in)
    except ImportError as the_import_error:
        raise TheStagesAreNotReadableError(
            f"{what_the_page_needs} could not be read, because {the_import_error}. The file this "
            f"collector needs is {what_it_is_declared_in.replace('.', '/')}.py."
        ) from the_import_error


def read_the_stages(state_machine: ModuleType) -> list[dict[str, Any]]:
    """Every stage, in the order the enumeration declares them, each with who holds it.

    The order is the project's own, and not an order chosen for the page. A reader of
    the domain's code should recognise the page's table, and rearranging it to suit a
    layout would break that in the one place it can be checked.
    """
    the_stage_type = getattr(read_a_module("aisdlc.domain.stage", "the stages"), "Stage", None)
    if not isinstance(the_stage_type, type) or not issubclass(the_stage_type, Enum):
        raise TheStagesAreNotReadableError(
            "aisdlc.domain.stage.Stage is not an enumeration of stages, so there is no closed set "
            "for the page to draw and the list would be whatever the code happened to expose."
        )

    every_stage = list(the_stage_type)
    if not every_stage:
        raise TheStagesAreNotReadableError(
            "aisdlc.domain.stage.Stage is an enumeration with no members, so the page would have "
            "nothing to draw and a reader would be looking at an empty table of stages."
        )

    stages_without_an_agent = set(getattr(state_machine, "STAGES_WITHOUT_AN_AGENT", ()))
    stages_with_an_agent = set(getattr(state_machine, "STAGES_WITH_AN_AGENT", ()))

    the_stages: list[dict[str, Any]] = []
    for a_stage in every_stage:
        without = a_stage in stages_without_an_agent
        with_ = a_stage in stages_with_an_agent
        if without == with_:
            raise TheInvariantSaysNothingAboutAStageError(
                f"the stage {a_stage.value} is "
                + ("in both of the tuples that say who holds it" if without else "in neither of the tuples that say who holds it")
                + ", so the page would have to guess whether an agent must be holding it. The "
                "tuples are STAGES_WITHOUT_AN_AGENT and STAGES_WITH_AN_AGENT."
            )
        the_stages.append({"name": str(a_stage.value), "an_agent_must_be_holding_it": with_})

    return the_stages


def read_the_roles() -> list[str]:
    """Every role, in the order the enumeration declares them."""
    the_role_type = getattr(read_a_module("aisdlc.domain.role", "the roles"), "Role", None)
    if not isinstance(the_role_type, type) or not issubclass(the_role_type, Enum):
        raise TheRolesAreNotReadableError(
            "aisdlc.domain.role.Role is not an enumeration of roles, so the page would print "
            "whatever names the code happened to expose."
        )

    every_role = list(the_role_type)
    if not every_role:
        raise TheRolesAreNotReadableError(
            "aisdlc.domain.role.Role is an enumeration with no members, so the page would name no "
            "discipline at all."
        )

    return [str(a_role.value) for a_role in every_role]


def read_the_table_of_moves(state_machine: ModuleType) -> tuple[str, Any]:
    """The table of legal moves, and the name it was declared under.

    **Both are returned, and the name is the half the page is here for.** The family
    declares one table under two names, and a page about four projects is a page about
    four sets of conventions — so which name a project uses is a fact about that project
    rather than a detail of how this script found it.
    """
    for the_name, _where_it_is in THE_NAMES_THE_MOVE_TABLE_GOES_BY:
        the_table = getattr(state_machine, the_name, None)
        if isinstance(the_table, dict) and the_table:
            return the_name, the_table

    raise TheTableOfMovesIsNotReadableError(
        "no table of legal moves is declared under any of the names the family uses: "
        + ", ".join(a_name for a_name, _where in THE_NAMES_THE_MOVE_TABLE_GOES_BY)
        + f". The module searched is {state_machine.__name__}, and a project with no table of "
        "moves has no state machine for the page to draw."
    )


def read_the_moves(the_table: Any) -> list[dict[str, Any]]:
    """Every legal move, with a stage with no way out listing none rather than nothing.

    A terminal stage reports an empty list rather than no entry at all, so the page can
    tell "nowhere to go" from "nobody looked" — the two look identical on a page that
    leaves a row blank.
    """
    return [
        {"from": str(a_stage.value), "to": sorted(str(a_target.value) for a_target in the_targets)}
        for a_stage, the_targets in the_table.items()
    ]


def read_the_routes() -> tuple[list[dict[str, str]] | None, str | None]:
    """Where a gate's answer leads, or the reason nothing could say.

    **The one thing in here that is allowed to be absent.** A project with no router is
    a real shape in this family and not a fault, and an empty mapping would be a second
    one that looks the same on a page.
    """
    try:
        the_router = import_module("aisdlc.graph.router")
    except ImportError as the_import_error:
        return None, (
            f"there is no router in this project, because {the_import_error}. Nothing declares where "
            "a gate's answer leads, so the page cannot say what an approved artifact leads to."
        )

    the_routes = getattr(the_router, "WHERE_AN_APPROVED_ARTIFACT_LEADS", None)
    if not isinstance(the_routes, dict):
        return None, (
            "aisdlc.graph.router.WHERE_AN_APPROVED_ARTIFACT_LEADS is not a mapping of artifacts to "
            "nodes, so the page cannot say where a gate's answer leads."
        )

    return [{"artifact": str(an_artifact), "leads_to": str(a_node)} for an_artifact, a_node in the_routes.items()], None


def the_answer_about(a_repository: Path) -> dict[str, Any]:
    """Everything the page may say about a project, asked of the project itself.

    Built as one value and returned, never printed from here, so a collector which
    refuses halfway through has printed nothing at all. A page built from half an
    answer is the failure this script's refusals exist to prevent.
    """
    which_code_answered = the_tree_that_answered(must_be_inside=the_source_directory_of(a_repository))
    the_state_machine = read_a_module("aisdlc.domain.state_machine", "the table of legal moves")
    the_name_the_moves_go_by, the_table = read_the_table_of_moves(the_state_machine)
    the_routes, why_the_routes_are_not_there = read_the_routes()

    return {
        "which_code_answered": which_code_answered,
        "stages": read_the_stages(the_state_machine),
        "roles": read_the_roles(),
        "moves": read_the_moves(the_table),
        "the_name_the_move_table_goes_by": the_name_the_moves_go_by,
        "gates": the_routes,
        "why_the_gates_could_not_be_read": why_the_routes_are_not_there,
    }


def main() -> int:
    what_was_asked_for = argparse.ArgumentParser(description=__doc__)
    what_was_asked_for.add_argument(
        "--repository",
        required=True,
        help="the checkout to read, whose `src` holds the code the page describes",
    )
    what_they_asked = what_was_asked_for.parse_args()

    the_repository = Path(what_they_asked.repository).expanduser().resolve()
    sys.path.insert(0, str(the_source_directory_of(the_repository)))

    # Reading a repository must not change it. Importing its code would otherwise leave
    # `.pyc` files in somebody else's working tree, which is a mutation of the thing being
    # measured and a change to a checkout somebody else is working in.
    sys.dont_write_bytecode = True

    try:
        the_answer = the_answer_about(the_repository)
    except Exception as the_refusal:
        print(f"{type(the_refusal).__name__}: {the_refusal}", file=sys.stderr)
        return 1

    print(json.dumps(the_answer, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
