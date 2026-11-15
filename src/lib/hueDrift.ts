interface HueDriftAnchor {
  hue: number
  k1: number
  k2: number
}

const HUE_DRIFT_ANCHORS: HueDriftAnchor[] = [
  { hue: 229, k1: -1.03, k2: 8.66 },
  { hue: 41, k1: -13.88, k2: -14.73 },
  { hue: 37, k1: 1.15, k2: -15.04 },
  { hue: 64, k1: -42.24, k2: -24.39 },
  { hue: 85, k1: -51.9, k2: -75.27 },
  { hue: 102, k1: -53.67, k2: -114.11 },
  { hue: 115, k1: -9.35, k2: -33.78 },
  { hue: 131, k1: 10.94, k2: 10.54 },
  { hue: 144, k1: -2.36, k2: 6.25 },
  { hue: 183, k1: -14.08, k2: 3.03 },
  { hue: 211, k1: -5.31, k2: -34.21 },
  { hue: 239, k1: 24.91, k2: -0.12 },
  { hue: 249, k1: 19.47, k2: 8.69 },
  { hue: 271, k1: -7.71, k2: 13.33 },
  { hue: 295, k1: -23.62, k2: -15.64 },
  { hue: 321, k1: -26.42, k2: -54.55 },
  { hue: 10, k1: -0.63, k2: -61.5 },
  { hue: 29, k1: 13.84, k2: -48.1 },
]

const HUE_DRIFT_SIGMA = 12

function circularDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360
  return distance > 180 ? 360 - distance : distance
}

function driftCoefficients(baseHue: number): { k1: number; k2: number } {
  for (const anchor of HUE_DRIFT_ANCHORS) {
    if (circularDistance(baseHue, anchor.hue) < 0.75) {
      return { k1: anchor.k1, k2: anchor.k2 }
    }
  }

  let weightSum = 0
  let k1 = 0
  let k2 = 0

  for (const anchor of HUE_DRIFT_ANCHORS) {
    const distance = circularDistance(baseHue, anchor.hue)
    const weight = Math.exp(
      -0.5 * (distance / HUE_DRIFT_SIGMA) ** 2,
    )
    weightSum += weight
    k1 += weight * anchor.k1
    k2 += weight * anchor.k2
  }

  return { k1: k1 / weightSum, k2: k2 / weightSum }
}

export function hueDriftAt(baseHue: number, t: number): number {
  const { k1, k2 } = driftCoefficients(baseHue)
  const offset = t - 5 / 9
  return k1 * offset + k2 * offset ** 2
}
