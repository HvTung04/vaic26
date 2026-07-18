"""Tests for bubble sheet detection (synthetic image, no real scan)."""

import numpy as np
import cv2

from app.bubblesheet.detect import detect_answers
from app.bubblesheet.template import DEFAULT_TEMPLATE


def _make_sheet(filled: dict[int, str]) -> str:
    img = np.full((1000, 1600, 3), 255, dtype=np.uint8)
    h, w = img.shape[:2]
    t = DEFAULT_TEMPLATE
    for r in range(t.rows):
        yc = int((t.top + r * t.row_gap) * h)
        ans = filled.get(r, "")
        for c in range(t.cols):
            xc = int((t.left + c * t.col_gap) * w)
            rad = int(t.bubble_radius * w)
            col = (0, 0, 0) if (chr(ord("A") + c) == ans) else (255, 255, 255)
            cv2.circle(img, (xc, yc), rad, col, -1)
    path = f"tmp_sheet_{id(filled)}.png"
    cv2.imwrite(path, img)
    return path


def test_detect_filled_rows():
    filled = {0: "B", 1: "A", 2: "C"}
    path = _make_sheet(filled)
    try:
        ans = detect_answers(path)
        assert ans[0] == "B" and ans[1] == "A" and ans[2] == "C"
        assert ans[3] == ""  # empty
    finally:
        import os
        os.remove(path)


def test_detect_empty_sheet():
    path = _make_sheet({})
    try:
        ans = detect_answers(path)
        assert all(a == "" for a in ans)
    finally:
        import os
        os.remove(path)
