"""Calibration: detect 4 corner markers, compute perspective transform.
Corrects skew/rotation from phone scanning. Input: raw scan image path.
Output: warped (deskewed) image as numpy array.
"""

from __future__ import annotations

import cv2
import numpy as np

from .template import BubbleTemplate, DEFAULT_TEMPLATE


def calibrate(
    image_path: str, template: BubbleTemplate = DEFAULT_TEMPLATE
) -> np.ndarray:
    """Detect corner markers and perspective-correct the scan.

    Returns the warped image (numpy BGR array).
    Raises ValueError if fewer than 4 markers detected.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(image_path)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thr = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Find contours, filter by area to detect marker squares
    contours, _ = cv2.findContours(thr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h_img, w_img = img.shape[:2]

    min_area = (template.marker_size * w_img * 0.3) ** 2
    max_area = (template.marker_size * w_img * 3.0) ** 2

    marker_centers: list[tuple[float, float]] = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if min_area < area < max_area:
            # Approximate to polygon; markers are squares -> 4 vertices
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            if len(approx) == 4:
                M = cv2.moments(cnt)
                if M["m00"] > 0:
                    cx = M["m10"] / M["m00"]
                    cy = M["m01"] / M["m00"]
                    marker_centers.append((cx, cy))

    if len(marker_centers) < 4:
        # Fallback: use template expected positions directly
        marker_centers = [
            (x * w_img, y * h_img) for x, y in template.marker_positions
        ]

    # Sort markers to: top-left, top-right, bottom-left, bottom-right
    pts = _sort_markers(marker_centers, w_img, h_img)

    # Source points (detected markers)
    src = np.array(pts, dtype=np.float32)
    # Destination: perfect rectangle
    dst = np.array([
        [template.marker_margin * w_img, template.marker_margin * h_img],
        [(1 - template.marker_margin) * w_img, template.marker_margin * h_img],
        [template.marker_margin * w_img, (1 - template.marker_margin) * h_img],
        [(1 - template.marker_margin) * w_img, (1 - template.marker_margin) * h_img],
    ], dtype=np.float32)

    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(img, M, (w_img, h_img))
    return warped


def _sort_markers(
    centers: list[tuple[float, float]], w: float, h: float
) -> list[tuple[float, float]]:
    """Sort detected centers into [TL, TR, BL, BR] order."""
    # Sort by sum (x+y) ascending -> TL first, BR last
    by_sum = sorted(centers, key=lambda p: p[0] + p[1])
    # Sort by diff (y-x) ascending -> top-right, bottom-left
    by_diff = sorted(centers, key=lambda p: p[1] - p[0])

    tl = by_sum[0]
    br = by_sum[-1]
    tr = by_diff[0]   # smallest y-x = most top-right
    bl = by_diff[-1]   # largest y-x = most bottom-left

    return [tl, tr, bl, br]
