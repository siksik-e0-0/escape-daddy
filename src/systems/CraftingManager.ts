export type CraftAction =
  | 'CHOP_CRUSH'
  | 'ADD_DROP_5'
  | 'ADD_ITEM'
  | 'CIRCLE_STIR'
  | 'STIR'
  | 'CHILL'
  | 'FILTER_OUT'
  | 'EXTRACT';

interface StepSpec {
  action: CraftAction;
  itemId?: string;
  description: string;
  hint: string;
  chillMs?: number; // CHILL 단계 대기 시간
}

export const RECIPE: StepSpec[] = [
  { action: 'CHOP_CRUSH',  itemId: 'ing_floating_leaf', description: '둥둥잎사귀를 잘게 잘라 찧는다', hint: '재료를 3번 클릭하세요!' },
  { action: 'ADD_DROP_5',  itemId: 'ing_shinsen_water',  description: '신선물을 5방울 넣는다',         hint: '방울을 5번 떨어뜨리세요!' },
  { action: 'ADD_ITEM',    itemId: 'ing_wind_herb',       description: '바람초를 넣는다',              hint: '재료를 드래그하여 가마솥에 넣으세요!' },
  { action: 'CIRCLE_STIR', itemId: 'ing_shinsen_water',  description: '신선물을 한 바퀴 돌린다',       hint: '가마솥 위에서 원을 그리세요!' },
  { action: 'CHOP_CRUSH',  itemId: 'ing_water_fruit',    description: '물의열매를 찧는다',             hint: '재료를 3번 클릭하세요!' },
  { action: 'ADD_ITEM',    itemId: 'ing_flame_herb',      description: '불꽃초를 넣는다',              hint: '재료를 드래그하여 가마솥에 넣으세요!' },
  { action: 'STIR',                                       description: '저어준다',                     hint: '가마솥 위에서 좌우로 드래그하세요!' },
  { action: 'CHILL',       chillMs: 10000,                description: '얼음 공간에 넣는다 (10초)',     hint: '기다려 주세요...' },
  { action: 'STIR',                                       description: '다시 저어준다',               hint: '가마솥 위에서 좌우로 드래그하세요!' },
  { action: 'ADD_ITEM',    itemId: 'ing_strong_berry',   description: '튼튼빨간귤을 넣는다',           hint: '재료를 드래그하여 가마솥에 넣으세요!' },
  { action: 'CHILL',       chillMs: 5000,                 description: '귤을 5초 우려낸다',            hint: '기다려 주세요...' },
  { action: 'FILTER_OUT',  itemId: 'ing_strong_berry',   description: '귤 건더기를 건진다',            hint: '건더기를 밖으로 드래그하세요!' },
  { action: 'STIR',                                       description: '충분히 저어준다',              hint: '가마솥 위에서 좌우로 드래그하세요!' },
  { action: 'EXTRACT',                                    description: '물만 뽑아내면 완성!',          hint: '추출 버튼을 누르세요!' },
];

export interface StepResult {
  success: boolean;
  isComplete: boolean;
  completedStep: number;
}

export interface StepInfo {
  step: number;
  total: number;
  description: string;
  hint: string;
  action: CraftAction;
  itemId: string | undefined;
  chillMs: number | undefined;
}

export class CraftingManager {
  private idx = 0;
  private _failed = false;

  get step(): number        { return this.idx + 1; }
  get failed(): boolean     { return this._failed; }
  get isComplete(): boolean { return this.idx >= RECIPE.length; }
  get totalSteps(): number  { return RECIPE.length; }

  getStepInfo(): StepInfo {
    const i = Math.min(this.idx, RECIPE.length - 1);
    const s = RECIPE[i];
    return {
      step: this.idx + 1,
      total: RECIPE.length,
      description: s.description,
      hint: s.hint,
      action: s.action,
      itemId: s.itemId,
      chillMs: s.chillMs,
    };
  }

  processStep(action: CraftAction, itemId?: string): StepResult {
    if (this._failed || this.isComplete) {
      return { success: false, isComplete: this.isComplete, completedStep: this.idx };
    }

    const s = RECIPE[this.idx];
    const valid = s.action === action && (s.itemId === undefined || s.itemId === itemId);

    if (valid) {
      this.idx++;
      return { success: true, isComplete: this.idx >= RECIPE.length, completedStep: this.idx };
    }

    this._failed = true;
    return { success: false, isComplete: false, completedStep: this.idx + 1 };
  }

  reset(): void {
    this.idx = 0;
    this._failed = false;
  }
}
