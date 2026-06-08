import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerWeapon } from '../systems/PlayerWeapon.js';

describe('PlayerWeapon', () => {
  let pw: PlayerWeapon;

  beforeEach(() => {
    pw = new PlayerWeapon();
  });

  it('초기 모드는 WIND다', () => {
    expect(pw.mode).toBe('WIND');
    expect(pw.hasFlame).toBe(false);
  });

  it('WIND 스탯 검증', () => {
    const stats = pw.stats;
    expect(stats.speed).toBe(400);
    expect(stats.damage).toBe(10);
    expect(stats.color).toBe(0xc8f0a0);
    expect(stats.radius).toBe(6);
  });

  it('unlock() 후 FLAME 모드로 전환된다', () => {
    pw.unlock();
    expect(pw.mode).toBe('FLAME');
    expect(pw.hasFlame).toBe(true);
  });

  it('FLAME 스탯은 WIND보다 강하다', () => {
    pw.unlock();
    const stats = pw.stats;
    expect(stats.speed).toBe(600);
    expect(stats.damage).toBe(25);
    expect(stats.color).toBe(0xff6420);
    expect(stats.radius).toBe(8);
  });

  it('reset() 후 WIND 모드로 돌아간다', () => {
    pw.unlock();
    pw.reset();
    expect(pw.mode).toBe('WIND');
    expect(pw.hasFlame).toBe(false);
  });

  it('unlock() 중복 호출해도 FLAME 유지된다', () => {
    pw.unlock();
    pw.unlock();
    expect(pw.mode).toBe('FLAME');
  });
});
