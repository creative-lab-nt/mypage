import fs from 'node:fs/promises';
import path from 'node:path';

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) {
  console.error('[ERROR] 環境変数 UNSPLASH_ACCESS_KEY が未設定です。PowerShell 例: $env:UNSPLASH_ACCESS_KEY="<YOUR_ACCESS_KEY>"');
  process.exit(1);
}

const headers = {
  Authorization: 'Client-ID ' + KEY,
  'Accept-Version': 'v1',
};

function parseArgs(argv) {
  const args = {
    in: 'public/index.html',
    out: 'public/index.html',
    mapping: 'scripts/image-mapping.json',
    publicPrefix: process.env.PUBLIC_PREFIX || '/mypage/public',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.in = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--mapping') args.mapping = argv[++i];
    else if (a === '--publicPrefix') args.publicPrefix = argv[++i];
  }
  return args;
}

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }
function escapeRegExp(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function upsertAttr(tagStart, name, value) {
  const re = new RegExp(`(\\s${name}=)("[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  if (re.test(tagStart)) return tagStart.replace(re, () => ` ${name}="${value}"`);
  return `${tagStart} ${name}="${value}"`;
}

function getAttr(tagStart, name) {
  const re = new RegExp(`${name}=("([^"]*)"|'([^']*)'|([^\s>]+))`, 'i');
  const m = tagStart.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? '';
}

function setStyleProp(styleStr, prop, value) {
  const parts = (styleStr || '').split(';').map(s => s.trim()).filter(Boolean);
  const filtered = parts.filter(p => !p.toLowerCase().startsWith(prop.toLowerCase() + ':'));
  filtered.push(`${prop}: ${value}`);
  return filtered.join('; ') + ';';
}

function computeDims(conf) {
  let w = Number(conf.w) || 1920;
  let h = Number(conf.h) || null;
  if (!h && conf.ar && /^(\d+)\s*:\s*(\d+)$/.test(conf.ar)) {
    const [, aw, ah] = conf.ar.match(/^(\d+)\s*:\s*(\d+)$/);
    h = Math.round((w * Number(ah)) / Number(aw));
  }
  return { w, h };
}

async function searchPhoto({ query, orientation }) {
  const qp = new URLSearchParams({
    query: String(query || ''),
    per_page: '10',
    order_by: 'relevant',
    content_filter: 'high',
  });
  if (orientation) qp.set('orientation', orientation);
  const url = 'https://api.unsplash.com/search/photos?' + qp.toString();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Search failed: ' + res.status + ' ' + (await res.text()));
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error('No results for query: ' + query);
  return data.results[0];
}

async function recordDownload(photo) {
  const res = await fetch(photo.links.download_location, { headers });
  if (!res.ok) throw new Error('Download record failed: ' + res.status + ' ' + (await res.text()));
}

async function downloadImage(photo, dims) {
  const { w, h } = dims;
  const p = new URL(photo.urls.raw);
  if (h) {
    p.searchParams.set('fit', 'crop');
    p.searchParams.set('crop', 'entropy');
    p.searchParams.set('w', String(w));
    p.searchParams.set('h', String(h));
  } else {
    p.searchParams.set('fit', 'max');
    p.searchParams.set('w', String(w));
  }
  p.searchParams.set('q', '80');
  p.searchParams.set('fm', 'webp');
  p.searchParams.set('auto', 'format');
  const imgRes = await fetch(p.toString());
  if (!imgRes.ok) throw new Error('Image fetch failed: ' + imgRes.status + ' ' + (await imgRes.text()));
  const buf = Buffer.from(await imgRes.arrayBuffer());
  return { buf, ext: 'webp', width: w, height: h || null };
}

function sanitizePart(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function readJsonIfExists(file, fallback) {
  if (await exists(file)) {
    const raw = await fs.readFile(file, 'utf8');
    try { return JSON.parse(raw); } catch { return fallback; }
  }
  return fallback;
}

async function writeAttributionRoot(file, items) {
  const prev = await readJsonIfExists(file, []);
  const byPlacement = new Map((prev || []).map(x => [x.placement, x]));
  for (const it of items) byPlacement.set(it.placement, it);
  const out = Array.from(byPlacement.values());
  await fs.writeFile(file, JSON.stringify(out, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  const mappingPath = args.mapping;

  if (!(await exists(mappingPath))) {
    await ensureDir(path.dirname(mappingPath));
    const template = {
      hero: { query: 'modern minimal workspace desk, light, wide', alt: 'モダンなワークスペース', w: 1920, h: 1080, target: 'bg' },
      concerns: { query: 'abstract minimal texture gray', alt: '抽象的な質感の背景', w: 1600, h: 900, target: 'bg' },
      points: { query: 'abstract gradient shapes blue purple', alt: '抽象的なグラデーション', w: 1600, h: 900, target: 'bg' },
      pricing: { query: 'geometric pattern light background', alt: '幾何学模様の背景', w: 1600, h: 900, target: 'bg' },
      closing: { query: 'team collaboration minimal light', alt: 'チームのコラボレーション', w: 1600, h: 900, target: 'bg' },
      profile: { query: 'developer workspace laptop minimal', alt: '開発者のワークスペース', w: 1600, h: 900, target: 'bg' },
      faq: { query: 'question mark pattern minimal', alt: 'クエスチョンマークの抽象背景', w: 1600, h: 900, target: 'bg' }
    };
    await fs.writeFile(mappingPath, JSON.stringify(template, null, 2));
  }

  const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));

  const inHtml = args.in;
  if (!(await exists(inHtml))) {
    console.error(`[ERROR] 入力HTMLが見つかりません: ${inHtml}`);
    process.exit(1);
  }
  const outHtml = args.out;
  await ensureDir(path.dirname(outHtml));
  await ensureDir('public/images');

  let html = await fs.readFile(inHtml, 'utf8');

  const attributions = [];
  for (const [key, conf] of Object.entries(mapping)) {
    const dims = computeDims(conf);
    const photo = await searchPhoto({ query: conf.query, orientation: (dims.h ? undefined : 'landscape') });
    await recordDownload(photo);
    const { buf, ext, width, height } = await downloadImage(photo, dims);

    const username = sanitizePart(photo.user && (photo.user.username || photo.user.name));
    const filename = `${key}-${username}-${photo.id}-w${width}${height ? `x${height}` : ''}.${ext}`;
    const fileOnDisk = path.join('public', 'images', filename);
    await fs.writeFile(fileOnDisk, buf);

    const webPath = `${args.publicPrefix}/images/${filename}`.replace(/\\/g, '/');
    const altText = String(conf.alt || photo.alt_description || photo.description || '').trim();

    // 必要ならセクションIDから自動で data-image-key/bg を付与
    const reBgPre = new RegExp(`(<[^>]*\\bid=\"${escapeRegExp(key)}\"[^>]*)(>)`, 'i');
    const reImgKey = new RegExp(`data-image-key=\"${escapeRegExp(key)}\"`, 'i');
    if (!reImgKey.test(html) && reBgPre.test(html)) {
      html = html.replace(reBgPre, (m, start, end) => {
        let tag = start;
        tag = upsertAttr(tag, 'data-image-key', key);
        tag = upsertAttr(tag, 'data-image-target', 'bg');
        return tag + end;
      });
    }

    // data-image-key="key" の差し替え（img）
    const reImg = new RegExp(`(<img[^>]*\\bdata-image-key=\"${escapeRegExp(key)}\"[^>]*)(>)`, 'i');
    if (reImg.test(html)) {
      html = html.replace(reImg, (m, start, end) => {
        let tag = start;
        tag = upsertAttr(tag, 'src', webPath);
        const altOld = getAttr(tag, 'alt');
        if (!altOld || !String(altOld).trim()) tag = upsertAttr(tag, 'alt', altText);
        tag = upsertAttr(tag, 'loading', 'lazy');
        if (width) tag = upsertAttr(tag, 'width', String(width));
        if (height) tag = upsertAttr(tag, 'height', String(height));
        return tag + end;
      });
    }

    // data-image-target="bg" の差し替え
    const reBg = new RegExp(`(<[^>]+\\bdata-image-key=\"${escapeRegExp(key)}\"[^>]*\\bdata-image-target=\"bg\"[^>]*)(>)`, 'i');
    if (reBg.test(html)) {
      html = html.replace(reBg, (m, start, end) => {
        let tag = start;
        const curStyle = getAttr(tag, 'style') || '';
        let newStyle = setStyleProp(curStyle, 'background-image', `url('${webPath}')`);
        newStyle = setStyleProp(newStyle, 'background-size', 'cover');
        newStyle = setStyleProp(newStyle, 'background-position', 'center');
        newStyle = setStyleProp(newStyle, 'background-repeat', 'no-repeat');
        const styleRe = /(\sstyle=)("[^"]*"|'[^']*'|[^\s>]+)/i;
        if (styleRe.test(tag)) tag = tag.replace(styleRe, '');
        tag = upsertAttr(tag, 'style', newStyle);
        return tag + end;
      });
    }

    attributions.push({
      placement: key,
      id: photo.id,
      file: webPath,
      title: photo.description || photo.alt_description || '',
      author: photo.user && photo.user.name,
      username: photo.user && photo.user.username,
      url: photo.links && photo.links.html,
      source: 'Unsplash',
      license: 'Unsplash License',
      query: conf.query,
    });
    console.log(`[OK] ${key}: ${webPath} に保存・適用しました。`);
  }

  await fs.writeFile(outHtml, html);
  await writeAttributionRoot('attribution.json', attributions);
  console.log(`[DONE] 出力: ${outHtml} / 画像: public/images/ / クレジット: attribution.json`);
}

main().catch((e) => { console.error('[FATAL]', e.message || e); process.exit(1); });
