import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import Model from './Model';
import { Blockchain } from './Blockchain';
import { IPFS } from './IPFS';

interface SceneProps {
  isAnimating: boolean;
}

function CameraController({ isAnimating, onZoomComplete }: { isAnimating: boolean; onZoomComplete: () => void }) {
  const controlsRef = useRef<any>(null);
  const initialCam = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const prevIsAnimating = useRef(isAnimating);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  // 블록체인 위치 (카메라가 바라볼 위치)
  const blockchainPosition = useMemo(() => ({
    x: -20,  // Blockchain 컴포넌트의 x 위치
    y: -2,   // Blockchain 컴포넌트의 y 위치
    z: 0     // Blockchain 컴포넌트의 z 위치
  }), []);

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
        // 블록체인 쪽으로 이동
        const timeline = gsap.timeline({
          defaults: { duration: 1.5, ease: "power2.inOut" },
          onComplete: onZoomComplete // 줌인 완료 후 콜백 실행
        });

        timeline.to(camera.position, {
          x: blockchainPosition.x + 15,
          y: blockchainPosition.y + 10,
          z: blockchainPosition.z + 15,
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        timeline.to(controlsRef.current.target, {
          x: blockchainPosition.x,
          y: blockchainPosition.y,
          z: blockchainPosition.z,
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        animationRef.current = timeline;
      } else {
        // 2.7초 후에 원래 위치로 복귀 (애니메이션 완료 후)
        setTimeout(() => {
          if (initialCam.current) {
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
        }, 2700); // 전체 애니메이션 시간(2.2초) + 약간의 여유(0.5초)
      }
    }

    prevIsAnimating.current = isAnimating;
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

export function Scene({ isAnimating }: SceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomComplete, setZoomComplete] = useState(false);

  useEffect(() => {
    // 씬 초기화
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // 렌더러 설정
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
    containerRef.current!.appendChild(renderer.domElement);

    // 정리 함수
    return () => {
      // 렌더러 정리
      renderer.dispose();
      
      // 씬의 모든 객체 정리
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      
      // DOM에서 캔버스 제거
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [0, 10, 55], fov: 45 }}
        style={{ width: '100%', height: '100%', background: '#0c0c1d' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
          preserveDrawingBuffer: true,
          logarithmicDepthBuffer: true,
          stencil: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x0c0c1d);
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.localClippingEnabled = true;
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          castShadow
          position={[5, 5, 5]}
          intensity={0.8}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Suspense fallback={null}>
          <Model scale={0.02} position={[0, -2, 0]} rotation={[0, Math.PI / 2, 0]} />
          <Blockchain 
            isAnimating={zoomComplete} 
            position={[-20, -2, 0]}
          />
          <IPFS isAnimating={isAnimating} position={[20, -2, 0]} />
          <Environment preset="city" />
        </Suspense>
        <CameraController 
          isAnimating={isAnimating} 
          onZoomComplete={() => setZoomComplete(true)}
        />
      </Canvas>
    </div>
  );
}