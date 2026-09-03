import { animate, stagger } from 'animejs';

/**
 * Kinetic typography and entrance animations powered by anime.js v4
 */

export function animateHeroTypography(titleSelector: string, subtitleSelector?: string) {
  try {
    const titleEl = document.querySelector(titleSelector);
    if (titleEl && !titleEl.getAttribute('data-animated')) {
      titleEl.setAttribute('data-animated', 'true');
      
      animate(titleSelector, {
        translateY: [24, 0],
        opacity: [0, 1],
        ease: 'outExpo',
        duration: 900,
        delay: 100,
      });
    }

    if (subtitleSelector) {
      const subEl = document.querySelector(subtitleSelector);
      if (subEl && !subEl.getAttribute('data-animated')) {
        subEl.setAttribute('data-animated', 'true');

        animate(subtitleSelector, {
          translateY: [16, 0],
          opacity: [0, 1],
          ease: 'outQuad',
          duration: 800,
          delay: 300,
        });
      }
    }
  } catch (err) {
    console.warn('Anime typography animation skipped:', err);
  }
}

export function animateStaggerCards(cardsSelector: string) {
  try {
    const cards = document.querySelectorAll(cardsSelector);
    if (cards.length > 0) {
      animate(cardsSelector, {
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        ease: 'outCubic',
        duration: 650,
        delay: stagger(60, { start: 100 }),
      });
    }
  } catch (err) {
    console.warn('Anime card animation skipped:', err);
  }
}

export function animatePulseSuccess(element: HTMLElement | null) {
  if (!element) return;
  try {
    animate(element, {
      scale: [1, 1.04, 1],
      ease: 'inOutQuad',
      duration: 450,
    });
  } catch (err) {
    console.warn('Anime pulse skipped:', err);
  }
}

export function animateProgressBar(barElement: HTMLElement | null, toPercent: number) {
  if (!barElement) return;
  try {
    animate(barElement, {
      width: `${toPercent}%`,
      ease: 'outExpo',
      duration: 350,
    });
  } catch (err) {
    console.warn('Anime progress bar skipped:', err);
  }
}
