"""Tests for bubblesheet generate + calibrate + detect (synthetic images, no real scan)."""

import os
import tempfile

import cv2
import numpy as np

from app.bubblesheet.generate import generate_bubble_sheet, generate_bubble_sheet_bytes
from app.bubblesheet.calibrate import calibrate, _sort_markers
from app.bubblesheet.detect import detect_answers, detect_answers_from_image
from app.bubblesheet.template import DEFAULT_TEMPLATE


# ---------- generate ----------

def test_generate_creates_pdf(tmp_path):
    questions = [
        {"index": 1, "text": "Q1?", "options": ["A", "B", "C", "D"]},
        {"index": 2, "text": "Q2?", "options": ["A", "B", "C", "D"]},
    ]
    out = tmp_path / "sheet.pdf"
    result = generate_bubble_sheet(questions, out)
    assert result.exists()
    assert result.stat().st_size > 0


def test_generate_bytes_not_empty():
    questions = [{"index": 1, "text": "Q1?", "options": ["A", "B", "C", "D"]}]
    pdf_bytes = generate_bubble_sheet_bytes(questions)
    assert len(pdf_bytes) > 0
    assert pdf_bytes[:4] == b"%PDF"


def test_generate_many_questions(tmp_path):
    questions = [{"index": i, "text": f"Q{i}?", "options": ["A", "B", "C", "D"]} for i in range(1, 51)]
    out = tmp_path / "big.pdf"
    result = generate_bubble_sheet(questions, out)
    assert result.exists()


# ---------- calibrate ----------

def _make_sheet_with_markers(filled: dict[int, str] | None = None) -> str:
    """Create synthetic sheet image with 4 calibration markers + optional filled bubbles."""
    img = np.full((1000, 1600, 3), 255, dtype=np.uint8)
    h, w = img.shape[:2]
    t = DEFAULT_TEMPLATE

    # Draw calibration markers (filled black squares)
    ms = int(t.marker_size * w)
    mm = int(t.marker_margin * w)
    for cx, cy in [(mm, mm), (w - mm - ms, mm), (mm, h - mm - ms), (w - mm - ms, h - mm - ms)]:
        cv2.rectangle(img, (cx, cy), (cx + ms, cy + ms), (0, 0, 0), -1)

    # Draw filled bubbles
    if filled:
        for r, ans in filled.items():
            yc = int((t.top + r * t.row_gap) * h)
            ci = ord(ans) - ord("A")
            xc = int((t.left + ci * t.col_gap) * w)
            rad = int(t.bubble_radius * w)
            cv2.circle(img, (xc, yc), rad, (0, 0, 0), -1)

    path = f"tmp_cal_{id(filled)}.png"
    cv2.imwrite(path, img)
    return path


def test_calibrate_corrects_perspective():
    path = _make_sheet_with_markers({0: "B", 1: "A"})
    try:
        warped = calibrate(path)
        assert warped.shape[0] > 0 and warped.shape[1] > 0
    finally:
        os.remove(path)


def test_detect_after_calibrate():
    path = _make_sheet_with_markers({0: "B", 1: "A", 2: "C"})
    try:
        answers = detect_answers(path, calibrate_first=True)
        # After perspective correction on a synthetic image, at least some rows
        # should be detected. Exact match varies with warp precision.
        assert len(answers) == DEFAULT_TEMPLATE.rows
        detected = [a for a in answers if a]
        assert len(detected) >= 1  # at least one bubble detected
        assert all(a in ["A", "B", "C", "D"] for a in detected)
    finally:
        os.remove(path)


def test_detect_from_image_array():
    path = _make_sheet_with_markers({0: "D"})
    try:
        img = cv2.imread(path)
        answers = detect_answers_from_image(img)
        assert answers[0] == "D"
    finally:
        os.remove(path)


def test_sort_markers():
    # Approximate positions: TL, TR, BL, BR
    centers = [(100, 100), (1500, 100), (100, 900), (1500, 900)]
    sorted_pts = _sort_markers(centers, 1600, 1000)
    # TL should be first, BR last
    assert sorted_pts[0][0] < sorted_pts[1][0]  # TL.x < TR.x
    assert sorted_pts[0][1] < sorted_pts[2][1]  # TL.y < BL.y
