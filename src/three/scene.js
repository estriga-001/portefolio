import * as THREE from 'three';

export function createScene({ canvas, compact = false }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, compact ? 0.048 : 0.039);

  const camera = new THREE.PerspectiveCamera(compact ? 50 : 44, 1, 0.1, 45);
  const cameraPose = {
    position: new THREE.Vector3(0, 0.15, 8.6),
    target: new THREE.Vector3(0, 0, 0),
  };
  const cameraEffects = {
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
  };
  const lookTarget = new THREE.Vector3();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !compact,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    return { supported: false, error };
  }

  renderer.setClearColor(0x05070a, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const ambientLight = new THREE.AmbientLight(0x8bb8c7, 0.58);
  const keyLight = new THREE.DirectionalLight(0xe8fbff, 1.85);
  keyLight.position.set(-3, 5, 7);
  const cyanLight = new THREE.PointLight(0x00e5ff, compact ? 9 : 13, 13, 2);
  cyanLight.position.set(3.8, 1.4, 4.2);
  const violetLight = new THREE.PointLight(0x8b5cf6, compact ? 4 : 7, 11, 2);
  violetLight.position.set(-4, -2.4, 2.2);
  scene.add(ambientLight, keyLight, cyanLight, violetLight);

  const syncCamera = () => {
    camera.position.copy(cameraPose.position).add(cameraEffects.position);
    lookTarget.copy(cameraPose.target).add(cameraEffects.target);
    camera.lookAt(lookTarget);
  };

  const resize = () => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    renderer.setSize(width, height, false);
  };

  resize();
  syncCamera();

  const onContextLost = (event) => {
    event.preventDefault();
    document.documentElement.classList.add('no-webgl');
  };
  const onContextRestored = () => {
    document.documentElement.classList.remove('no-webgl');
    resize();
  };

  canvas.addEventListener('webglcontextlost', onContextLost, false);
  canvas.addEventListener('webglcontextrestored', onContextRestored, false);
  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });

  return {
    supported: true,
    scene,
    camera,
    renderer,
    cameraPose,
    cameraEffects,
    resize,
    syncCamera,
    compile: () => renderer.compile(scene, camera),
    render: () => renderer.render(scene, camera),
    dispose() {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      renderer.dispose();
    },
  };
}
