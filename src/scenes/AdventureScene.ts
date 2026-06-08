import Phaser from 'phaser';
import { PlayerWeapon } from '../systems/PlayerWeapon.js';

const W = 960;
const H = 540;
const GROUND_Y = H - 40;
const PLAYER_SPEED = 220;
const JUMP_VEL = -480;
const BARRIER_X = W - 100;

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

    this.cameras.main.setBackgroundColor(0x1a3a1a);

    // 포션 사용 안내
    if (!crafted) {
      this.add.text(W / 2, 80, '⚠ 물약을 먼저 만들어야 합니다!', {
        fontSize: '16px', color: '#ff8888', align: 'center',
      }).setOrigin(0.5);
    }
  }

  private makeTerrain(): void {
    // 하늘
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a4a1a);
    // 지면
    this.add.rectangle(W / 2, GROUND_Y + 30, W, 60, 0x3a2800);
    // 발판
    [[200, 380], [420, 300], [640, 360]].forEach(([x, y]) => {
      this.add.rectangle(x, y, 100, 16, 0x5a4a00);
    });
    // 나무
    for (let i = 0; i < 5; i++) {
      const tx = 80 + i * 180;
      this.add.rectangle(tx, GROUND_Y - 40, 16, 80, 0x4a2800);
      this.add.circle(tx, GROUND_Y - 100, 36, 0x2a6a2a);
    }
  }

  private makeBarrier(): void {
    this.barrier = this.physics.add.staticGroup();
    for (let i = 0; i < 4; i++) {
      const tile = this.barrier.create(BARRIER_X, H / 2 - 150 + i * 120, 'barrier_tile') as Phaser.Physics.Arcade.Image;
      tile.setScale(1);
      tile.refreshBody();
    }
  }

  private makePlayer(): void {
    this.player = this.physics.add.sprite(100, GROUND_Y - 40, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(400);

    // 가상 지면 충돌
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
    // HP 바
    this.add.rectangle(90, 24, 164, 20, 0x440000).setScrollFactor(0);
    this.add.rectangle(12, 16, 160, 16, 0x00cc44).setOrigin(0, 0).setScrollFactor(0);
    this.add.text(12, 36, 'HP', { fontSize: '11px', color: '#ffffff' }).setScrollFactor(0);

    // 장벽 HP 바
    this.barrierHpBg = this.add.rectangle(BARRIER_X, 30, 120, 14, 0x440000);
    this.barrierHpBar = this.add.rectangle(BARRIER_X - 60, 24, 120, 12, 0xcc44cc).setOrigin(0, 0);
    this.add.text(BARRIER_X, 14, '장벽', { fontSize: '12px', color: '#cc88ff' }).setOrigin(0.5);

    // 포션 아이콘
    const crafted = this.registry.get('potionCrafted') as boolean | undefined;
    this.potionIcon = this.add.image(W - 50, 40, 'potion_flame_gale').setScale(0.8);
    if (!crafted) this.potionIcon.setAlpha(0.3);

    const potionBtn = this.add.text(W - 50, 70, 'E: 사용', {
      fontSize: '12px', color: '#ffcc00',
    }).setOrigin(0.5);

    if (!crafted) potionBtn.setAlpha(0.3);

    this.input.keyboard!.on('keydown-E', () => {
      this.usePotion();
    });

    // 모드 표시
    this.add.text(W / 2, 16, '', { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5)
      .setName('modeText');
    this.updateModeText();
  }

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
      fontSize: '28px', color: '#ff6420',
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: txt, y: H / 2 - 80, alpha: 0, duration: 1000,
      onComplete: () => txt.destroy(),
    });
  }

  private updateModeText(): void {
    const modeText = this.children.getByName('modeText') as Phaser.GameObjects.Text | null;
    if (modeText) {
      modeText.setText(this.weapon.hasFlame ? '🔥 불꽃 돌풍 모드' : '💨 바람 모드');
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

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(JUMP_VEL);
    }
  }

  private handleFire(_time: number): void {
    if (!Phaser.Input.Keyboard.JustDown(this.fireKey) && !this.cursors.right.isDown) return;
    if (this.fireCD > 0) return;

    if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
      this.fireCD = 300;
      this.spawnProjectile();
    }
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
    this.barrierHpBar.setDisplaySize(120 * ratio, 12);

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

    const txt = this.add.text(BARRIER_X, H / 2, '💥 장벽 파괴!', {
      fontSize: '32px', color: '#ffff00',
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
