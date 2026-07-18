"""Fixed bubble-sheet template geometry + calibration marker config.
NOT handwriting OCR (PLAN rule). Coordinates normalized 0..1 for calibration;
pixels for PDF generation. Calibrate once against printed template.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BubbleTemplate:
    rows: int = 40              # questions per page
    cols: int = 4               # A B C D (or however many options)
    option_labels: list[str] = field(default_factory=lambda: ["A", "B", "C", "D"])

    # Bubble positions (normalized 0..1 of scanned image size)
    top: float = 0.12
    left: float = 0.15
    row_gap: float = 0.018
    col_gap: float = 0.05
    bubble_radius: float = 0.006

    # Calibration markers: normalized positions of 4 corner squares
    marker_size: float = 0.012          # square side (normalized)
    marker_margin: float = 0.018        # distance from edge (normalized)
    # Marker centroids (normalized): top-left, top-right, bottom-left, bottom-right
    marker_positions: list[tuple[float, float]] = field(default_factory=lambda: [
        (0.024, 0.024),   # top-left
        (0.976, 0.024),   # top-right
        (0.024, 0.976),   # bottom-left
        (0.976, 0.976),   # bottom-right
    ])


DEFAULT_TEMPLATE = BubbleTemplate()
