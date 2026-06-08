import Phaser from 'phaser';

const W = 480;
const H = 854;

const INGREDIENT_IDS = [
  'ing_floating_leaf',
  'ing_wind_herb',
  'ing_water_fruit',
  'ing_strong_berry',
  'ing_shinsen_water',
  'ing_flame_herb',
  'ing_wing_fruit',
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    for (const id of INGREDIENT_IDS) {
      this.load.image(id, `assets/sprites/${id}.png`);
    }

    this.load.image('bg_adventure', 'assets/sprites/bg_adventure.png');
    this.load.image('bg_alchemy', 'assets/sprites/bg_alchemy.png');

    this.load.audio('bubble', 'assets/audio/bubble.ogg');
    this.load.audio('whoosh', 'assets/audio/whoosh.ogg');
    this.load.audio('bang', 'assets/audio/bang.ogg');

    const bar = this.add.rectangle(W / 2, H / 2, 300, 16, 0x333355);
    const fill = this.add.rectangle(W / 2 - 150, H / 2, 0, 14, 0x6464ff).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 24, '로딩 중...', { fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);

    this.load.on('progress', (v: number) => { fill.width = 300 * v; });
    this.load.on('complete', () => { bar.destroy(); fill.destroy(); });
  }

  create(): void {
    // 재료 이미지는 preload에서 로드됨 — Canvas 생성 생략
    this.makeCauldronTexture();
    this.makePlayerTexture();
    this.makeBarrierTexture();
    this.makeDadTexture();
    this.makePotionTexture();
    this.makeIceBoxTexture();

    const text = this.add.text(W / 2, H / 2, '불꽃 돌풍\n로딩 중...', {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.scene.start('AlchemyScene');
      },
    });
  }

  private makeCauldronTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // 솥 몸통
    g.fillStyle(0x444444, 1);
    g.fillEllipse(80, 70, 140, 90);
    g.fillStyle(0x333333, 1);
    g.fillRect(20, 60, 120, 60);
    // 다리
    g.fillStyle(0x222222, 1);
    g.fillRect(28, 110, 12, 30);
    g.fillRect(120, 110, 12, 30);
    g.fillRect(74, 115, 12, 25);
    // 테두리
    g.lineStyle(3, 0x888888, 1);
    g.strokeEllipse(80, 70, 140, 90);
    // 액체
    g.fillStyle(0x4096e0, 0.7);
    g.fillEllipse(80, 68, 110, 50);
    // 손잡이
    g.fillStyle(0x555555, 1);
    g.fillRect(0, 55, 20, 12);
    g.fillRect(140, 55, 20, 12);

    g.generateTexture('cauldron', 160, 150);
    g.destroy();
  }

  private makePlayerTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // 몸
    g.fillStyle(0x4080ff, 1);
    g.fillRect(12, 24, 24, 28);
    // 머리
    g.fillStyle(0xffcc88, 1);
    g.fillCircle(24, 18, 14);
    // 눈
    g.fillStyle(0x000000, 1);
    g.fillCircle(19, 16, 3);
    g.fillCircle(29, 16, 3);
    // 팔
    g.fillStyle(0x4080ff, 1);
    g.fillRect(0, 26, 12, 8);
    g.fillRect(36, 26, 12, 8);
    // 다리
    g.fillStyle(0x2060cc, 1);
    g.fillRect(14, 50, 10, 14);
    g.fillRect(26, 50, 10, 14);

    g.generateTexture('player', 48, 64);
    g.destroy();
  }

  private makeBarrierTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8844cc, 0.8);
    g.fillRect(0, 0, 24, 120);
    g.lineStyle(2, 0xcc88ff, 1);
    for (let y = 10; y < 120; y += 20) {
      g.lineBetween(4, y, 20, y);
    }
    g.generateTexture('barrier_tile', 24, 120);
    g.destroy();
  }

  private makeDadTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // 몸
    g.fillStyle(0xff8844, 1);
    g.fillRect(10, 26, 28, 30);
    // 머리
    g.fillStyle(0xffcc88, 1);
    g.fillCircle(24, 18, 16);
    // 수염
    g.fillStyle(0x886644, 1);
    g.fillRect(12, 24, 24, 8);
    // 눈
    g.fillStyle(0x000000, 1);
    g.fillCircle(18, 15, 3);
    g.fillCircle(30, 15, 3);
    // 다리
    g.fillStyle(0x664422, 1);
    g.fillRect(12, 54, 10, 14);
    g.fillRect(26, 54, 10, 14);
    // 팔 (묶인 모습)
    g.fillStyle(0xff8844, 1);
    g.fillRect(0, 28, 10, 8);
    g.fillRect(38, 28, 10, 8);
    // 밧줄
    g.lineStyle(3, 0xcc8844, 1);
    g.strokeRect(6, 22, 36, 40);

    g.generateTexture('dad', 48, 68);
    g.destroy();
  }

  private makePotionTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // 병 몸통
    g.fillStyle(0xff4500, 0.9);
    g.fillCircle(20, 28, 18);
    // 병 목
    g.fillStyle(0xcc3300, 1);
    g.fillRect(13, 8, 14, 14);
    // 병 마개
    g.fillStyle(0x886644, 1);
    g.fillRect(11, 4, 18, 6);
    // 빛반사
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(13, 22, 6);
    // 테두리
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeCircle(20, 28, 18);

    g.generateTexture('potion_flame_gale', 40, 48);
    g.destroy();
  }

  private makeIceBoxTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // 상자
    g.fillStyle(0xaaddff, 0.9);
    g.fillRoundedRect(0, 0, 120, 90, 8);
    g.lineStyle(3, 0x6699cc, 1);
    g.strokeRoundedRect(0, 0, 120, 90, 8);
    // 얼음 결정 (십자 + 대각선)
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(56, 30, 8, 30);
    g.fillRect(45, 41, 30, 8);
    // 뚜껑
    g.fillStyle(0x88bbdd, 0.8);
    g.fillRoundedRect(0, 0, 120, 20, { tl: 8, tr: 8, bl: 0, br: 0 });

    g.generateTexture('ice_box', 120, 90);
    g.destroy();
  }
}
