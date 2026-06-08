import sharp from 'sharp';
import { resolve } from 'path';

const SRC = '/opt/discord-gw/data/data/uploads/1B40D89C-A44B-43F8-96A8-73710B0E53FA-1780902319722.png';
const OUT = resolve(import.meta.dirname, '../public/assets/sprites');

const W = 704;
const CROP_H = 1253; // 704 / (480/854) = 1253 → perfect portrait ratio
const TARGET_W = 480;
const TARGET_H = 854;

await sharp(SRC)
  .extract({ left: 0, top: 0, width: W, height: CROP_H })
  .resize(TARGET_W, TARGET_H, { fit: 'fill' })
  .toFile(`${OUT}/bg_adventure.png`);
console.log('bg_adventure.png 생성 완료');

await sharp(SRC)
  .extract({ left: 0, top: 1521 - CROP_H, width: W, height: CROP_H })
  .resize(TARGET_W, TARGET_H, { fit: 'fill' })
  .toFile(`${OUT}/bg_alchemy.png`);
console.log('bg_alchemy.png 생성 완료');
