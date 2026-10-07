import * as THREE from 'three';

const NODE_POSITIONS = [
  [-2.5, 1.45, 0.25], [-1.65, 2.15, -0.85], [-0.65, 1.6, 1.25],
  [0.72, 2.25, 0.15], [1.9, 1.45, -0.7], [2.7, 0.45, 0.7],
  [2.2, -0.95, 1.1], [1.2, -1.85, -0.4], [-0.25, -2.2, 0.65],
  [-1.6, -1.55, -1.15], [-2.7, -0.5, 0.6], [-2.1, 0.35, -1.45],
  [-0.65, 0.6, -2.15], [0.75, 1.05, -1.75], [1.6, 0.05, -2.2],
  [0.25, -0.85, -2.45], [-1.05, -0.75, 2.05], [0.55, 0.1, 2.35],
  [3.25, -0.7, -1.25], [3.75, 0.15, -2.1], [3.5, -1.7, -2.4],
  [4.35, -0.9, -3.05], [-3.45, 1.15, -1.1], [-3.25, -1.25, -0.3],
];

const CONNECTIONS = [
  [0, 1], [0, 2], [0, 10], [0, 22], [1, 2], [1, 12], [2, 3], [2, 17],
  [3, 4], [3, 13], [4, 5], [4, 14], [5, 6], [5, 18], [6, 7], [6, 17],
  [7, 8], [7, 15], [8, 9], [8, 16], [9, 10], [9, 23], [10, 11], [11, 12],
  [12, 13], [12, 15], [13, 14], [14, 15], [15, 16], [16, 17], [18, 19],
  [18, 20], [19, 21], [20, 21], [14, 18], [15, 20], [22, 11], [23, 10],
];

