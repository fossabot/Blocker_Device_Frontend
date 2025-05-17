import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import TeslaModel from './Model';
import { Blockchain } from './Blockchain';
import { IPFS } from './IPFS';
import { Model as RoadModel } from '../Vehicle3DView/RoadModel';

interface SceneProps {
  isAnimating: boolean;
  showCarView?: boolean;
  blockCreated?: boolean;
}

function Background() {
  const uniforms = {
    topColor: { value: new THREE.Color(0xffffff) },  // 흰색
    bottomColor: { value: new THREE.Color(0xe2f9fd) }, // 하늘색
  };

  return (
      <mesh position={[0, 0, -200]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[9000, 90000, 1]}>
      <planeGeometry />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
          }
        `}
      />
    </mesh>
  );
}

function CameraController({ 
  isAnimating, 
  showCarView, 
  onZoomComplete 
}: { 
  isAnimating: boolean; 
  showCarView?: boolean;
  onZoomComplete: () => void;
}) {
  const controlsRef = useRef<any>(null);
  const initialCam = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const prevIsAnimating = useRef(isAnimating);
  const prevShowCarView = useRef(showCarView);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  // 블록체인 위치 (카메라가 바라볼 위치)
  const blockchainPosition = useMemo(() => ({
    x: -30,  // Blockchain 컴포넌트의 x 위치
    y: 30,   // Blockchain 컴포넌트의 y 위치
    z: -45   // Blockchain 컴포넌트의 z 위치
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

    // 애니메이션 상태나 자동차 뷰 상태가 변경될 때
    if (isAnimating !== prevIsAnimating.current || showCarView !== prevShowCarView.current) {
      // 이전 애니메이션 중단
      if (animationRef.current) {
        animationRef.current.kill();
      }

      if (isAnimating) {
        // 블록체인 쪽으로 이동
        const timeline = gsap.timeline({
          defaults: { duration: 1.5, ease: "power2.inOut" },
          onComplete: () => {
            console.log('Camera reached blockchain position');
            onZoomComplete(); // 블록 생성 애니메이션 시작

            // 2.5초 후에 빛 애니메이션과 함께 자동으로 복귀
            gsap.delayedCall(2.5, () => {
              if (initialCam.current) {
                const returnTimeline = gsap.timeline({
                  defaults: { duration: 1.0, ease: "power2.inOut" }
                });

                returnTimeline.to(camera.position, {
                  x: initialCam.current.position[0],
                  y: initialCam.current.position[1],
                  z: initialCam.current.position[2],
                  onUpdate: () => controlsRef.current?.update()
                }, 0);

                returnTimeline.to(controlsRef.current.target, {
                  x: initialCam.current.target[0],
                  y: initialCam.current.target[1],
                  z: initialCam.current.target[2],
                  onUpdate: () => controlsRef.current?.update()
                }, 0);

                animationRef.current = returnTimeline;
              }
            });
          }
        });

        timeline.to(camera.position, {
          x: blockchainPosition.x + 30,
          y: blockchainPosition.y + 20,
          z: blockchainPosition.z + 30,
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        timeline.to(controlsRef.current.target, {
          x: blockchainPosition.x,
          y: blockchainPosition.y,
          z: blockchainPosition.z,
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        animationRef.current = timeline;
      } else if (showCarView) {
        // 자동차 시점으로 이동
        const timeline = gsap.timeline({
          defaults: { duration: 2.0, ease: "power2.inOut" },
          onComplete: () => console.log('Reached car interior view')
        });

        timeline.to(camera.position, {
          x: -15,  // 운전석 위치로
          y: 0,   // 운전자 눈높이
          z: -2,   // 운전석 위치 (더 앞쪽으로)
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        timeline.to(controlsRef.current.target, {
          x: -20,  // 카메라와 같은 x축
          y: -3.0,   // 같은 높이
          z: 5,    // 앞유리 방향으로 바라봄
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        animationRef.current = timeline;
      }
    }

    prevIsAnimating.current = isAnimating;
    prevShowCarView.current = showCarView;
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

export function Scene({ isAnimating, showCarView }: SceneProps) {
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
        camera={{ position: [-100, 0, 20], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
          preserveDrawingBuffer: true,
          logarithmicDepthBuffer: true,
          stencil: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.localClippingEnabled = true;
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-10, 10, -10]}
          intensity={0.5}
        />
        <Background />
        <Suspense fallback={null}>
          <RoadModel 
            scale={0.1} 
            position={[0, -55, 0]} 
            rotation={[0, Math.PI / 2, 0]} 
          />
          <TeslaModel scale={0.1} position={[-20, -5, -5]} rotation={[0, (5 * Math.PI / 6) - (Math.PI / 36), 0]} />
          <Blockchain 
            scale={2.9} 
            isAnimating={zoomComplete} 
            position={[-30, 35, -45]}
          />
          <IPFS 
            scale={3.4}
            isAnimating={isAnimating} 
            position={[-5, 25, 40]} />
          <Environment preset="city" />
        </Suspense>
        <CameraController 
          isAnimating={isAnimating}
          showCarView={showCarView}
          onZoomComplete={() => setZoomComplete(true)}
        />
      </Canvas>
    </div>
  );
}