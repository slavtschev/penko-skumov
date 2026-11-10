/**
 * The viewer, over the series page.
 *
 * Every photograph has its own address and its own page -- that is how
 * the viewer is built, and a direct link, a shared link or a reader with
 * no JavaScript still gets that page. But opening a photograph from the
 * grid should not feel like leaving: the reader clicked a picture that
 * is already on the screen. So the click is taken here instead. The
 * frame's own page is fetched, its `.viewer` lifted out and shown over
 * the grid, and the address bar is moved to match, so Back closes and
 * every frame still has its URL.
 *
 * The photograph is on screen before anything is fetched: the grid's
 * thumbnail is already decoded, so it goes up at full size, under the
 * full-size photograph, which replaces it when it has arrived. Nothing
 * moves or scales -- the plate is its final size from the first frame.
 */
import { revealFrames } from './reveal';

const parser = new DOMParser();

/** `.viewer` of each frame's page, fetched once and kept */
const pages = new Map<string, Promise<HTMLElement | null>>();

const fetchViewer = (href: string) => {
  let pending = pages.get(href);
  if (!pending) {
    pending = fetch(href, { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.text() : Promise.reject()))
      .then((html) =>
        parser.parseFromString(html, 'text/html').querySelector<HTMLElement>('.viewer'),
      )
      .catch(() => null);
    pages.set(href, pending);
  }
  return pending;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function mountViewerOverlay(seriesHref: string) {
  const cells = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.cell[href]'));
  if (!cells.length || !window.history.pushState) return;

  let overlay: HTMLElement | null = null;
  let current = '';
  let opener: HTMLElement | null = null;
  let token = 0;

  /** the grid's own thumbnail for a frame, already decoded */
  const thumb = (href: string) =>
    document.querySelector<HTMLImageElement>(`a.cell[href="${CSS.escape(href)}"] img`);

  /** the photograph on screen at once, before its page has been fetched */
  const skeleton = (image: HTMLImageElement | null) => {
    const viewer = document.createElement('div');
    viewer.className = 'viewer';
    const stage = document.createElement('div');
    stage.className = 'stage';
    const plate = document.createElement('div');
    plate.className = 'plate';
    const frame = document.createElement('div');
    frame.className = 'frame in cut';
    const box = document.createElement('div');
    box.className = 'box';
    if (image) {
      const ratio = image.naturalWidth / image.naturalHeight;
      stage.style.setProperty('--plate-ratio', String(+ratio.toFixed(6)));
      frame.style.setProperty('--ratio', String(+ratio.toFixed(6)));
      box.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
    }
    frame.append(box);
    plate.append(frame);
    stage.append(plate);
    viewer.append(stage);
    return viewer;
  };

  /** carry the decoded thumbnail under whatever is still arriving */
  const underlay = (root: ParentNode, image: HTMLImageElement | null) => {
    if (!image) return;
    const box = root.querySelector<HTMLElement>('.box');
    if (box) box.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
  };

  const trap = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !overlay) return;
    const stops = Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!stops.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const on = document.activeElement;
    if (event.shiftKey && (on === first || !overlay.contains(on))) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && on === last) {
      first.focus();
      event.preventDefault();
    }
  };

  const keys = (event: KeyboardEvent) => {
    if (!overlay) return;
    if (event.key === 'Tab') return trap(event);
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const { previous, next } = overlay.querySelector<HTMLElement>('.viewer')?.dataset ?? {};
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowLeft' && previous) go(previous);
    else if (event.key === 'ArrowRight' && next) go(next);
    else return;
    event.preventDefault();
  };

  /** show a frame in the overlay, opening it if it is not up yet */
  const show = async (href: string) => {
    const image = thumb(href);
    const mine = ++token;
    current = href;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'viewer-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Photograph');
      document.body.append(overlay);
      document.addEventListener('keydown', keys);
    }

    const waiting = pages.get(href);
    const ready = waiting ? await Promise.race([waiting, Promise.resolve('pending')]) : 'pending';

    if (ready === 'pending') {
      overlay.replaceChildren(skeleton(image));
      const viewer = await fetchViewer(href);
      if (mine !== token) return;
      if (viewer) {
        overlay.replaceChildren(viewer);
        underlay(viewer, image);
      }
    } else if (ready) {
      const viewer = (ready as HTMLElement).cloneNode(true) as HTMLElement;
      overlay.replaceChildren(viewer);
      underlay(viewer, image);
    } else {
      /* the page could not be fetched: let the browser have the click */
      window.location.href = href;
      return;
    }

    revealFrames(overlay);
    overlay.querySelector<HTMLElement>('.viewer-close')?.focus();

    /* the neighbours, so the step along is a cut */
    const { previous, next } = overlay.querySelector<HTMLElement>('.viewer')?.dataset ?? {};
    for (const neighbour of [next, previous]) if (neighbour) fetchViewer(neighbour);
  };

  const go = (href: string) => {
    history.pushState({ viewer: href }, '', href);
    void show(href);
  };

  const close = () => {
    if (!overlay) return;
    token++;
    overlay.remove();
    overlay = null;
    current = '';
    document.removeEventListener('keydown', keys);
    history.pushState({}, '', seriesHref);
    opener?.focus();
    opener = null;
  };

  /* open from the grid */
  for (const cell of cells) {
    const warm = () => fetchViewer(cell.href);
    cell.addEventListener('pointerenter', warm);
    cell.addEventListener('focus', warm);
    cell.addEventListener('pointerdown', warm);
    cell.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = cell;
      history.pushState({ viewer: cell.href }, '', cell.href);
      void show(cell.href);
    });
  }

  /* Close, the series link, Previous, Next and the photograph itself */
  document.addEventListener('click', (event) => {
    if (!overlay) return;
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || !overlay.contains(link)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const href = new URL(link.href).pathname;
    event.preventDefault();
    if (href === seriesHref) close();
    else go(href);
  });

  /* swipe, for the phone */
  let startX = 0;
  let startY = 0;
  document.addEventListener(
    'touchstart',
    (event) => {
      if (!overlay) return;
      startX = event.changedTouches[0].clientX;
      startY = event.changedTouches[0].clientY;
    },
    { passive: true },
  );
  document.addEventListener(
    'touchend',
    (event) => {
      if (!overlay) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      const { previous, next } = overlay.querySelector<HTMLElement>('.viewer')?.dataset ?? {};
      const to = dx < 0 ? next : previous;
      if (to) go(to);
    },
    { passive: true },
  );

  /* Back, Forward, and the address bar */
  window.addEventListener('popstate', () => {
    const here = window.location.pathname;
    if (here === current) return;
    if (here === seriesHref) {
      if (!overlay) return;
      token++;
      overlay.remove();
      overlay = null;
      current = '';
      document.removeEventListener('keydown', keys);
      opener?.focus();
      opener = null;
    } else if (here.startsWith(seriesHref)) {
      void show(here);
    } else {
      window.location.reload();
    }
  });
}
