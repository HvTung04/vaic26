"""Bubble detection via OpenCV on the fixed template. Threshold + contour fill ratio.
Isolated module: cut cleanly at PLAN hour-9 line if needed.
"""

from __future__ import annotations

import cv2
import numpy as np

from .template import BubbleTemplate, DEFAULT_TEMPLATE


def detect_answers(
    image_path: str, template: BubbleTemplate = DEFAULT_TEMPLATE
) -> list[str]:
    """Return chosen option per question row (e.g. ['B','A','C',...]). '' if none."""
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(image_path)
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thr = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    answers: list[str] = []
    for r in range(template.rows):
        yc = int((template.top + r * template.row_gap) * h)
        row_fills: list[float] = []
        for c in range(template.cols):
            xc = int((template.left + c * template.col_gap) * w)
            rad = int(template.bubble_radius * w)
            mask = thr[
                max(0, yc - rad) : yc + rad, max(0, xc - rad) : xc + rad
            ]
            fill = float(np.count_nonzero(mask)) / max(1, mask.size)
            row_fills.append(fill)
        best = max(row_fills)
        chosen = chr(ord("A") + int(np.argmax(row_fills))) if best > 0.25 else ""
        answers.append(chosen)
    return answers
