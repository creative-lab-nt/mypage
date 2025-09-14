import { readFileSync, writeFileSync } from 'node:fs';

const mappings = [
  { key: 'steps/step-1', base: 'images/steps/step-1' },
  { key: 'steps/step-2', base: 'images/steps/step-2' },
  { key: 'steps/step-3', base: 'images/steps/step-3' },
  { key: 'steps/step-4', base: 'images/steps/step-4' },
  { key: 'steps/step-5', base: 'images/steps/step-5' },
  { key: 'steps/step-6', base: 'images/steps/step-6' },
  { key: 'steps/step-7', base: 'images/steps/step-7' },
  { key: 'works/work-1', base: 'images/works/work-1' },
  { key: 'works/work-2', base: 'images/works/work-2' },
  { key: 'works/work-3', base: 'images/works/work-3' },
];

const srcset = (base) =>
  `srcset="./${base}-w480.jpg 480w, ./${base}-w768.jpg 768w, ./${base}-w1080.jpg 1080w, ./${base}-w1440.jpg 1440w, ./${base}-w1920.jpg 1920w" sizes="(min-width: 1024px) 960px, 100vw"`;

// Update index.html
let html = readFileSync('public/index.html', 'utf8');
for (const { key, base } of mappings) {
  const [folder, name] = key.split('/');
  const localDefault = `./${base}-w1080.jpg`;
  // Replace existing local svg or remote unsplash/picsum to local responsive set
  const regex = new RegExp(`(<picture[^>]*>\s*<img[^>]*src=")(?:[^"]*${name}[^\"]*|https?:[^\"]*)("[^>]*>)`, 'g');
  html = html.replace(regex, `$1${localDefault}" ${srcset(base)}$2`);
}
writeFileSync('public/index.html', html, 'utf8');

// Update main.js: remove Unsplash auto-replace block if present
let js = readFileSync('public/main.js', 'utf8');
js = js.replace(/\/\/ 画像の自動差し替え（Unsplash Source）[\s\S]*?\(\)\;\n?/, '');
writeFileSync('public/main.js', js, 'utf8');

console.log('Updated index.html to local srcset images and removed Unsplash auto-replace.');

