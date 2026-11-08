/**
 * Image references on the old site that point at a file that is not there.
 * Shared by fetch-source.mjs (so the real file gets measured) and
 * import-webflow.mjs (so the content points at it).
 *
 *  07_Saint.jpg                 the Saints series is 01..08_Saints.jpg; this
 *                               one reference drops the s and 404s
 *  Skumov_Lith_Print_01.jpg.png the Archive page's Lith Prints thumbnail has
 *                               a doubled extension and 404s
 */
export const FILE_FIXES = {
  '07_Saint.jpg': '07_Saints.jpg',
  'Skumov_Lith_Print_01.jpg.png': 'Skumov_Lith_Print_01.jpg',
};
