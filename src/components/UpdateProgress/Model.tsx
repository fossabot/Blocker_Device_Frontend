import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Group } from 'three';

interface ModelProps {
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function Model({
  scale = 0.005,
  position = [0, -0.5, 0],
  rotation = [0, Math.PI / 2, 0]
}: ModelProps) {
  const { scene } = useGLTF('/tesla_2018_model_3/model.glb');
  const { scene: threeScene } = useThree();
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) {
          obj.material.envMapIntensity = 1;
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <primitive 
      ref={groupRef}
      object={scene} 
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
}

useGLTF.preload('/tesla_2018_model_3/model.glb');