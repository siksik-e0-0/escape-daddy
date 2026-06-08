import Phaser from 'phaser';

const W = 960;
const H = 540;

export class RescueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RescueScene' });
  }

  create(): void {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1e);

    this.makeStarfield();
    this.playRescueSequence();
  }

  private makeStarfield(): void {
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.Between(1, 3);
      const star = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.4, 1));
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000),
      });
    }
  }

  private playRescueSequence(): void {
    // 아빠 캐릭터 등장
    const dad = this.add.image(W / 2, H / 2 + 20, 'dad').setScale(2).setAlpha(0);
    this.tweens.add({ targets: dad, alpha: 1, duration: 800, delay: 200 });

    // 밧줄 끊기 효과
    this.time.delayedCall(1000, () => {
      this.cameras.main.flash(300, 255, 200, 0);

      // 빛 파동
      const ring = this.add.circle(W / 2, H / 2, 10, 0xffcc00, 0.8).setDepth(5);
      this.tweens.add({
        targets: ring,
        radius: 200,
        alpha: 0,
        duration: 600,
        onComplete: () => ring.destroy(),
      });
    });

    // 자유로워진 아빠
    this.time.delayedCall(1400, () => {
      dad.setTexture('dad');
      dad.setTint(0xffff88);

      // 별 파티클 효과
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const star = this.add.star(
          W / 2 + Math.cos(angle) * 80,
          H / 2 + Math.sin(angle) * 60,
          5, 4, 10,
          0xffd700,
        ).setDepth(6);
        this.tweens.add({
          targets: star,
          x: W / 2 + Math.cos(angle) * 200,
          y: H / 2 + Math.sin(angle) * 150,
          alpha: 0,
          scale: 0,
          duration: 800,
          delay: i * 30,
          onComplete: () => star.destroy(),
        });
      }
    });

    // 엔딩 텍스트
    this.time.delayedCall(2200, () => {
      this.add.text(W / 2, 80, '🎉 아빠를 구했어요! 🎉', {
        fontSize: '36px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }).setOrigin(0.5).setDepth(10);

      this.add.text(W / 2, 150, '불꽃 돌풍 물약의 힘으로\n장벽을 부수고 아빠를 구했습니다!', {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5).setDepth(10);

      // 트로피 효과
      const trophy = this.add.text(W / 2, H / 2 + 120, '🏆', {
        fontSize: '60px',
      }).setOrigin(0.5).setDepth(10).setAlpha(0);

      this.tweens.add({
        targets: trophy,
        alpha: 1,
        y: H / 2 + 100,
        duration: 600,
        ease: 'Back.Out',
      });
    });

    // 재시작 버튼
    this.time.delayedCall(3500, () => {
      const restartBtn = this.add.text(W / 2, H - 80, '다시 하기 🔄', {
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#333344',
        padding: { x: 24, y: 12 },
      }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

      restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#555566'));
      restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#333344'));
      restartBtn.on('pointerdown', () => {
        this.registry.set('potionCrafted', false);
        this.registry.set('potionConsumed', false);
        this.scene.start('AlchemyScene');
      });

      // 크레딧
      this.add.text(W / 2, H - 30, '기획/디자인: 딸 ❤️  개발: 아빠 + Claude', {
        fontSize: '13px',
        color: '#888888',
      }).setOrigin(0.5).setDepth(10);
    });
  }
}
