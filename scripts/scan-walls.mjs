// scan-walls.mjs — relê src/img/wallpapers/ e regenera src/js/data/walls.js.
// Rode sempre que adicionar/remover papéis de parede:
//   node scripts\scan-walls.mjs
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dir = resolve(import.meta.dirname, '..', 'src', 'img', 'wallpapers');
const out = resolve(import.meta.dirname, '..', 'src', 'js', 'data', 'walls.js');
const ok = /\.(jpe?g|png|webp)$/i;

let files = [];
try { files = (await readdir(dir)).filter(f => ok.test(f)).sort(); } catch (e) {}

const body = '/* walls.js — lista de papeis de parede em src/img/wallpapers/.\n' +
  ' * Gerado por scripts/scan-walls.mjs. Nao edite a mao. */\n' +
  'window.WALLS = [\n' + files.map(f => '  "img/wallpapers/' + f + '",').join('\n') + '\n];\n';
await writeFile(out, body, 'utf8');
console.log(files.length + ' papel(eis) de parede: ' + (files.join(', ') || '(nenhum — usara os gradientes)'));
