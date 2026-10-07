import './style.css';
import { gsap } from 'gsap';
import { applyProfile } from './config.js';
import { createScene } from './three/scene.js';
import { createNetwork } from './three/network.js';
import { createParticles } from './three/particles.js';
import { createInteractions } from './three/interactions.js';
import { createScrollSystem } from './animations/scroll.js';

applyProfile();

const root = document.documentElement;
const loader = document.querySelector('[data-loader]');
const loaderBar = document.querySelector('[data-loader-bar]');
const loaderValue = document.querySelector('[data-loader-value]');
const compact = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
let pageVisible = !document.hidden;
let dirty = true;
let destroyed = false;

const setLoadProgress = (value) => {
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  if (loaderBar) loaderBar.style.width = `${progress}%`;
  if (loaderValue) loaderValue.textContent = `${String(progress).padStart(3, '0')}%`;
};

setLoadProgress(18);

function setupNavigation() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  const menuLinks = [...document.querySelectorAll('[data-nav-link]')];

  const closeMenu = () => {
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open navigation');
    menu?.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  const onToggle = () => {
    const open = toggle?.getAttribute('aria-expanded') !== 'true';
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu?.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      toggle?.focus();
    }
  };

  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  const onDesktop = (event) => { if (event.matches) closeMenu(); };
  const desktopMedia = window.matchMedia('(min-width: 901px)');

  toggle?.addEventListener('click', onToggle);
  menuLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', onScroll, { passive: true });
  desktopMedia.addEventListener('change', onDesktop);
  onScroll();

  return {
    setActive(id) {
      const navMap = { hero: '', about: 'about', focus: 'about', skills: 'skills', networking: 'skills', certifications: 'certifications', projects: 'projects', contact: 'contact' };
      document.querySelectorAll('[data-progress-link]').forEach((link) => {
        const active = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      menuLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${navMap[id]}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    },
    destroy() {
      toggle?.removeEventListener('click', onToggle);
      menuLinks.forEach((link) => link.removeEventListener('click', closeMenu));
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', onScroll);
      desktopMedia.removeEventListener('change', onDesktop);
    },
  };
}

function setupMagneticButtons() {
  if (compact || reducedMotion) return () => {};
  const cleanups = [];

  document.querySelectorAll('.magnetic').forEach((element) => {
    const moveX = gsap.quickTo(element, 'x', { duration: 0.4, ease: 'power3.out' });
    const moveY = gsap.quickTo(element, 'y', { duration: 0.4, ease: 'power3.out' });
    const onMove = (event) => {
      const bounds = element.getBoundingClientRect();
      moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 8);
      moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 6);
    };
    const onLeave = () => { moveX(0); moveY(0); };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

const navigation = setupNavigation();
const destroyMagneticButtons = setupMagneticButtons();
setLoadProgress(34);

const canvas = document.querySelector('#webgl-canvas');
const stage = createScene({ canvas, compact });
let network = null;
let particles = null;
let interactions = null;

if (stage.supported) {
  network = createNetwork({ compact, reducedMotion });
  particles = createParticles({ compact, reducedMotion });
  stage.scene.add(particles.group, network.group);
  interactions = createInteractions({
    cameraEffects: stage.cameraEffects,
    networkEffects: network.effects,
    particleEffects: particles.effects,
    reducedMotion,
  });
  network.update(0, 0, !reducedMotion);
  particles.update(0, 0, !reducedMotion);
  stage.syncCamera();
  setLoadProgress(72);
} else {
  root.classList.add('no-webgl');
}

const fallbackCameraPose = {
  position: { x: 0, y: 0, z: 9 },
  target: { x: 0, y: 0, z: 0 },
};
const fallbackNetworkPose = { rx: 0, ry: 0, rz: 0, scale: 1, pulse: 0, glow: 0 };
const cameraPose = stage.supported ? stage.cameraPose : fallbackCameraPose;
const networkPose = network?.pose || fallbackNetworkPose;

const createScroll = () => createScrollSystem({
  cameraPose,
  networkPose,
  compact,
  reducedMotion,
  onSectionChange: (id) => navigation.setActive(id),
  invalidate: () => { dirty = true; },
});

let scrollSystem = createScroll();
setLoadProgress(90);

gsap.ticker.lagSmoothing(0);
const tick = (time, deltaTime) => {
  scrollSystem.raf(time * 1000);
  if (!pageVisible || destroyed || !stage.supported) return;

  const delta = Math.min(deltaTime / 1000, 0.05);
  interactions?.update(delta);
  network?.update(delta, time, !reducedMotion);
  particles?.update(delta, time, !reducedMotion);
  stage.syncCamera();

  if (!reducedMotion || dirty) {
    stage.render();
    dirty = false;
  }
};

gsap.ticker.add(tick);

try {
  if (stage.supported) {
    stage.compile();
    stage.render();
  }
} catch (error) {
  root.classList.add('no-webgl');
}

setLoadProgress(100);
requestAnimationFrame(() => {
  root.classList.add('is-ready');
  loader?.classList.add('is-complete');
  loader?.setAttribute('aria-hidden', 'true');
  scrollSystem.playIntro();
  scrollSystem.refresh();
});

const onVisibilityChange = () => {
  pageVisible = !document.hidden;
  if (pageVisible) {
    dirty = true;
    scrollSystem.start();
  } else {
    scrollSystem.stop();
  }
};

const onResize = () => { dirty = true; };

const onMotionPreferenceChange = (event) => {
  reducedMotion = event.matches;
  network?.setReducedMotion(reducedMotion);
  particles?.setReducedMotion(reducedMotion);
  interactions?.setReducedMotion(reducedMotion);
  scrollSystem.destroy();
  scrollSystem = createScroll();
  dirty = true;
};

document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('resize', onResize, { passive: true });
motionPreference.addEventListener('change', onMotionPreferenceChange);

document.fonts?.ready.then(() => scrollSystem.refresh());
window.addEventListener('load', () => scrollSystem.refresh(), { once: true });

function destroy() {
  if (destroyed) return;
  destroyed = true;
  gsap.ticker.remove(tick);
  scrollSystem.destroy();
  interactions?.dispose();
  network?.dispose();
  particles?.dispose();
  stage.supported && stage.dispose();
  navigation.destroy();
  destroyMagneticButtons();
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('resize', onResize);
  motionPreference.removeEventListener('change', onMotionPreferenceChange);
}

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) destroy();
});

if (import.meta.hot) import.meta.hot.dispose(destroy);
