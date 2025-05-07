import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ThreeSceneState } from '../../types/three';

export function initScene(container: HTMLDivElement): ThreeSceneState {
  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0c1d, 10, 50);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 15, 25);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0c0c1d);
  container.appendChild(renderer.domElement);

  // Label renderer
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 30;
  controls.enablePan = true;
  controls.enableZoom = true;

  return {
    scene,
    camera,
    renderer,
    controls,
    animationFrame: null
  };
}

export function handleResize(state: ThreeSceneState) {
  if (!state.camera || !state.renderer) return;

  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function disposeScene(state: ThreeSceneState) {
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
  }

  if (state.scene) {
    state.scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }

  if (state.renderer) {
    state.renderer.dispose();
    const container = state.renderer.domElement.parentElement;
    if (container) {
      container.removeChild(state.renderer.domElement);
    }
  }
}