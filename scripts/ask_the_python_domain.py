"""Ask a Python project what its domain is, and print the answer as JSON.

**This is a shell, and it is here so the tests can demand the rule rather than a file.**

The first version of this cycle's RED failed on `No such file or directory`, which
is not a finding about any project's domain — it is a finding about this
repository, and it is the finding the cycle was not written to make. A test that
passes because the program it exercises is absent is a test that cannot fail, and
two of them did exactly that: a collector that prints nothing, and one that leaves
no bytecode behind, are both true of a file that was never written.

So the shell refuses, by name and for a reason, and every test in this cycle now
fails on an assertion about a domain. That is the difference between a RED and a
broken import.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


class TheDomainHasNotBeenReadYetError(Exception):
    """This collector does not read anything yet, and says so rather than printing nothing."""


def main() -> int:
    what_was_asked_for = argparse.ArgumentParser(description=__doc__)
    what_was_asked_for.add_argument("--repository", required=True, help="the checkout to read")
    what_they_asked = what_was_asked_for.parse_args()

    try:
        raise TheDomainHasNotBeenReadYetError(
            "scripts/ask_the_python_domain.py does not read a domain yet. It exists so the tests "
            "in test/the_python_domain_is_what_the_page_says.test.mjs can fail on an assertion "
            f"about a project rather than on the absence of this file. The project asked about was "
            f"{Path(what_they_asked.repository).resolve()}."
        )
    except TheDomainHasNotBeenReadYetError as the_refusal:
        print(f"{type(the_refusal).__name__}: {the_refusal}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
