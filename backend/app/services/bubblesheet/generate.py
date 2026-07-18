"""Generate printable bubble sheet PDF from confirmed questions.
Standard format: A4, corner calibration markers, A/B/C/D bubbles per question.
Compatible with detect.py after perspective correction.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from .template import BubbleTemplate, DEFAULT_TEMPLATE

# Calibration marker: filled black square at each corner
_MARKER_SIZE = 5 * mm
_MARKER_MARGIN = 8 * mm  # distance from page edge


def generate_bubble_sheet(
    questions: list[dict],  # [{"index": int, "text": str, "options": list[str]}]
    output: str | Path,
    template: BubbleTemplate = DEFAULT_TEMPLATE,
    title: str = "G.A.R.Y — Answer Sheet",
) -> Path:
    """Create bubble sheet PDF. Returns output path."""
    c = canvas.Canvas(str(output), pagesize=A4)
    w, h = A4

    # --- calibration markers (4 corners) ---
    _draw_markers(c, w, h)

    # --- header ---
    y = h - 20 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(25 * mm, y, title)
    y -= 8 * mm
    c.setFont("Helvetica", 9)
    for label in ["Name:", "Class:", "Date:", "ID:"]:
        c.drawString(25 * mm, y, f"{label} ___________________")
        y -= 5 * mm

    y -= 5 * mm  # gap before questions

    # --- question rows ---
    c.setFont("Helvetica", 9)
    opts = template.option_labels
    for q in questions:
        if y < 25 * mm:  # new page
            c.showPage()
            _draw_markers(c, w, h)
            y = h - 25 * mm

        # question number
        c.setFont("Helvetica-Bold", 10)
        c.drawString(template.left - 12 * mm, y + 1.5 * mm, str(q["index"]))

        # bubbles
        c.setFont("Helvetica", 8)
        for ci, label in enumerate(opts):
            cx = template.left + ci * template.col_gap * w
            cy = y
            # outer circle
            c.setStrokeColorRGB(0, 0, 0)
            c.setLineWidth(0.5)
            c.circle(cx, cy, template.bubble_radius * w, stroke=1, fill=0)
            # label below
            c.drawCentredString(cx, cy - template.bubble_radius * w - 3 * mm, label)

        y -= template.row_gap * h * 18  # spacing between rows

    c.save()
    return Path(output)


def generate_bubble_sheet_bytes(
    questions: list[dict],
    template: BubbleTemplate = DEFAULT_TEMPLATE,
    title: str = "G.A.R.Y — Answer Sheet",
) -> bytes:
    """Same as generate_bubble_sheet but returns PDF bytes (no file write)."""
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    _draw_markers(c, w, h)

    y = h - 20 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(25 * mm, y, title)
    y -= 8 * mm
    c.setFont("Helvetica", 9)
    for label in ["Name:", "Class:", "Date:", "ID:"]:
        c.drawString(25 * mm, y, f"{label} ___________________")
        y -= 5 * mm
    y -= 5 * mm

    opts = template.option_labels
    for q in questions:
        if y < 25 * mm:
            c.showPage()
            _draw_markers(c, w, h)
            y = h - 25 * mm

        c.setFont("Helvetica-Bold", 10)
        c.drawString(template.left - 12 * mm, y + 1.5 * mm, str(q["index"]))

        c.setFont("Helvetica", 8)
        for ci, label in enumerate(opts):
            cx = template.left + ci * template.col_gap * w
            cy = y
            c.setStrokeColorRGB(0, 0, 0)
            c.setLineWidth(0.5)
            c.circle(cx, cy, template.bubble_radius * w, stroke=1, fill=0)
            c.drawCentredString(cx, cy - template.bubble_radius * w - 3 * mm, label)

        y -= template.row_gap * h * 18

    c.save()
    return buf.getvalue()


def _draw_markers(c: canvas.Canvas, w: float, h: float) -> None:
    """Draw 4 filled black squares at corners for calibration."""
    c.setFillColorRGB(0, 0, 0)
    positions = [
        (_MARKER_MARGIN, h - _MARKER_MARGIN - _MARKER_SIZE),  # top-left
        (w - _MARKER_MARGIN - _MARKER_SIZE, h - _MARKER_MARGIN - _MARKER_SIZE),  # top-right
        (_MARKER_MARGIN, _MARKER_MARGIN),  # bottom-left
        (w - _MARKER_MARGIN - _MARKER_SIZE, _MARKER_MARGIN),  # bottom-right
    ]
    for x, y in positions:
        c.rect(x, y, _MARKER_SIZE, _MARKER_SIZE, stroke=0, fill=1)
    c.setFillColorRGB(0, 0, 0)  # reset
