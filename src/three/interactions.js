export function createInteractions({ cameraEffects, networkEffects, particleEffects, reducedMotion = false }) {
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const onPointerMove = (event) => {
    if (reducedMotion) return;
    target.x = (event.clientX / window.innerWidth) * 2 - 1;
    target.y = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const reset = () => {
    target.x = 0;
    target.y = 0;
  };

  if (finePointer) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', reset);
    window.addEventListener('blur', reset);
  }

  return {
    update(delta) {
      const damping = 1 - Math.exp(-7 * Math.min(delta, 0.05));
      current.x += (target.x - current.x) * damping;
      current.y += (target.y - current.y) * damping;

      cameraEffects.position.set(current.x * 0.2, current.y * -0.12, 0);
      cameraEffects.target.set(current.x * 0.05, current.y * -0.035, 0);
      networkEffects.yaw = current.x * 0.045;
      networkEffects.pitch = current.y * 0.025;
      particleEffects.x = current.x;
      particleEffects.y = current.y;
    },
    setReducedMotion(value) {
      reducedMotion = value;
      if (value) reset();
    },
    dispose() {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('mouseleave', reset);
      window.removeEventListener('blur', reset);
    },
  };
}
