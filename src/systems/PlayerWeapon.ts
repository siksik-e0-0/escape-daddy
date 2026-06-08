export type WeaponMode = 'WIND' | 'FLAME';

export interface ProjectileStats {
  speed: number;
  damage: number;
  color: number;
  radius: number;
}

const WIND_STATS: ProjectileStats = {
  speed: 400,
  damage: 10,
  color: 0xc8f0a0,
  radius: 6,
};

const FLAME_STATS: ProjectileStats = {
  speed: 600,
  damage: 25,
  color: 0xff6420,
  radius: 8,
};

export class PlayerWeapon {
  private _mode: WeaponMode = 'WIND';

  get mode(): WeaponMode {
    return this._mode;
  }

  get stats(): ProjectileStats {
    return this._mode === 'FLAME' ? FLAME_STATS : WIND_STATS;
  }

  get hasFlame(): boolean {
    return this._mode === 'FLAME';
  }

  unlock(): void {
    this._mode = 'FLAME';
  }

  reset(): void {
    this._mode = 'WIND';
  }
}
