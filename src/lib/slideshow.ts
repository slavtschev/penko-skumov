/**
 * The slideshow engine, shared by the Home and the Contact wall.
 *
 * "Cut and dissolve": a slide fades in, holds, fades out, and only then
 * does the next begin -- the page is bare for an instant between them,
 * which is what the handoff asks for and what makes the rhythm read.
 *
 * Driven from script rather than CSS keyframes, because the clock has to
 * start when the first photograph has decoded, stop under the pointer,
 * and restart when someone moves by hand.
 */

export interface Slide {
  el: HTMLElement;
  /** how long this one stays at full opacity, in ms */
  hold: number;
}

export interface SlideshowOptions {
  slides: Slide[];
  /** the dissolve in and out of an automatic change */
  inMs?: number;
  outMs?: number;
  /** the very first slide comes up more slowly */
  firstInMs?: number;
  /** by hand: the current one leaves faster, the next arrives as usual */
  manualOutMs?: number;
  manualInMs?: number;
  onChange?: (index: number, slide: Slide) => void;
  /** called with the next index so its photograph can be fetched early */
  preload?: (index: number) => void;
}

export interface Slideshow {
  readonly index: number;
  readonly paused: boolean;
  next(): void;
  previous(): void;
  toggle(): boolean;
  /** hold the frame without changing the Pause word: hover, focus */
  hold(on: boolean): void;
  start(): void;
}

const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function slideshow(options: SlideshowOptions): Slideshow {
  const {
    slides,
    inMs = 600,
    outMs = 600,
    firstInMs = 1000,
    manualOutMs = 300,
    manualInMs = 600,
    onChange,
    preload,
  } = options;

  const cut = reduced();
  let index = 0;
  let paused = cut; // reduced motion: shown, but never advancing
  let holding = false;
  let timer: number | undefined;
  /** what is left of the current wait, so a hold can resume it */
  let remaining = 0;
  let startedAt = 0;
  let step: (() => void) | undefined;

  const show = (el: HTMLElement, ms: number) => {
    el.style.transitionDuration = `${cut ? 0 : ms}ms`;
    el.style.opacity = '1';
    el.hidden = false;
  };

  const hide = (el: HTMLElement, ms: number) => {
    el.style.transitionDuration = `${cut ? 0 : ms}ms`;
    el.style.opacity = '0';
  };

  const wait = (ms: number, then: () => void) => {
    step = then;
    remaining = cut ? 0 : ms;
    startedAt = Date.now();
    window.clearTimeout(timer);
    if (paused || holding) return;
    timer = window.setTimeout(() => {
      step = undefined;
      then();
    }, remaining);
  };

  const pauseClock = () => {
    if (timer === undefined) return;
    window.clearTimeout(timer);
    timer = undefined;
    remaining = Math.max(0, remaining - (Date.now() - startedAt));
  };

  const resumeClock = () => {
    if (paused || holding || !step || timer !== undefined) return;
    startedAt = Date.now();
    const then = step;
    timer = window.setTimeout(() => {
      step = undefined;
      then();
    }, remaining);
  };

  /** in -> hold -> out -> the next one */
  const run = (fadeIn: number) => {
    const slide = slides[index];
    onChange?.(index, slide);
    preload?.((index + 1) % slides.length);
    show(slide.el, fadeIn);

    wait(fadeIn + slide.hold, () => {
      hide(slide.el, outMs);
      wait(outMs, () => {
        slide.el.hidden = true;
        index = (index + 1) % slides.length;
        run(inMs);
      });
    });
  };

  const jump = (to: number) => {
    const current = slides[index];
    window.clearTimeout(timer);
    timer = undefined;
    step = undefined;
    hide(current.el, manualOutMs);
    const leaving = current.el;
    window.setTimeout(
      () => {
        leaving.hidden = true;
      },
      cut ? 0 : manualOutMs,
    );
    index = (to + slides.length) % slides.length;
    window.setTimeout(
      () => {
        if (paused) {
          const slide = slides[index];
          onChange?.(index, slide);
          preload?.((index + 1) % slides.length);
          show(slide.el, manualInMs);
        } else {
          run(manualInMs);
        }
      },
      cut ? 0 : manualOutMs,
    );
  };

  for (const [i, slide] of slides.entries()) {
    slide.el.hidden = i !== 0;
    slide.el.style.opacity = i === 0 ? '0' : '0';
  }

  return {
    get index() {
      return index;
    },
    get paused() {
      return paused;
    },
    start() {
      run(firstInMs);
    },
    next() {
      jump(index + 1);
    },
    previous() {
      jump(index - 1);
    },
    toggle() {
      paused = !paused;
      if (paused) pauseClock();
      else if (!step) run(inMs);
      else resumeClock();
      return paused;
    },
    hold(on: boolean) {
      holding = on;
      if (on) pauseClock();
      else resumeClock();
    },
  };
}
