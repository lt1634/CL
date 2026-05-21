"""Default paths for GA (總務) Google Drive folder — override with env GA_ROOT."""

from __future__ import annotations

import os

DEFAULT_GA_ROOT = (
    "/Users/timnewmac/Library/CloudStorage/GoogleDrive-bfhywt@bfhmc.edu.hk/"
    "我的雲端硬碟/🏫 GA"
)


def ga_root() -> str:
    return os.environ.get("GA_ROOT", DEFAULT_GA_ROOT)
