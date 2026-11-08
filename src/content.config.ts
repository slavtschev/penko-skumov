import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * The content, as written by scripts/import-webflow.mjs from the old site.
 *
 * A field the old site has no answer for is null rather than absent or
 * invented: `place`, `year` and `alt` on every frame, the statements and
 * epigraphs several series never had, the quotation's source. The import's
 * closing report lists them, and that list is what goes back to Penko.
 */

const group = z.enum(['projects', 'archive']);

const series = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/series' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    /** display string, en dash, open-ended ranges end in one: "2018–2020", "2018–" */
    years: z.string(),
    group,
    order: z.number().int().positive(),
    epigraph: z.string().nullable(),
    statement: z.string().nullable(),
    /** id of the frame the Projects list shows under the pointer */
    cover: z.string().nullable(),
    /** the old .html this series lived at, for the redirect */
    legacyPage: z.string().nullable(),
  }),
});

const frames = defineCollection({
  loader: file('./src/content/frames.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    id: z.string(),
    series: z.string(),
    order: z.number().int().positive(),
    file: z.string(),
    /** the photograph's own proportions; frames are never cropped */
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    place: z.string().nullable(),
    year: z.string().nullable(),
    alt: z.string().nullable(),
  }),
});

const home = defineCollection({
  loader: file('./src/content/home.json'),
  schema: z.object({
    quotation: z.string(),
    quotationSource: z.string().nullable(),
    slides: z.array(
      z.discriminatedUnion('kind', [
        z.object({ n: z.number().int().positive(), kind: z.literal('quotation') }),
        z.object({
          n: z.number().int().positive(),
          kind: z.literal('photograph'),
          caption: z.string(),
          series: z.string().nullable(),
          file: z.string().nullable(),
          width: z.number().int().positive().nullable(),
          height: z.number().int().positive().nullable(),
        }),
      ]),
    ),
  }),
});

export const collections = { series, frames, home };
