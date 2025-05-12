import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import Model from './Model';
import { Blockchain } from './Blockchain';
import { IPFS } from './IPFS';

interface SceneProps {
  isAnimating: boolean;
  showBlockInfo?: boolean;
}

function CameraController({ isAnimating, showBlockInfo }: { isAnimating: boolean; showBlockInfo?: boolean }) {
  const controlsRef = useRef<any>(null);
  const initialCam = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const prevShowBlockInfo = useRef(showBlockInfo);
  const prevIsAnimating = useRef(isAnimating);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  // 블록 6의 위치 계산 (고정값)
  const block6Position = useMemo(() => {
    const blockIdx = 5;
    const totalBlocks = 12;
    const angle = (blockIdx / totalBlocks) * Math.PI * 4;
    const radius = 7;
    const x = Math.cos(angle) * radius - 20;
    const y = -10 + (blockIdx * 1.3) - 2;
    const z = Math.sin(angle) * radius;
    return { x, y, z };
  }, []);



  useFrame(() => {
    if (!controlsRef.current) return;

    const camera = controlsRef.current.object;
    
    // 초기 카메라 위치 저장
    if (!initialCam.current) {
      initialCam.current = {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z],
      };
    }

    // 애니메이션 상태가 변경될 때
    if (isAnimating !== prevIsAnimating.current) {
      // 이전 애니메이션 중단
      if (animationRef.current) {
        animationRef.current.kill();
      }

      if (isAnimating) {
        // 6번 블록으로 이동
        const timeline = gsap.timeline({
          defaults: { duration: 1.5, ease: "power2.inOut" }
        });

        timeline.to(camera.position, {
          x: block6Position.x + 6,
          y: block6Position.y + 3,
          z: block6Position.z + 6,
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        timeline.to(controlsRef.current.target, {
          x: block6Position.x,
          y: block6Position.y,
          z: block6Position.z,
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        animationRef.current = timeline;
      } else if (initialCam.current) {
        // 원래 위치로 복귀
        const timeline = gsap.timeline({
          defaults: { duration: 1.5, ease: "power2.inOut" }
        });

        timeline.to(camera.position, {
          x: initialCam.current.position[0],
          y: initialCam.current.position[1],
          z: initialCam.current.position[2],
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        timeline.to(controlsRef.current.target, {
          x: initialCam.current.target[0],
          y: initialCam.current.target[1],
          z: initialCam.current.target[2],
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        animationRef.current = timeline;
      }
    }

    prevIsAnimating.current = isAnimating;
    prevShowBlockInfo.current = showBlockInfo;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      target={[0, 0, 0]}
      maxDistance={100}
      minDistance={1}
      dampingFactor={0.05}
      enableDamping={true}
    />
  );
}

export function Scene({ isAnimating, showBlockInfo }: SceneProps) {
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
        <Blockchain 
          isAnimating={isAnimating} 
          showBlockInfo={showBlockInfo} 
          position={[-20, -2, 0]}
          triggerAnimation={false}
        />
        <IPFS isAnimating={isAnimating} position={[20, -2, 0]} />
        <Environment preset="city" />
      </Suspense>
      <CameraController isAnimating={isAnimating} showBlockInfo={showBlockInfo} />
    </Canvas>
  );
}