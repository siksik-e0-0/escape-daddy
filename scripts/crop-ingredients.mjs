import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = '/opt/discord-gw/data/data/uploads/9B4BB70E-BDF6-4F4B-AA57-F63264255332-1780900813684.jpg';
const OUT = path.join(__dirname, '../public/assets/sprites');

// 이미지: 211 × 1152, 재료 7개
// 각 블록 높이 = 1152 / 7 ≈ 164.5
const W = 211;
const H = 1152;
const COUNT = 7;
const BLOCK_H = Math.floor(H / COUNT);

const INGREDIENTS = [
  'ing_floating_leaf',
  'ing_wind_herb',
  'ing_water_fruit',
  'ing_strong_berry',
  'ing_shinsen_water',
  'ing_flame_herb',
  'ing_wing_fruit',
];

async function run() {
  for (let i = 0; i < COUNT; i++) {
    const top = i * BLOCK_H;
    const height = (i === COUNT - 1) ? H - top : BLOCK_H;
    const outFile = path.join(OUT, `${INGREDIENTS[i]}.png`);

    await sharp(SRC)
      .extract({ left: 0, top, width: W, height })
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outFile);

    console.log(`크롭 완료: ${INGREDIENTS[i]} (y=${top}, h=${height}) → ${outFile}`);
  }
}

run().catch(console.error);
