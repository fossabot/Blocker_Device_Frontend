import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { Group, Mesh, MeshStandardMaterial } from 'three';

interface ModelProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function Model({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  ...props
}: ModelProps) {
  const groupRef = useRef<Group>(null);
  const gltf = useGLTF('/tesla_2018_model_3/scene.gltf');
  const nodes = gltf.nodes as Record<string, Mesh>;
  const materials = gltf.materials as Record<string, MeshStandardMaterial>;

  // Set up materials
  Object.values(materials).forEach((material: MeshStandardMaterial) => {
    material.envMapIntensity = 1;
    material.needsUpdate = true;
  });

  // Make sure the model casts and receives shadows
  Object.values(nodes).forEach((node: Mesh) => {
    node.castShadow = true;
    node.receiveShadow = true;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} {...props}>
      {Object.entries(nodes).map(([key, node]) => (
        <primitive key={key} object={node} />
      ))}
    </group>
  );
}

// Preload the model
useGLTF.preload('/tesla_2018_model_3/scene.gltf');