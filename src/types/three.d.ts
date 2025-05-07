import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface ThreeSceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  animationFrame: number | null;
}

export interface UpdateAnimationState {
  isAnimating: boolean;
  currentStep: number;
  modelLoaded: boolean;
}

export interface ModelNodes {
  [key: string]: THREE.Mesh;
}

export interface ModelMaterials {
  [key: string]: THREE.Material;
}

export interface ParticleSystemProps {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  color: number;
  count?: number;
}

export interface ThreeObject3D extends THREE.Object3D {
  material?: THREE.Material | THREE.Material[];
  geometry?: THREE.BufferGeometry;
}