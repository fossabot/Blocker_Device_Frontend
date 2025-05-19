import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    Sphere_Material001_0: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

interface SkyModelProps {
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function SkyModel({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}: SkyModelProps) {
  const { nodes, materials } = useGLTF('/skybox_beach_cala_d_arena/scene.glb') as GLTFResult;
  
  useEffect(() => {
    if (materials['Material.001']) {
      const material = materials['Material.001'];
      material.side = THREE.BackSide;
      material.envMapIntensity = 1;
      material.needsUpdate = true;
      
      // 텍스처 필터링 개선
      if (material.map) {
        material.map.minFilter = THREE.LinearFilter;
        material.map.magFilter = THREE.LinearFilter;
        material.map.anisotropy = 16;  // 텍스처 선명도 향상
      }
    }
  }, [materials]);

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <mesh 
        geometry={nodes.Sphere_Material001_0.geometry}
        material={materials['Material.001']}
      />
    </group>
  );
}
