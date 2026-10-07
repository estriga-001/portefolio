import * as THREE from 'three';

function createSeededRandom(seed = 9137) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createParticles({ compact = false, reducedMotion = false } = {}) {
  const count = compact ? 150 : 420;
  const random = createSeededRandom();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cyan = new THREE.Color(0x4eddec);
  const blueGrey = new THREE.Color(0x547085);
  const violet = new THREE.Color(0x7658a8);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const lane = Math.floor(random() * 17) - 8;
    positions[offset] = lane * 0.82 + (random() - 0.5) * 0.15;
    positions[offset + 1] = (random() - 0.5) * 11;
    positions[offset + 2] = (random() - 0.5) * 11 - 2;

    const color = index % 11 === 0 ? violet : index % 4 === 0 ? cyan : blueGrey;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: compact ? 0.018 : 0.024,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const group = new THREE.Group();
  const points = new THREE.Points(geometry, material);
  group.add(points);
  group.position.z = -1.8;

  const effects = { x: 0, y: 0 };

  return {
    group,
    effects,
    update(delta, elapsed, animate = true) {
      const motion = animate && !reducedMotion ? 1 : 0;
      group.rotation.y += ((effects.x * 0.018 + elapsed * 0.0018 * motion) - group.rotation.y) * Math.min(delta * 2, 1);
      group.rotation.x += ((effects.y * 0.012 + Math.sin(elapsed * 0.08) * 0.008 * motion) - group.rotation.x) * Math.min(delta * 2, 1);
      group.position.y = Math.sin(elapsed * 0.1) * 0.08 * motion;
    },
    setReducedMotion(value) {
      reducedMotion = value;
      material.opacity = value ? 0.28 : 0.5;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      group.removeFromParent();
    },
  };
}
