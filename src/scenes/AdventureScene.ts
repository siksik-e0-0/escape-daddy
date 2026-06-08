import Phaser from 'phaser';
import { PlayerWeapon } from '../systems/PlayerWeapon.js';

const W = 480;
const H = 854;
const GROUND_Y = H - 60;
const PLAYER_SPEED = 200;
const JUMP_VEL = -480;
const BARRIER_X = W - 60;

export class AdventureScene extends Phaser.Scene {
  private weapon!: PlayerWeapon;
  private player!: Phaser.Physics.Arcade.Sprite;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private barrier!: Phaser.Physics.Arcade.StaticGroup;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;

  private barrierHp = 100;
  private barrierHpBar!: Phaser.GameObjects.Rectangle;
  private barrierHpBg!: Phaser.GameObjects.Rectangle;

  private potionIcon!: Phaser.GameObjects.Image;
  private potionUsed = false;
  private fireCD = 0;

  constructor() {
    super({ key: 'AdventureScene' });
  }

  create(): void {
    this.weapon = new PlayerWeapon();
    const crafted = this.registry.get('potionCrafted') as boolean | undefined;
    if (crafted) this.weapon.unlock();

    this.add.image(W / 2, H / 2, 'bg_adventure').setDisplaySize(W, H).setDepth(-1);

    this.makeTerrain();
    this.makeBarrier();
    this.makePlayer();
    this.makeProjectiles();
    this.makeUI();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.physics.add.overlap(
      this.projectiles,
      this.barrier,
      this.onHitBarrier as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    if (!crafted) {
      this.add.text(W / 2, 100, '⚠ 물약을 먼저\n만들어야 합니다!', {
        fontSize: '16px', color: '#ff8888', align: 'center',
      }).setOrigin(0.5);
    }
  }

  private makeTerrain(): void {
    // 반투명 오버레이로 배경 이미지와 게임 요소 분리
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.25);
    // 지면
    this.add.rectangle(W / 2, GROUND_Y + 30, W, 60, 0x3a2800, 0.7);
    // 발판 (세로 화면 맞게 배치)
    [[100, 600], [240, 520], [380, 600]].forEach(([x, y]) => {
      this.add.rectangle(x, y, 90, 14, 0x5a4a00);
    });
    // 나무
    for (let i = 0; i < 3; i++) {
      const tx = 80 + i * 170;
      this.add.rectangle(tx, GROUND_Y - 50, 14, 100, 0x4a2800, 0.8);
      this.add.circle(tx, GROUND_Y - 110, 32, 0x2a6a2a, 0.8);
    }
  }

  private makeBarrier(): void {
    this.barrier = this.physics.add.staticGroup();
    for (let i = 0; i < 5; i++) {
      const tile = this.barrier.create(BARRIER_X, H / 2 - 200 + i * 100, 'barrier_tile') as Phaser.Physics.Arcade.Image;
      tile.setScale(1);
      tile.refreshBody();
    }
  }

