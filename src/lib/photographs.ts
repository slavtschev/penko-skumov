/**
 * The photographs, as Astro image assets.
 *
 * The files live in source/images/, which fetch-source.mjs fills and git
 * ignores -- 128MB of someone else's JPEGs does not belong in the history,
 * and they are placeholders anyway until Penko supplies originals of
 * 2560px and wider. Importing them here (rather than putting them in
 * public/) is what lets Astro make the AVIF and WebP.
 *
 *   npm run source:images
 */
/*
 * Lazy on purpose. An eager glob references all 179 files, so Astro copies
 * every one into dist whether a page uses it or not -- 133MB of build for
 * eight photographs on screen. Lazily, only what is asked for is emitted.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../../source/images/*.{jpg,jpeg,JPG,png}',
);

const byName = new Map<string, () => Promise<{ default: ImageMetadata }>>();
for (const [path, load] of Object.entries(files)) {
  byName.set(path.slice(path.lastIndexOf('/') + 1), load);
}

/** The asset for a frame's `file`, or undefined if it has not been fetched. */
export async function photograph(file: string): Promise<ImageMetadata | undefined> {
  const load = byName.get(file);
  return load ? (await load()).default : undefined;
}

export const photographCount = byName.size;
