import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import Model from './Model';
import { Blockchain } from './Blockchain';
import { IPFS } from './IPFS';

interface SceneProps {
  isAnimating: boolean;
}

export function Scene({ isAnimating }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 55], fov: 45 }}
      style={{ width: '100%', height: '100%', background: '#0c0c1d' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={[5, 5, 5]}
        intensity={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <Suspense fallback={null}>
        <Model scale={0.02} position={[0, -2, 0]} rotation={[0, Math.PI / 2, 0]} />
        <Blockchain isAnimating={isAnimating} position={[-20, -2, 0]} />
        <IPFS isAnimating={isAnimating} position={[20, -2, 0]} />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[0, 0, 0]}
        maxDistance={50}
        minDistance={5}
      />
    </Canvas>
  );
}