  private makePlayer(): void {
    this.player = this.physics.add.sprite(60, GROUND_Y - 40, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(400);

    const ground = this.physics.add.staticImage(W / 2, GROUND_Y + 10, '__DEFAULT');
    ground.setVisible(false);
    ground.setDisplaySize(W, 20);
    ground.refreshBody();
    this.physics.add.collider(this.player, ground);
  }

  private makeProjectiles(): void {
    this.projectiles = this.physics.add.group();
  }

  private makeUI(): void {
    // HP 바 (상단)
    this.add.rectangle(90, 24, 164, 20, 0x440000).setScrollFactor(0);
    this.add.rectangle(12, 16, 160, 16, 0x00cc44).setOrigin(0, 0).setScrollFactor(0);
    this.add.text(12, 36, 'HP', { fontSize: '11px', color: '#ffffff' }).setScrollFactor(0);

    // 장벽 HP 바
    this.barrierHpBg = this.add.rectangle(BARRIER_X, 30, 100, 14, 0x440000);
    this.barrierHpBar = this.add.rectangle(BARRIER_X - 50, 24, 100, 12, 0xcc44cc).setOrigin(0, 0);
    this.add.text(BARRIER_X, 14, '장벽', { fontSize: '12px', color: '#cc88ff' }).setOrigin(0.5);

    // 포션 아이콘 (우상단)
    const crafted = this.registry.get('potionCrafted') as boolean | undefined;
    this.potionIcon = this.add.image(W - 36, 40, 'potion_flame_gale').setScale(0.7);
    if (!crafted) this.potionIcon.setAlpha(0.3);

    const potionBtn = this.add.text(W - 36, 68, 'E: 사용', {
      fontSize: '12px', color: '#ffcc00',
    }).setOrigin(0.5);
    if (!crafted) potionBtn.setAlpha(0.3);

    this.input.keyboard!.on('keydown-E', () => {
      this.usePotion();
    });

    // 모드 텍스트 (중앙 상단)
    this.add.text(W / 2, 16, '', { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5)
      .setName('modeText');
    this.updateModeText();

    // 터치 버튼 UI (하단)
    this.makeTouchControls();
  }

  private makeTouchControls(): void {
    const btnY = H - 40;
    const btnAlpha = 0.5;

    // 좌/우 이동
    const leftBtn = this.add.text(50, btnY, '◀', {
      fontSize: '36px', color: '#ffffff', backgroundColor: '#333333',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAlpha(btnAlpha).setInteractive({ useHandCursor: true }).setScrollFactor(0);

    const rightBtn = this.add.text(160, btnY, '▶', {
      fontSize: '36px', color: '#ffffff', backgroundColor: '#333333',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAlpha(btnAlpha).setInteractive({ useHandCursor: true }).setScrollFactor(0);

    const jumpBtn = this.add.text(W / 2, btnY, '↑', {
      fontSize: '36px', color: '#00ff88', backgroundColor: '#003322',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAlpha(btnAlpha).setInteractive({ useHandCursor: true }).setScrollFactor(0);

    const fireBtn = this.add.text(W - 60, btnY, '🔥', {
      fontSize: '32px', backgroundColor: '#440000',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAlpha(btnAlpha).setInteractive({ useHandCursor: true }).setScrollFactor(0);

    // 터치 상태 추적
    leftBtn.on('pointerdown', () => this.touchLeft = true);
    leftBtn.on('pointerup', () => this.touchLeft = false);
    leftBtn.on('pointerout', () => this.touchLeft = false);

    rightBtn.on('pointerdown', () => this.touchRight = true);
    rightBtn.on('pointerup', () => this.touchRight = false);
    rightBtn.on('pointerout', () => this.touchRight = false);

    jumpBtn.on('pointerdown', () => { this.touchJump = true; });
    jumpBtn.on('pointerup', () => this.touchJump = false);

    fireBtn.on('pointerdown', () => {
      if (this.fireCD <= 0) {
        this.fireCD = 300;
        this.spawnProjectile();
      }
    });
  }

  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;

  private usePotion(): void {
    if (this.potionUsed) return;
    const crafted = this.registry.get('potionCrafted') as boolean | undefined;
    if (!crafted) return;

    this.potionUsed = true;
    this.registry.set('potionConsumed', true);
    this.weapon.unlock();
    this.potionIcon.setAlpha(0.3);
    this.updateModeText();

    const txt = this.add.text(W / 2, H / 2, '🔥 불꽃 돌풍 발동!', {
      fontSize: '24px', color: '#ff6420',
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: txt, y: H / 2 - 80, alpha: 0, duration: 1000,
      onComplete: () => txt.destroy(),
    });
  }

  private updateModeText(): void {
    const modeText = this.children.getByName('modeText') as Phaser.GameObjects.Text | null;
    if (modeText) {
      modeText.setText(this.weapon.hasFlame ? '🔥 불꽃 모드' : '💨 바람 모드');
      modeText.setColor(this.weapon.hasFlame ? '#ff6420' : '#c8f0a0');
    }
  }

  update(time: number, delta: number): void {
    this.fireCD -= delta;
    this.handleMovement();
    this.handleFire(time);
    this.cleanupProjectiles();
  }

  private handleMovement(): void {
    const onGround = this.player.body!.touching.down || (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;

    const goLeft = this.cursors.left.isDown || this.touchLeft;
    const goRight = this.cursors.right.isDown || this.touchRight;
    const goJump = this.cursors.up.isDown || this.touchJump;

    if (goLeft) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (goRight) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (goJump && onGround) {
      this.player.setVelocityY(JUMP_VEL);
      this.touchJump = false;
    }
  }

  private handleFire(_time: number): void {
    if (!Phaser.Input.Keyboard.JustDown(this.fireKey)) return;
    if (this.fireCD > 0) return;
    this.fireCD = 300;
    this.spawnProjectile();
  }

  private spawnProjectile(): void {
    this.sound.play('whoosh', { volume: 0.3, rate: 1.4 });
    const stats = this.weapon.stats;
    const dir = this.player.flipX ? -1 : 1;

    const g = this.add.graphics();
    g.fillStyle(stats.color, 1);
    g.fillCircle(stats.radius, stats.radius, stats.radius);
    const texKey = this.weapon.hasFlame ? 'proj_flame' : 'proj_wind';
    if (!this.textures.exists(texKey)) {
      g.generateTexture(texKey, stats.radius * 2, stats.radius * 2);
    }
    g.destroy();

    const proj = this.physics.add.image(
      this.player.x + dir * 30,
      this.player.y - 10,
      texKey,
    ) as Phaser.Physics.Arcade.Image;

    proj.setVelocityX(stats.speed * dir);
    proj.setGravityY(-400);
    proj.setData('damage', stats.damage);

    this.projectiles.add(proj);
  }

  private onHitBarrier(
    proj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _barrier: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const projImg = proj as Phaser.Physics.Arcade.Image;
    const dmg = (projImg.getData('damage') as number | undefined) ?? 10;
    this.barrierHp = Math.max(0, this.barrierHp - dmg);
    projImg.destroy();

    const ratio = this.barrierHp / 100;
    this.barrierHpBar.setDisplaySize(100 * ratio, 12);

    if (this.barrierHp <= 0) {
      this.destroyBarrier();
    }
  }

  private destroyBarrier(): void {
    this.barrier.clear(true, true);
    this.barrierHpBg.destroy();
    this.barrierHpBar.destroy();

    this.sound.play('bang', { volume: 0.8 });
    this.cameras.main.shake(400, 0.02);

    const txt = this.add.text(W / 2, H / 2, '💥 장벽 파괴!', {
      fontSize: '28px', color: '#ffff00',
    }).setOrigin(0.5).setDepth(10);

    this.time.delayedCall(1200, () => {
      txt.destroy();
      this.scene.start('RescueScene');
    });
  }

  private cleanupProjectiles(): void {
    this.projectiles.getChildren().forEach(obj => {
      const img = obj as Phaser.Physics.Arcade.Image;
      if (img.x > W + 50 || img.x < -50) img.destroy();
    });
  }
}
