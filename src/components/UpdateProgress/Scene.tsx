import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import TeslaModel from './Model';
import { Blockchain } from './Blockchain';
import { IPFS } from './IPFS';
import { Model as RoadModel } from '../Vehicle3DView/RoadModel';

interface SceneProps {
  isAnimating: boolean;
  showCarView?: boolean;
  showBlockchainInfo?: boolean;
  onReturnToInitial?: () => void;
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

const CameraController = React.forwardRef(({ 
  isAnimating, 
  showCarView, 
  showBlockchainInfo,
  onZoomComplete,
  onCarViewEnter,
  onReturnToInitialPosition 
}: { 
  isAnimating: boolean; 
  showCarView?: boolean;
  showBlockchainInfo?: boolean;
  onZoomComplete: () => void;
  onCarViewEnter?: () => void;
  onReturnToInitialPosition?: () => void;
}, ref) => {
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

  // 외부에서 사용할 수 있도록 returnToInitialView 메서드 노출
  React.useImperativeHandle(ref, () => ({
    returnToInitialView: () => {
      if (initialCam.current && controlsRef.current) {
        const camera = controlsRef.current.object;
        const timeline = gsap.timeline({
          defaults: { duration: 2.0, ease: "power2.inOut" },
          onComplete: () => {
            onReturnToInitialPosition?.();
          }
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
  }));

  useFrame(() => {
    if (!controlsRef.current) return;

    const camera = controlsRef.current.object;
    
    // 초기 카메라 위치 저장
    if (!initialCam.current) {
      initialCam.current = {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z],
      };
      console.log('Initial camera position set:', initialCam.current);
    }

    // 애니메이션 상태나 자동차 뷰 상태가 변경될 때
    if (isAnimating !== prevIsAnimating.current || showCarView !== prevShowCarView.current) {
      // 이전 애니메이션 중단
      if (animationRef.current) {
        animationRef.current.kill();
      }
      
      console.log('Animation state changed:', { 
        isAnimating, 
        showCarView,
        prevShowCarView: prevShowCarView.current 
      });

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
      } else if (showCarView && !showBlockchainInfo) {
        // 자동차 시점으로 이동
        console.log('Starting car view animation');
        const timeline = gsap.timeline({
          defaults: { duration: 2.0, ease: "power2.inOut" },
          onComplete: () => {
            console.log('Reached car interior view');
            onCarViewEnter?.();
          }
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
      } else if (showBlockchainInfo) {
        // 12번 블록이 차량을 향해 움직이는 시점
        console.log('Moving block to vehicle');
        const timeline = gsap.timeline({
          defaults: { duration: 2.0, ease: "power2.inOut" }
        });

        timeline.to(camera.position, {
          x: -18,  // 차량 측면에서
          y: 2,    // 약간 위에서
          z: -8,   // 차량을 바라보는 위치
          onUpdate: () => controlsRef.current?.update()
        }, 0);

        timeline.to(controlsRef.current.target, {
          x: -20,  // 차량 중앙
          y: -2,   // 하단부
          z: 0,    // 중앙을 바라봄
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
});

export function Scene({ isAnimating, showCarView: initialShowCarView, showBlockchainInfo, onReturnToInitial }: SceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomComplete, setZoomComplete] = useState(false);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [showCarView, setShowCarView] = useState(initialShowCarView);
  const cameraControllerRef = useRef<{
    returnToInitialView: () => void;
  }>();

  useEffect(() => {
    setShowCarView(initialShowCarView);
  }, [initialShowCarView]);

  useEffect(() => {
    console.log('State changed:', {
      showCarView,
      showUpdatePanel,
      isAnimating,
      zoomComplete
    });
  }, [showCarView, showUpdatePanel, isAnimating, zoomComplete]);

  const handleUpdateConfirm = () => {
    setShowUpdatePanel(false);
    if (cameraControllerRef.current) {
      cameraControllerRef.current.returnToInitialView();
      setTimeout(() => {
        setShowCarView(false);
        if (onReturnToInitial) {
          onReturnToInitial();
        }
      }, 2000); // 카메라 이동이 완료된 후 상태 변경
    }
  };

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
          <group>
            <TeslaModel scale={0.1} position={[-20, -5, -5]} rotation={[0, (5 * Math.PI / 6) - (Math.PI / 36), 0]} />
            {showCarView && showUpdatePanel && (
              <Html position={[-21, -3, 5]} rotation={[0, Math.PI - (Math.PI / 6), 0]} transform occlude>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  padding: '15px',
                  borderRadius: '8px',
                  color: 'white',
                  width: '280px',
                  fontFamily: '-apple-system, sans-serif'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>소프트웨어 업데이트</h3>
                  <p>새로운 업데이트를 시작하시겠습니까?</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => setShowUpdatePanel(false)} style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #666',
                      borderRadius: '5px',
                      background: 'transparent',
                      color: 'white',
                      cursor: 'pointer'
                    }}>아니오</button>
                    <button onClick={handleUpdateConfirm} style={{
                      flex: 1,
                      padding: '8px',
                      border: 'none',
                      borderRadius: '5px',
                      background: '#2563eb',
                      color: 'white',
                      cursor: 'pointer'
                    }}>예</button>
                  </div>
                </div>
              </Html>
            )}
            {/* 블록체인 정보 수신 완료 시 표시되는 패널 */}
            {showBlockchainInfo && (
              <Html position={[-50, -12, -30]} rotation={[0, Math.PI + (Math.PI / 1.7), 0]} transform occlude scale={2.5}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  padding: '25px',
                  borderRadius: '12px',
                  color: 'white',
                  width: '480px',
                  fontFamily: '-apple-system, sans-serif'
                }}>
                  <h3 style={{ margin: '0 0 25px 0', fontSize: '1.4em' }}>업데이트 데이터 검증</h3>
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '1.1em' }}>IPFS 해시</div>
                      <div style={{ 
                        background: 'rgba(96, 165, 250, 0.1)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        color: '#60A5FA',
                        fontSize: '1.1em',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        QmX8ygh7K4sPhwzFvjNnbFb1pTWKh1QUcNWp7Ny1TYTkxc
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '1.1em' }}>업데이트 해시</div>
                      <div style={{ 
                        background: 'rgba(96, 165, 250, 0.1)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        color: '#60A5FA',
                        fontSize: '1.1em',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        0x7d3c89f2a95c8ed8d3b96c1c78f3f94c134768f89...
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '1.1em' }}>CP-ABE 암호문</div>
                      <div style={{ 
                        background: 'rgba(96, 165, 250, 0.1)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        color: '#60A5FA',
                        fontSize: '1.1em',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        eyJDX3RpbGRlIjogIk16cGhTbEJ2UTFWTWIwcE9jbU12...
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '25px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ color: '#22C55E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2em' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      데이터 무결성 검증 완료
                    </div>
                    <div style={{ fontSize: '1.1em', color: '#9CA3AF' }}>모든 데이터가 성공적으로 검증되었습니다.</div>
                  </div>
                </div>
              </Html>
            )}
          </group>
          <Blockchain 
            scale={2.9} 
            isAnimating={zoomComplete} 
            position={[-30, 35, -45]}
            showBlockchainInfo={showBlockchainInfo}
          />
          <IPFS 
            scale={3.4}
            isAnimating={isAnimating} 
            position={[-5, 25, 40]} />
          <Environment preset="city" />
        </Suspense>
        <CameraController 
          ref={cameraControllerRef}
          isAnimating={isAnimating}
          showCarView={showCarView}
          showBlockchainInfo={showBlockchainInfo}
          onZoomComplete={() => setZoomComplete(true)}
          onCarViewEnter={() => {
            console.log('Car view entered, showing update panel');
            setShowUpdatePanel(true);
          }}
        />
      </Canvas>
    </div>
  );
}