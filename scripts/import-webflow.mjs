/**
 * Turn the mirrored Webflow site into content collections.
 *
 * Reads source/pages/*.html and source/dimensions.json (see
 * fetch-source.mjs) and writes src/content/. Run it again whenever the
 * source changes; it overwrites what it owns and nothing else.
 *
 *   node scripts/import-webflow.mjs
 *
 * It never invents content. Where the old site has no answer -- a frame's
 * place and year, alt text, Vertical Summer's statement -- the field is
 * written as null and counted in the report at the end, which is the list
 * to take back to Penko.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FILE_FIXES } from './source-fixes.mjs';

const SRC = new URL('../source/', import.meta.url).pathname;
const OUT = new URL('../src/content/', import.meta.url).pathname;

/**
 * The twelve series, as the Designs 4 boards name and date them. Titles and
 * date ranges are normalised here rather than taken from the old pages,
 * which disagree with themselves ("Days at sea", "Saints are here with us",
 * "2018 - 2020"). `page` is the old file; Film Archive is on the index with
 * no page of its own.
 */
const SERIES = [
  ['days-at-sea', 'Days at Sea', '2018–2020', 'projects', 'days-at-sea'],
  ['six-days-on-an-island', 'Six Days on an Island', '2019', 'projects', 'six-days-on-an-island'],
  ['tabula-rasa', 'Tabula Rasa', '2018–', 'projects', 'tabula-rasa'],
  ['sense-of-freedom', 'Sense of Freedom', '2020', 'projects', 'sense-of-freedom'],
  ['the-festival', 'The Festival', '2020–', 'projects', 'the-festival'],
  ['coincidance', 'CoinciDANCE', '2019–2023', 'projects', 'coincidence'],
  ['flat-world', 'Flat World', '2019–2024', 'projects', 'flat-world'],
  ['vertical-summer', 'Vertical Summer', '2023', 'projects', 'vertical-summer'],
  ['film-archive', 'Film Archive', '2014–2018', 'archive', null],
  ['read-between-the-lines', 'Read Between the Lines', '2004', 'archive', 'read-between-the-lines'],
  ['saints-are-here-with-us', 'Saints Are Here With Us', '2001–2004', 'archive', 'saints'],
  ['lith-prints', 'Lith Prints', '2010–2015', 'archive', 'lith-prints'],
];

const notes = [];
const note = (what) => notes.push(what);

const entities = (s) =>
  s
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;| /g, ' ').replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');

/** Tag soup to text, keeping <br> as a line break and dropping the ZWJs Webflow pads with. */
const text = (html) =>
  entities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/‍/g, '')
    .split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
    .trim();

const first = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : null;
};

const page = async (name) => readFile(join(SRC, 'pages', `${name}.html`), 'utf8');
const dimensions = JSON.parse(await readFile(join(SRC, 'dimensions.json'), 'utf8'));

/** The photographs inside .project-content, in the order the page sets them. */
function framesOn(html) {
  const start = html.indexOf('project-content');
  if (start < 0) return [];
  const body = html.slice(start);
  const files = [];
  for (const m of body.matchAll(/<img[^>]+src="images\/([^"]+)"/g)) {
    const file = FILE_FIXES[m[1]] ?? m[1];
    if (/-p-\d+\.|_Thumbnail|_Preview/i.test(file)) continue;
    if (!files.includes(file)) files.push(file);
  }
  return files;
}

/**
 * The epigraph is the quotation the page opens with, the statement is
 * Penko's own text under it. Webflow marks the epigraph as <em> on most
 * pages; where it does not, a single short line ending in an attribution
 * is an epigraph too, and the classification is reported either way.
 */
