"""Fixed bubble-sheet template geometry. NOT handwriting OCR (PLAN rule).
Coordinates are normalized 0..1; calibrate once against the printed template.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class BubbleTemplate:
    rows: int = 40          # questions per sheet
    cols: int = 5           # A B C D E
    top: float = 0.12       # normalized y of first row
    left: float = 0.15      # normalized x of first col (A)
    row_gap: float = 0.018  # normalized vertical spacing
    col_gap: float = 0.05   # normalized horizontal spacing
    bubble_radius: float = 0.006


DEFAULT_TEMPLATE = BubbleTemplate()
