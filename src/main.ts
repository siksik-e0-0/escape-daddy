import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { AlchemyScene } from './scenes/AlchemyScene.js';
import { AdventureScene } from './scenes/AdventureScene.js';
import { RescueScene } from './scenes/RescueScene.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#0a0a1e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, AlchemyScene, AdventureScene, RescueScene],
};

new Phaser.Game(config);
