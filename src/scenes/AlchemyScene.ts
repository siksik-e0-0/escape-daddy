import Phaser from 'phaser';
import { CraftingManager, type CraftAction } from '../systems/CraftingManager.js';
import { StirDetector, CircleStirDetector } from '../utils/gestures.js';

const W = 480;
const H = 854;
const CAULDRON_X = W / 2;
const CAULDRON_Y = 400;

export class AlchemyScene extends Phaser.Scene {
  private cm!: CraftingManager;
  private stirDetector!: StirDetector;
  private circleDetector!: CircleStirDetector;

  private stepText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;

  private ingredients!: Phaser.GameObjects.Image[];
  private chopCount = 0;
  private dropCount = 0;
  private isDragging = false;
  private isChilling = false;

  private chillTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'AlchemyScene' });
  }

  create(): void {
    this.cm = new CraftingManager();
    this.stirDetector = new StirDetector(3);
    this.circleDetector = new CircleStirDetector(360);

    this.add.image(W / 2, H / 2, 'bg_alchemy').setDisplaySize(W, H).setDepth(-1);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35);

    this.makeBg();
    this.add.image(CAULDRON_X, CAULDRON_Y, 'cauldron').setScale(1.4);

    this.buildIngredientSlots();
    this.buildUI();
    this.setupInputHandlers();
    this.refreshUI();
  }

  private makeBg(): void {
    // 별
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H - 280);
      const r = Phaser.Math.Between(1, 3);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.7));
    }
    // 하단 테이블
    this.add.rectangle(W / 2, H - 90, W, 180, 0x4a2800, 0.7);
  }

  private buildIngredientSlots(): void {
    const ids = [
      'ing_floating_leaf', 'ing_shinsen_water', 'ing_wind_herb',
      'ing_water_fruit', 'ing_flame_herb', 'ing_strong_berry',
    ];
    this.ingredients = [];

    // 3×2 그리드: 3열 2행
    const cols = 3;
    const cellW = W / cols;
    const row1Y = H - 150;
    const row2Y = H - 60;

    ids.forEach((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cellW * col + cellW / 2;
      const y = row === 0 ? row1Y : row2Y;

      const slot = this.add.rectangle(x, y, 56, 56, 0x333355, 0.8).setInteractive();
      const img = this.add.image(x, y, id).setScale(0.85).setInteractive({ draggable: true });
      const label = this.add.text(x, y + 32, this.getIngName(id), {
        fontSize: '10px', color: '#aaaaaa', align: 'center',
      }).setOrigin(0.5);

      this.input.setDraggable(img);
      img.setData('id', id);
      img.setData('label', label);
      img.setData('slot', slot);
      img.setData('homeX', x);
      img.setData('homeY', y);

      this.ingredients.push(img);
    });
  }

  private getIngName(id: string): string {
    const names: Record<string, string> = {
      ing_floating_leaf: '둥둥잎',
      ing_shinsen_water: '신선물',
      ing_wind_herb: '바람초',
      ing_water_fruit: '물열매',
      ing_flame_herb: '불꽃초',
      ing_strong_berry: '튼튼귤',
    };
    return names[id] ?? id;
  }

  private buildUI(): void {
    // 단계 패널 (상단)
    this.add.rectangle(W / 2, 40, W, 80, 0x000000, 0.6);
    this.stepText = this.add.text(16, 14, '', { fontSize: '18px', color: '#ffd700' });
    this.descText = this.add.text(W / 2, 14, '', {
      fontSize: '15px', color: '#ffffff', align: 'center',
      wordWrap: { width: W - 80 },
    }).setOrigin(0.5, 0);
    this.hintText = this.add.text(W / 2, 46, '', {
      fontSize: '12px', color: '#88ccff', align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5, 0);

    // 재시작 버튼
    const restartBtn = this.add.text(W - 12, 14, '🔄', {
      fontSize: '20px', color: '#ff8888', backgroundColor: '#440000', padding: { x: 6, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.restartRecipe());
  }

  private setupInputHandlers(): void {
    this.input.on('dragstart', (_: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      this.isDragging = true;
      obj.setDepth(10);
      this.stirDetector.reset();
      this.circleDetector.reset();
    });

    this.input.on('drag', (ptr: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      obj.x = ptr.x;
      obj.y = ptr.y;

      const info = this.cm.getStepInfo();

      if (info.action === 'STIR') {
        const done = this.stirDetector.update(ptr.x);
        if (done) this.advanceStir();
      }

      if (info.action === 'CIRCLE_STIR') {
        const done = this.circleDetector.update(CAULDRON_X, CAULDRON_Y, ptr.x, ptr.y);
        if (done) this.advanceCircleStir(obj.getData('id') as string);
      }
    });

    this.input.on('dragend', (_: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      this.isDragging = false;
      const id = obj.getData('id') as string;
      const info = this.cm.getStepInfo();

      if (info.action === 'ADD_ITEM' && info.itemId === id) {
        const dist = Phaser.Math.Distance.Between(obj.x, obj.y, CAULDRON_X, CAULDRON_Y);
        if (dist < 120) {
          this.doAction('ADD_ITEM', id);
        }
      }

      if (info.action === 'FILTER_OUT' && info.itemId === id) {
        if (obj.x < 160 || obj.x > W - 160) {
          this.doAction('FILTER_OUT', id);
        }
      }

      this.returnIngredient(obj);
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const info = this.cm.getStepInfo();

      if (info.action === 'ADD_DROP_5' && info.itemId) {
        const ing = this.findIngredient(info.itemId);
        if (ing) {
          const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, ing.x, ing.y);
          if (dist < 40) {
            this.dropCount++;
            this.showDropEffect(CAULDRON_X, CAULDRON_Y - 60);
            if (this.dropCount >= 5) {
              this.dropCount = 0;
              this.doAction('ADD_DROP_5', info.itemId);
            }
          }
        }
      }
    });

    this.ingredients.forEach(img => {
      img.on('pointerdown', () => {
        const info = this.cm.getStepInfo();
        if (info.action !== 'CHOP_CRUSH') return;
        if (info.itemId !== img.getData('id')) return;

        this.chopCount++;
        this.tweens.add({
          targets: img, scaleX: 0.6, scaleY: 0.6, duration: 80, yoyo: true,
        });

        if (this.chopCount >= 3) {
          this.chopCount = 0;
          this.doAction('CHOP_CRUSH', img.getData('id') as string);
        }
      });
    });

    // EXTRACT 버튼
    const extractBtn = this.add.text(CAULDRON_X, CAULDRON_Y + 130, '💧 추출', {
      fontSize: '20px', color: '#00ffcc', backgroundColor: '#003322',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);
    extractBtn.setName('extractBtn');

    extractBtn.on('pointerdown', () => {
      const info = this.cm.getStepInfo();
      if (info.action === 'EXTRACT') {
        this.doAction('EXTRACT');
      }
    });
  }

  private findIngredient(id: string): Phaser.GameObjects.Image | null {
    return this.ingredients.find(i => i.getData('id') === id) ?? null;
  }

  private returnIngredient(img: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: img,
      x: img.getData('homeX') as number,
      y: img.getData('homeY') as number,
      duration: 200,
      ease: 'Back.Out',
      onComplete: () => img.setDepth(0),
    });
  }

  private doAction(action: CraftAction, itemId?: string): void {
    if (this.isChilling) return;

    const result = this.cm.processStep(action, itemId);

    if (!result.success) {
      this.showFailEffect();
      return;
    }

    this.showSuccessEffect();
    this.stirDetector.reset();
    this.circleDetector.reset();

    if (result.isComplete) {
      this.onRecipeComplete();
      return;
    }

    const info = this.cm.getStepInfo();
    if (info.action === 'CHILL' && info.chillMs) {
      this.startChill(info.chillMs);
    } else {
      this.refreshUI();
    }
  }

  private advanceStir(): void {
    if (this.isChilling || this.isDragging) return;
    const info = this.cm.getStepInfo();
    if (info.action !== 'STIR') return;
    this.doAction('STIR');
  }

  private advanceCircleStir(itemId: string): void {
    if (this.isChilling) return;
    const info = this.cm.getStepInfo();
    if (info.action !== 'CIRCLE_STIR') return;
    this.doAction('CIRCLE_STIR', itemId);
  }

  private startChill(ms: number): void {
    this.isChilling = true;
    this.sound.play('bubble', { volume: 0.6, loop: false });
    this.refreshUI();

    const bar = this.add.rectangle(CAULDRON_X, CAULDRON_Y - 120, 160, 16, 0x003366);
    const fill = this.add.rectangle(CAULDRON_X - 80, CAULDRON_Y - 120, 0, 14, 0x64c8ff).setOrigin(0, 0.5);

    this.tweens.add({
      targets: fill,
      width: 160,
      duration: ms,
      ease: 'Linear',
      onComplete: () => {
        bar.destroy();
        fill.destroy();
        this.isChilling = false;
        this.doAction('CHILL');
      },
    });
  }

  private showSuccessEffect(): void {
    this.sound.play('whoosh', { volume: 0.5 });
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0x00ff88, 0.3);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    const txt = this.add.text(CAULDRON_X, CAULDRON_Y - 80, '✓', {
      fontSize: '40px', color: '#00ff88',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: CAULDRON_Y - 140, alpha: 0, duration: 600,
      onComplete: () => txt.destroy(),
    });
  }

  private showFailEffect(): void {
    this.cameras.main.shake(300, 0.01);
    const txt = this.add.text(CAULDRON_X, CAULDRON_Y - 80, '✕ 잘못된 순서!', {
      fontSize: '22px', color: '#ff4444',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: CAULDRON_Y - 140, alpha: 0, duration: 800,
      onComplete: () => {
        txt.destroy();
        this.restartRecipe();
      },
    });
  }

  private showDropEffect(x: number, y: number): void {
    const drop = this.add.circle(x + Phaser.Math.Between(-20, 20), y, 6, 0x64c8ff);
    this.tweens.add({
      targets: drop, y: y + 60, alpha: 0, duration: 400,
      onComplete: () => drop.destroy(),
    });
    const countTxt = this.add.text(x + 30, y, `${this.dropCount}/5`, {
      fontSize: '14px', color: '#64c8ff',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: countTxt, alpha: 0, duration: 600,
      onComplete: () => countTxt.destroy(),
    });
  }

  private refreshUI(): void {
    const info = this.cm.getStepInfo();
    this.stepText.setText(`${info.step}/${info.total}`);
    this.descText.setText(info.description);
    this.hintText.setText(this.isChilling ? '❄️ ' + info.hint : info.hint);

    const extractBtn = this.children.getByName('extractBtn') as Phaser.GameObjects.Text | null;
    if (extractBtn) {
      extractBtn.setVisible(info.action === 'EXTRACT');
    }

    this.ingredients.forEach(img => {
      const isActive = img.getData('id') === info.itemId;
      img.setAlpha(isActive || !info.itemId ? 1 : 0.5);
      img.setScale(isActive ? 1.0 : 0.85);
    });
  }

  private restartRecipe(): void {
    this.cm.reset();
    this.stirDetector.reset();
    this.circleDetector.reset();
    this.isChilling = false;
    this.chopCount = 0;
    this.dropCount = 0;
    if (this.chillTimer) {
      this.chillTimer.destroy();
      this.chillTimer = null;
    }
    this.refreshUI();
  }

  private onRecipeComplete(): void {
    this.registry.set('potionCrafted', true);

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(20);
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 500 });

    this.add.text(W / 2, H / 2 - 100, '🔥 불꽃 돌풍\n물약 완성! 🔥', {
      fontSize: '28px', color: '#ff6420', align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(21);

    this.add.image(W / 2, H / 2 + 20, 'potion_flame_gale').setScale(2.5).setDepth(21);

    const nextBtn = this.add.text(W / 2, H / 2 + 130, '모험 시작 →', {
      fontSize: '22px', color: '#ffffff', backgroundColor: '#333300',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21);

    nextBtn.on('pointerdown', () => {
      this.scene.start('AdventureScene');
    });
  }
}
