export class StirDetector {
  private reversals = 0;
  private lastDir: 'left' | 'right' | null = null;
  private lastX = 0;
  readonly threshold: number;

  constructor(threshold = 3) {
    this.threshold = threshold;
  }

  update(x: number): boolean {
    const dx = x - this.lastX;
    this.lastX = x;
    if (Math.abs(dx) < 5) return false;

    const dir = dx > 0 ? 'right' : 'left';
    if (this.lastDir !== null && dir !== this.lastDir) {
      this.reversals++;
    }
    this.lastDir = dir;
    return this.reversals >= this.threshold;
  }

  reset(): void {
    this.reversals = 0;
    this.lastDir = null;
    this.lastX = 0;
  }

  get count(): number {
    return this.reversals;
  }
}

export class CircleStirDetector {
  private totalAngle = 0;
  private lastAngle: number | null = null;
  readonly targetDeg: number;

  constructor(targetDeg = 360) {
    this.targetDeg = targetDeg;
  }

  update(cx: number, cy: number, px: number, py: number): boolean {
    const angle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
    if (this.lastAngle !== null) {
      let delta = angle - this.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      this.totalAngle += Math.abs(delta);
    }
    this.lastAngle = angle;
    return this.totalAngle >= this.targetDeg;
  }

  reset(): void {
    this.totalAngle = 0;
    this.lastAngle = null;
  }

  get accumulated(): number {
    return this.totalAngle;
  }
}
