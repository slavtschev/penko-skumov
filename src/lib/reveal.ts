/**
 * Dissolve each photograph in when it has decoded.
 *
 * A cached image can be complete before this runs -- and inside the
 * viewer overlay the markup arrives long after the page did -- so check
 * that first and cut it in instead: it did not arrive, so there is
 * nothing to dissolve. `decode()` resolves once the pixels are ready to
 * paint, which `load` alone does not promise.
 */
export function revealFrames(root: ParentNode = document) {
  for (const frame of root.querySelectorAll<HTMLElement>('.frame')) {
    if (frame.classList.contains('in')) continue;
    const img = frame.querySelector('img');
    if (!img) continue;

    if (img.complete && img.naturalWidth > 0) {
      frame.classList.add('cut', 'in');
      continue;
    }

    img
      .decode()
      .then(() => frame.classList.add('in'))
      .catch(() => frame.classList.add('in')); // a broken photograph should not stay invisible
  }
}
