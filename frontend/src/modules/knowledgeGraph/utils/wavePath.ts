/** Builds a seamlessly-loopable sine-like wave path (as an SVG `d` string),
 * closed at the bottom so it can be filled as a "water" shape. Repeats every
 * `wavelength` px — animate `transform: translateX(±wavelength)` on the
 * resulting <path> for a perfectly seamless scroll. */
function buildWavePath(width: number, bottom: number, wavelength: number, amplitude: number, baseline: number) {
  const periods = Math.ceil(width / wavelength) + 2;
  let d = `M ${-wavelength} ${baseline}`;
  for (let i = -1; i < periods; i++) {
    const x0 = i * wavelength;
    const xMid = x0 + wavelength / 2;
    const x1 = x0 + wavelength;
    d += ` C ${x0 + wavelength * 0.25} ${baseline - amplitude}, ${xMid - wavelength * 0.25} ${baseline - amplitude}, ${xMid} ${baseline}`;
    d += ` C ${xMid + wavelength * 0.25} ${baseline + amplitude}, ${x1 - wavelength * 0.25} ${baseline + amplitude}, ${x1} ${baseline}`;
  }
  d += ` V ${bottom} H ${-wavelength} Z`;
  return d;
}

export const WAVE_WAVELENGTH_A = 17;
export const WAVE_WAVELENGTH_B = 13;

/** Precomputed once at module load — identical geometry is shared by every node instance. */
export const WAVE_PATH_A = buildWavePath(56, 60, WAVE_WAVELENGTH_A, 2.6, 0);
export const WAVE_PATH_B = buildWavePath(56, 60, WAVE_WAVELENGTH_B, 2, 0);