function prose(html, slug) {
  const raw = first(html, /<p class="paragraph">([\s\S]*?)<\/p>/);
  if (!raw) {
    note(`${slug}: no epigraph and no statement on the old page`);
    return { epigraph: null, statement: null };
  }
  const em = first(raw, /<em>([\s\S]*?)<\/em>/);
  if (em) {
    const epigraph = text(em);
    const statement = text(raw.replace(/<em>[\s\S]*?<\/em>/, '')) || null;
    if (!statement) note(`${slug}: epigraph only, no statement`);
    return { epigraph, statement };
  }
  const whole = text(raw);
  if (whole.length < 200 && /\s[-–—]\s/.test(whole)) {
    note(`${slug}: the one paragraph reads as an epigraph (quotation and attribution), taken as one — confirm`);
    return { epigraph: whole, statement: null };
  }
  note(`${slug}: statement only, no epigraph`);
  return { epigraph: null, statement: whole };
}

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'series'), { recursive: true });

const frames = [];
const seriesOut = [];

for (const [index, [slug, title, years, group, source]] of SERIES.entries()) {
  let epigraph = null;
  let statement = null;
  let files = [];

  if (source && existsSync(join(SRC, 'pages', `${source}.html`))) {
    const html = await page(source);
    ({ epigraph, statement } = prose(html, slug));
    files = framesOn(html);
    const ownYears = text(first(html, /<div class="project-date">([\s\S]*?)<\/div>/) ?? '');
    const normalised = ownYears.replace(/\s*-\s*/g, '–');
    if (normalised && normalised !== years) {
      note(`${slug}: its page says "${ownYears}", the boards say "${years}" — using the boards`);
    }
  } else {
    note(`${slug}: no page on the old site, so no frames, epigraph or statement`);
  }

  for (const [i, file] of files.entries()) {
    const size = dimensions[file];
    if (!size) { note(`${slug}: no size for ${file}, frame skipped`); continue; }
    frames.push({
      id: `${slug}-${String(i + 1).padStart(2, '0')}`,
      series: slug,
      order: i + 1,
      file,
      width: size.width,
      height: size.height,
      place: null,
      year: null,
      alt: null,
    });
  }

  seriesOut.push({
    slug, title, years, group,
    order: index + 1,
    epigraph,
    statement,
    cover: files.length ? `${slug}-01` : null,
    legacyPage: source ? `${source}.html` : null,
  });
}

for (const series of seriesOut) {
  await writeFile(join(OUT, 'series', `${series.slug}.json`), JSON.stringify(series, null, 2) + '\n');
}
await writeFile(join(OUT, 'frames.json'), JSON.stringify(frames, null, 1) + '\n');

/* ---- the Home edit ---------------------------------------------------
 * Thirteen slides in a fixed order, read off D4-Home: its captions and
 * series links are the design, not something the old site holds. Each
 * slide names the frame it shows where that is unambiguous; the rest are
 * null for Penko to choose, since the board identifies them only by the
 * picture.
 */
const HOME = [
  { caption: 'Sunny Beach, Bulgaria, 2020', file: 'Sunny-Beach-May-2020.jpg' },
  { caption: 'Vertical Summer, 2023', series: 'vertical-summer', portrait: true },
  { caption: 'Pomorie, Bulgaria, 2021', file: 'Pomorie_August_2021.jpg' },
  { caption: 'London, United Kingdom, 2019', series: 'six-days-on-an-island' },
  { caption: 'Rhodope Mountains, Bulgaria, 2019', file: 'Rhodope-mountains-May-2019.jpg' },
  { quotation: true },
  { caption: 'Sofia, Bulgaria, 2019', file: 'Sofia-13-July-2019.jpg' },
  { caption: 'Bucharest, Romania, 2019', file: 'Bucharest-15-September-2019.jpg' },
  { caption: 'Sofia, Bulgaria, 2020', file: 'Sofia-September-2020.jpg' },
  { caption: 'Pomorie, Bulgaria, 2017', file: 'Penko_Skumov_Pomorie_August_2017.jpg' },
  { caption: 'Vertical Summer, 2023', series: 'vertical-summer', portrait: true },
  { caption: 'Pomorie, Bulgaria, 2018–2020', series: 'days-at-sea' },
  { caption: 'Pomorie, Bulgaria, 2018–2020', series: 'days-at-sea' },
];

