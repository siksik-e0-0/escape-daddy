import Phaser from 'phaser';

const W = 480;
const H = 854;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 황무지 배경 (임시)
    this.add.rectangle(W / 2, H / 2, W, H, 0x8b6914);

    this.add.text(W / 2, H / 2, '공장 키우기\n개발 중...', {
      fontSize: '24px', color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
  }
}
