#!/usr/bin/env python3
"""已停用：請用 emit_events_md.py（全文事件表），唔再做交接篩選。"""

from __future__ import annotations

import sys


def main() -> None:
    print(
        "emit_handover_md.py 已停用。請改用:\n"
        "  python3 tools/ga-ingest/normalize_event_dates.py\n"
        "  python3 tools/ga-ingest/emit_events_md.py\n",
        file=sys.stderr,
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