export function createNetwork({ compact = false, reducedMotion = false } = {}) {
  const group = new THREE.Group();
  const content = new THREE.Group();
  group.add(content);

  const pose = { rx: 0.08, ry: -0.25, rz: 0, scale: 1, pulse: 0.25, glow: 0.75 };
  const effects = { pitch: 0, yaw: 0 };
  const resources = [];

  const coreGeometry = new THREE.IcosahedronGeometry(0.82, compact ? 1 : 2);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b2530,
    emissive: 0x007b8a,
    emissiveIntensity: 0.78,
    metalness: 0.72,
    roughness: 0.26,
    transparent: true,
    opacity: 0.92,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  resources.push(coreGeometry, coreMaterial);

  const wireGeometry = new THREE.IcosahedronGeometry(1.03, 1);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x66efff,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  });
  const wireCore = new THREE.Mesh(wireGeometry, wireMaterial);
  resources.push(wireGeometry, wireMaterial);

  const haloGeometry = new THREE.RingGeometry(1.3, 1.315, 72);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  resources.push(haloGeometry, haloMaterial);
  const haloA = new THREE.Mesh(haloGeometry, haloMaterial);
  const haloB = new THREE.Mesh(haloGeometry, haloMaterial);
  haloA.rotation.x = Math.PI / 2.25;
  haloB.rotation.set(Math.PI / 3.1, Math.PI / 3, 0);
  content.add(core, wireCore, haloA, haloB);

  const nodes = compact ? NODE_POSITIONS.slice(0, 17) : NODE_POSITIONS;
  const nodeGeometry = new THREE.IcosahedronGeometry(0.09, 0);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x9af4ff,
    emissive: 0x00bed5,
    emissiveIntensity: 1.25,
    metalness: 0.25,
    roughness: 0.35,
  });
  resources.push(nodeGeometry, nodeMaterial);
  const nodeMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodes.length);
  const matrix = new THREE.Matrix4();
  nodes.forEach((position, index) => {
    const scale = index % 5 === 0 ? 1.7 : index > 17 ? 0.8 : 1;
    matrix.compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion(),
      new THREE.Vector3(scale, scale, scale),
    );
    nodeMesh.setMatrixAt(index, matrix);
  });
  nodeMesh.instanceMatrix.needsUpdate = true;
  content.add(nodeMesh);

  const activeConnections = CONNECTIONS.filter(([from, to]) => from < nodes.length && to < nodes.length);
  const edgePositions = new Float32Array((activeConnections.length + nodes.length) * 6);
  let edgeOffset = 0;

  const writeEdge = (from, to) => {
    edgePositions.set(from, edgeOffset);
    edgePositions.set(to, edgeOffset + 3);
    edgeOffset += 6;
  };

  activeConnections.forEach(([from, to]) => writeEdge(nodes[from], nodes[to]));
  nodes.forEach((node, index) => {
    if (index % 2 === 0 || index < 6) writeEdge([0, 0, 0], node);
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions.slice(0, edgeOffset), 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x3ccfe1,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  resources.push(lineGeometry, lineMaterial);
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  content.add(lines);

  const pulseCount = compact ? 5 : 10;
  const pulsePositions = new Float32Array(pulseCount * 3);
  const pulseGeometry = new THREE.BufferGeometry();
  const pulseAttribute = new THREE.BufferAttribute(pulsePositions, 3);
  pulseGeometry.setAttribute('position', pulseAttribute);
  const pulseMaterial = new THREE.PointsMaterial({
    color: 0xa8f7ff,
    size: compact ? 0.085 : 0.11,
    transparent: true,
    opacity: reducedMotion ? 0 : 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  resources.push(pulseGeometry, pulseMaterial);
  const pulsePoints = new THREE.Points(pulseGeometry, pulseMaterial);
  pulsePoints.frustumCulled = false;
  content.add(pulsePoints);

  const pulseRecords = Array.from({ length: pulseCount }, (_, index) => ({
    edge: activeConnections[(index * 3 + 1) % activeConnections.length],
    phase: (index * 0.193) % 1,
    speed: 0.055 + (index % 4) * 0.014,
  }));

  const update = (delta, elapsed, animate = true) => {
    const motion = animate && !reducedMotion ? 1 : 0;
    content.rotation.x += ((effects.pitch + Math.sin(elapsed * 0.19) * 0.018 * motion) - content.rotation.x) * Math.min(delta * 4, 1);
    content.rotation.y += ((effects.yaw + elapsed * 0.018 * motion) - content.rotation.y) * Math.min(delta * 3, 1);
    core.rotation.x = elapsed * 0.11 * motion;
    core.rotation.y = elapsed * 0.16 * motion;
    wireCore.rotation.x = -elapsed * 0.07 * motion;
    wireCore.rotation.z = elapsed * 0.09 * motion;
    haloA.rotation.z = elapsed * 0.055 * motion;
    haloB.rotation.z = -elapsed * 0.045 * motion;

    pulseMaterial.opacity = reducedMotion ? 0 : 0.42 + pose.pulse * 0.52;
    coreMaterial.emissiveIntensity = 0.42 + pose.glow * 0.55;
    lineMaterial.opacity = 0.11 + pose.glow * 0.12;

    if (!reducedMotion) {
      pulseRecords.forEach((record, index) => {
        const [fromIndex, toIndex] = record.edge;
        const from = nodes[fromIndex];
        const to = nodes[toIndex];
        const progress = (record.phase + elapsed * record.speed * (0.7 + pose.pulse * 0.8)) % 1;
        const offset = index * 3;
        pulsePositions[offset] = from[0] + (to[0] - from[0]) * progress;
        pulsePositions[offset + 1] = from[1] + (to[1] - from[1]) * progress;
        pulsePositions[offset + 2] = from[2] + (to[2] - from[2]) * progress;
      });
      pulseAttribute.needsUpdate = true;
    }

    group.rotation.set(pose.rx, pose.ry, pose.rz);
    group.scale.setScalar(pose.scale);
  };

  return {
    group,
    pose,
    effects,
    update,
    setReducedMotion(value) {
      reducedMotion = value;
      pulseMaterial.opacity = value ? 0 : 0.9;
    },
    dispose() {
      resources.forEach((resource) => resource.dispose());
      group.removeFromParent();
    },
  };
}
