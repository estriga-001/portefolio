import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const cameraStates = {
  hero: {
    position: [0, 0.15, 8.6], target: [0, 0, 0],
    network: { rx: 0.08, ry: -0.25, rz: 0, scale: 1, pulse: 0.25, glow: 0.75 },
  },
  about: {
    position: [-2.7, 0.65, 6.7], target: [-0.2, 0.05, 0],
    network: { rx: 0.12, ry: 0.25, rz: -0.03, scale: 1, pulse: 0.35, glow: 0.8 },
  },
  focus: {
    position: [2.6, -0.35, 6.2], target: [0.3, 0, -0.15],
    network: { rx: -0.08, ry: 0.65, rz: 0.04, scale: 1.03, pulse: 0.5, glow: 0.9 },
  },
  skills: {
    position: [-1.2, 2, 5.8], target: [0, 0.15, 0],
    network: { rx: -0.18, ry: 0.92, rz: -0.04, scale: 1.05, pulse: 0.55, glow: 0.95 },
  },
  networking: {
    position: [1.35, 0.1, 4.15], target: [0.1, 0, -0.5],
    network: { rx: 0.08, ry: 1.2, rz: 0.03, scale: 1.08, pulse: 1, glow: 1.15 },
  },
  certifications: {
    position: [-3.8, 1, 6], target: [0, 0, 0],
    network: { rx: 0.16, ry: 1.62, rz: -0.04, scale: 1, pulse: 0.45, glow: 0.9 },
  },
  projects: {
    position: [3.5, -0.8, 6.3], target: [2.1, -0.3, -0.9],
    network: { rx: -0.08, ry: 1.92, rz: 0.02, scale: 0.96, pulse: 0.25, glow: 0.72 },
  },
  contact: {
    position: [0, 1, 11.8], target: [0, 0, 0],
    network: { rx: 0.04, ry: 2.2, rz: 0, scale: 0.9, pulse: 0.2, glow: 0.75 },
  },
};

function resolveStates(compact) {
  if (!compact) return cameraStates;

  return Object.fromEntries(
    Object.entries(cameraStates).map(([key, state]) => [key, {
      position: [state.position[0] * 0.4, state.position[1] * 0.55, state.position[2] + 2.4],
      target: [state.target[0] * 0.5, state.target[1] * 0.6, state.target[2]],
      network: { ...state.network, scale: state.network.scale * 0.78 },
    }]),
  );
}

function copyState(cameraPose, networkPose, state) {
  const [px, py, pz] = state.position;
  const [tx, ty, tz] = state.target;
  Object.assign(cameraPose.position, { x: px, y: py, z: pz });
  Object.assign(cameraPose.target, { x: tx, y: ty, z: tz });
  Object.assign(networkPose, state.network);
}

export function createScrollSystem({
  cameraPose,
  networkPose,
  compact = false,
  reducedMotion = false,
  onSectionChange = () => {},
  invalidate = () => {},
}) {
  const states = resolveStates(compact);
  const sections = [...document.querySelectorAll('[data-section]')];
  const anchorListeners = [];
  let lenis = null;

  if (reducedMotion) {
    copyState(cameraPose, networkPose, {
      position: [0, 0.4, compact ? 12.6 : 10.5],
      target: [0, 0, 0],
      network: { rx: 0.05, ry: 0.35, rz: 0, scale: compact ? 0.76 : 0.92, pulse: 0, glow: 0.68 },
    });
  } else {
    copyState(cameraPose, networkPose, states.hero);
    lenis = new Lenis({
      autoRaf: false,
      lerp: compact ? 0.11 : 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
    });
    lenis.on('scroll', ScrollTrigger.update);
  }

  const context = gsap.context(() => {
    if (!reducedMotion) {
      sections.slice(1).forEach((section, index) => {
        const previous = states[sections[index].dataset.scene];
        const next = states[section.dataset.scene];
        if (!previous || !next) return;

        const timeline = gsap.timeline({
          defaults: { duration: 1, ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: section,
            start: 'top 92%',
            end: 'top 22%',
            scrub: compact ? 0.35 : 0.7,
            invalidateOnRefresh: true,
            onUpdate: invalidate,
          },
        });

        timeline
          .fromTo(cameraPose.position,
            { x: previous.position[0], y: previous.position[1], z: previous.position[2] },
            { x: next.position[0], y: next.position[1], z: next.position[2] }, 0)
          .fromTo(cameraPose.target,
            { x: previous.target[0], y: previous.target[1], z: previous.target[2] },
            { x: next.target[0], y: next.target[1], z: next.target[2] }, 0)
          .fromTo(networkPose, { ...previous.network }, { ...next.network }, 0);
      });
    }

    sections.forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: ({ isActive }) => {
          if (isActive) onSectionChange(section.id);
        },
      });
    });

    const progressLine = document.querySelector('[data-progress-line]');
    if (progressLine) {
      gsap.set(progressLine, { transformOrigin: 'top center' });
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: ({ progress }) => gsap.set(progressLine, { scaleY: progress }),
      });
    }

    if (!reducedMotion) {
      document.querySelectorAll('.reveal-heading').forEach((element) => {
        gsap.from(element, {
          y: 58,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 87%', once: true },
        });
      });

      document.querySelectorAll('.reveal-panel').forEach((element) => {
        gsap.from(element, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        });
      });

      document.querySelectorAll('.reveal-card').forEach((element, index) => {
        gsap.from(element, {
          y: 36,
          opacity: 0,
          duration: 0.75,
          delay: (index % 3) * 0.06,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 93%', once: true },
        });
      });
    }
  }, document.body);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      const headerOffset = -(document.querySelector('[data-header]')?.offsetHeight || 0);
      if (lenis) lenis.scrollTo(target, { offset: headerOffset, duration: 1.05 });
      else target.scrollIntoView({ behavior: 'auto', block: 'start' });
      history.replaceState(null, '', anchor.getAttribute('href'));
    };
    anchor.addEventListener('click', onClick);
    anchorListeners.push([anchor, onClick]);
  });

  const playIntro = () => {
    if (reducedMotion) return;
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo('.title-line > span', { yPercent: 112 }, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0)
      .fromTo('.hero .reveal-item', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.45);
  };

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return {
    raf(milliseconds) { lenis?.raf(milliseconds); },
    playIntro,
    start() { lenis?.start(); },
    stop() { lenis?.stop(); },
    refresh() { ScrollTrigger.refresh(); invalidate(); },
    destroy() {
      context.revert();
      anchorListeners.forEach(([anchor, listener]) => anchor.removeEventListener('click', listener));
      lenis?.destroy();
      lenis = null;
    },
  };
}
