import Phaser from 'phaser';

const W = 480;
const H = 854;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 로딩 바
    const bar = this.add.rectangle(W / 2, H / 2, 300, 16, 0x333333);
    const fill = this.add.rectangle(W / 2 - 150, H / 2, 0, 14, 0x44aa44).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 30, '공장 키우기', {
      fontSize: '28px', color: '#cccccc', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 30, '로딩 중...', {
      fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => { fill.width = 300 * v; });
    this.load.on('complete', () => { bar.destroy(); fill.destroy(); });
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