const QUOTATION =
  '“The photographer’s wandering is a metaphor for the road as an adventure; it is a journey ' +
  'through which the wonders of the world are revealed. It is a metaphor for ordinary life – a life ' +
  'that we experience with our eyes wide open, looking for the extraordinary. Meandering the streets of ' +
  'the world, the photographer is a drifter who drinks up faces, gestures, light and shadow, and always ' +
  'encounters familiar places afresh. Nothing stays the same in the flow of time. In this sense, ' +
  'photography is a tool for unravelling the mysteries of the world and the spirit of the times. It is ' +
  'an ‘armed eye’ that manages to see into the flash of the moment that there is something ' +
  'beyond banality, beyond nonsense and more than is visible to the ‘naked eye.’”';

const slides = HOME.map((slide, i) => {
  const n = i + 1;
  if (slide.quotation) return { n, kind: 'quotation' };
  const size = slide.file ? dimensions[slide.file] : null;
  if (slide.file && !size) note(`home slide ${n}: no size for ${slide.file}`);
  if (!slide.file) {
    note(`home slide ${n} (${slide.caption}): the board shows a ${slide.portrait ? 'portrait ' : ''}frame from ${slide.series} but does not say which — Penko to pick`);
  }
  return {
    n,
    kind: 'photograph',
    caption: slide.caption,
    series: slide.series ?? null,
    file: slide.file ?? null,
    width: size?.width ?? null,
    height: size?.height ?? null,
  };
});

// keyed, because the file loader reads a bare object's top-level keys as
// separate entries; this is one entry, with the id "home"
await writeFile(
  join(OUT, 'home.json'),
  JSON.stringify({ home: { quotation: QUOTATION, quotationSource: null, slides } }, null, 1) + '\n',
);

/* ---- shapes ----------------------------------------------------------
 * Frames are never cropped, so a series' grid follows its own proportion.
 * Report each series' shape, and any frame that does not share it: more
 * than the 0.45% an integer box costs means a genuinely different crop,
 * which the series grid has to make room for.
 */
const shapes = [];
for (const series of seriesOut) {
  const own = frames.filter((f) => f.series === series.slug);
  if (!own.length) continue;
  const ratios = own.map((f) => f.width / f.height);
  const common = ratios.sort((a, b) => a - b)[Math.floor(ratios.length / 2)];
  const odd = own.filter((f) => Math.abs(f.width / f.height - common) / common > 0.0045);
  shapes.push([series.slug, common, own[0].width < own[0].height ? 'portrait' : 'landscape', odd]);
  for (const f of odd) {
    note(`${series.slug}: ${f.file} is ${(f.width / f.height).toFixed(3)}:1 where the series is ${common.toFixed(3)}:1 \u2014 too far out to be box rounding`);
  }
}

/* ---- report ---------------------------------------------------------- */
const withSize = frames.length;
const placed = frames.filter((f) => f.place).length;
const alt = frames.filter((f) => f.alt).length;
const named = slides.filter((s) => s.kind === 'photograph' && s.file).length;

console.log(`\n${seriesOut.length} series, ${withSize} frames, ${slides.length} home slides\n`);
for (const series of seriesOut) {
  const n = frames.filter((f) => f.series === series.slug).length;
  const gaps = [!series.epigraph && 'epigraph', !series.statement && 'statement', !n && 'frames'].filter(Boolean);
  console.log(`  ${series.slug.padEnd(24)} ${String(n).padStart(3)} frames  ${gaps.length ? 'missing: ' + gaps.join(', ') : ''}`);
}
console.log(`\nShape of each series (frames are never cropped):`);
for (const [slug, ratio, orientation, odd] of shapes) {
  console.log(`  ${slug.padEnd(24)} ${ratio.toFixed(3)}:1 ${orientation.padEnd(10)}${odd.length ? `${odd.length} frame(s) out` : ''}`);
}

console.log(`\nStill to come from Penko:`);
console.log(`  place and year  ${placed}/${withSize} frames have them`);
console.log(`  alt text        ${alt}/${withSize} frames have it`);
console.log(`  home slides     ${named}/12 photographs identified`);
console.log(`  quotation source: unknown`);
console.log(`\nNotes (${notes.length}):`);
for (const n of notes) console.log(`  - ${n}`);
