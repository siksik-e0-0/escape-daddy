import { describe, it, expect, beforeEach } from 'vitest';
import { CraftingManager, RECIPE } from '../systems/CraftingManager.js';

describe('CraftingManager', () => {
  let cm: CraftingManager;

  beforeEach(() => {
    cm = new CraftingManager();
  });

  it('초기 상태: step=1, failed=false, isComplete=false', () => {
    expect(cm.step).toBe(1);
    expect(cm.failed).toBe(false);
    expect(cm.isComplete).toBe(false);
    expect(cm.totalSteps).toBe(14);
  });

  it('getStepInfo는 첫 번째 단계 정보를 반환한다', () => {
    const info = cm.getStepInfo();
    expect(info.step).toBe(1);
    expect(info.total).toBe(14);
    expect(info.action).toBe('CHOP_CRUSH');
    expect(info.itemId).toBe('ing_floating_leaf');
  });

  it('올바른 액션으로 단계 진행된다', () => {
    const result = cm.processStep('CHOP_CRUSH', 'ing_floating_leaf');
    expect(result.success).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.completedStep).toBe(1);
    expect(cm.step).toBe(2);
  });

  it('잘못된 액션으로 실패 처리된다', () => {
    const result = cm.processStep('STIR');
    expect(result.success).toBe(false);
    expect(cm.failed).toBe(true);
  });

  it('잘못된 itemId로 실패 처리된다', () => {
    const result = cm.processStep('CHOP_CRUSH', 'ing_wrong_item');
    expect(result.success).toBe(false);
    expect(cm.failed).toBe(true);
  });

  it('실패 후 추가 processStep은 무시된다', () => {
    cm.processStep('STIR'); // 실패
    const result = cm.processStep('CHOP_CRUSH', 'ing_floating_leaf');
    expect(result.success).toBe(false);
    expect(cm.step).toBe(1);
  });

  it('reset으로 초기 상태로 돌아간다', () => {
    cm.processStep('CHOP_CRUSH', 'ing_floating_leaf');
    cm.processStep('STIR'); // 실패
    cm.reset();
    expect(cm.step).toBe(1);
    expect(cm.failed).toBe(false);
    expect(cm.isComplete).toBe(false);
  });

  it('14단계 전체를 순서대로 완료한다', () => {
    for (const spec of RECIPE) {
      const result = cm.processStep(spec.action, spec.itemId);
      expect(result.success).toBe(true);
    }
    expect(cm.isComplete).toBe(true);
  });

  it('완료 후 isComplete=true, 추가 processStep은 실패 반환', () => {
    for (const spec of RECIPE) {
      cm.processStep(spec.action, spec.itemId);
    }
    const extra = cm.processStep('EXTRACT');
    expect(extra.success).toBe(false);
    expect(cm.isComplete).toBe(true);
  });

  it('CHILL 단계(8번째)는 chillMs=10000을 갖는다', () => {
    // 1~7단계 진행
    for (let i = 0; i < 7; i++) {
      cm.processStep(RECIPE[i].action, RECIPE[i].itemId);
    }
    const info = cm.getStepInfo();
    expect(info.action).toBe('CHILL');
    expect(info.chillMs).toBe(10000);
  });

  it('CHILL 단계(11번째)는 chillMs=5000을 갖는다', () => {
    // 1~10단계 진행
    for (let i = 0; i < 10; i++) {
      cm.processStep(RECIPE[i].action, RECIPE[i].itemId);
    }
    const info = cm.getStepInfo();
    expect(info.action).toBe('CHILL');
    expect(info.chillMs).toBe(5000);
  });

  it('itemId 없는 단계(STIR)는 itemId 무관하게 진행된다', () => {
    // 1~6단계 진행하여 7번째(STIR)에 도달
    for (let i = 0; i < 6; i++) {
      cm.processStep(RECIPE[i].action, RECIPE[i].itemId);
    }
    const result = cm.processStep('STIR');
    expect(result.success).toBe(true);
  });

  it('RECIPE 배열은 14개 항목을 갖는다', () => {
    expect(RECIPE).toHaveLength(14);
  });
});
