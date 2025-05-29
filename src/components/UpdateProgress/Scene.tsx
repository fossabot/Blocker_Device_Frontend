import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Html } from '@react-three/drei';
import gsap from 'gsap';
import TeslaModel from './Model';
import { Blockchain } from './Blockchain';
import { IPFS } from './IPFS';
import { Model as RoadModel } from '../Vehicle3DView/RoadModel';
import SkyModel from './SkyModel';
import { VerificationProcess } from './VerificationProcess';

interface SceneProps {
  isAnimating: boolean;
  showCarView: boolean;
  showBlockchainInfo: boolean;
  onReturnToInitial: () => void;
  isDownloading?: boolean;
  onDownloadComplete?: () => void;
  ipfsFileInfo?: {
    cid: string;
    name: string;
    size: number;
  };
  verificationStage?: 'idle' | 'hash-verification' | 'cpabe-decryption' | 'final-decryption';
  onVerificationStageChange?: (stage: 'idle' | 'hash-verification' | 'cpabe-decryption' | 'final-decryption') => void;
  carDriveStage?: 'idle' | 'back' | 'forward';
  onCarDriveStageChange?: (stage: 'idle' | 'back' | 'forward') => void;
}

const CameraController = React.forwardRef(({
  isAnimating, 
  showCarView, 
  showBlockchainInfo,
  closeupStage, // 추가
  onZoomComplete,
  onCarViewEnter,
  onReturnToInitialPosition,
  carDriveStage // <-- 추가
}: { 
  isAnimating: boolean; 
  showCarView?: boolean;
  showBlockchainInfo?: boolean;
  closeupStage?: 'none' | 'hash' | 'cpabe' | 'final'; // 추가
  onZoomComplete: () => void;
  onCarViewEnter?: () => void;
  onReturnToInitialPosition?: () => void;
  carDriveStage?: 'idle' | 'back' | 'forward'; // <-- 추가
}, ref) => {
  const controlsRef = useRef<any>(null);
  const initialCam = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const prevIsAnimating = useRef(isAnimating);
  const prevShowCarView = useRef(showCarView);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const isInitialRender = useRef(true);
  // 카메라 forward 애니메이션용 ref
  const carForwardStartRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    // 클로즈업 위치 정의 (차량 위, 70도 각도, 덜 왼쪽)
    const closeupPositions = {
      hash: { pos: [-35, 8, 12], target: [-20, 5, -5] },
      cpabe: { pos: [-35, 9, 12], target: [-20, 5, -5] },
      final: { pos: [-35, 10, 12], target: [-20, 5, -5] }
    };
    if (closeupStage && closeupStage !== 'none' && closeupPositions[closeupStage]) {
      const { pos, target } = closeupPositions[closeupStage];
      const timeline = gsap.timeline({ defaults: { duration: 1.2, ease: "power2.inOut" } });
      timeline.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], onUpdate: () => controlsRef.current?.update() }, 0);
      timeline.to(controlsRef.current.target, { x: target[0], y: target[1], z: target[2], onUpdate: () => controlsRef.current?.update() }, 0);
      animationRef.current = timeline;
    } else if (closeupStage === 'none' && initialCam.current) {
      // 복귀
      const timeline = gsap.timeline({ defaults: { duration: 1.2, ease: "power2.inOut" } });
      timeline.to(camera.position, { x: initialCam.current.position[0], y: initialCam.current.position[1], z: initialCam.current.position[2], onUpdate: () => controlsRef.current?.update() }, 0);
      timeline.to(controlsRef.current.target, { x: initialCam.current.target[0], y: initialCam.current.target[1], z: initialCam.current.target[2], onUpdate: () => controlsRef.current?.update() }, 0);
      animationRef.current = timeline;
    }
  }, [closeupStage]);

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

    // 자동차가 앞으로 주행할 때 카메라가 따라가도록
    if (showCarView && carDriveStage === 'forward') {
      // 카메라 위치는 초기 위치에서 고정, target만 z축(앞으로)으로만 이동 (x는 그대로)
      if (!initialCam.current) return;
      const duration = 1.0;
      if (carForwardStartRef.current === null) carForwardStartRef.current = performance.now() / 1000;
      const now = performance.now() / 1000;
      const elapsed = now - carForwardStartRef.current;
      const t = Math.min(elapsed / duration, 1);
      camera.position.set(
        initialCam.current.position[0],
        initialCam.current.position[1],
        initialCam.current.position[2]
      );
      const targetStart = initialCam.current.target;
      const targetEnd = [targetStart[0], targetStart[1], targetStart[2] + 60];
      const targetX = targetStart[0];
      const targetY = targetStart[1];
      const targetZ = targetStart[2] + (targetEnd[2] - targetStart[2]) * t;
      controlsRef.current.target.set(targetX, targetY, targetZ);
      controlsRef.current.update();
      if (t >= 1) {
        // 앞으로 이동이 끝나면 카메라와 타겟을 자연스럽게 초기 위치로 복귀
        carForwardStartRef.current = null;
        if (initialCam.current) {
          gsap.to(camera.position, {
            x: initialCam.current.position[0],
            y: initialCam.current.position[1],
            z: initialCam.current.position[2],
            duration: 1.2,
            ease: 'power2.inOut',
            onUpdate: () => controlsRef.current?.update()
          });
          gsap.to(controlsRef.current.target, {
            x: initialCam.current.target[0],
            y: initialCam.current.target[1],
            z: initialCam.current.target[2],
            duration: 1.2,
            ease: 'power2.inOut',
            onUpdate: () => controlsRef.current?.update()
          });
        }
      }
    } else {
      carForwardStartRef.current = null;
    }

    // 애니메이션 상태나 자동차 뷰 상태가 변경될 때
    if ((isAnimating !== prevIsAnimating.current || showCarView !== prevShowCarView.current) && !isInitialRender.current) {
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

            // 1.5초 후에 빛 애니메이션과 함께 자동으로 복귀
            gsap.delayedCall(1.5, () => {
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

    // 첫 렌더링이 끝나면 플래그 업데이트
    if (isInitialRender.current) {
      isInitialRender.current = false;
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
      zoomSpeed={1.2}
      enableDamping={true}
    />
  );
});

function CarAnimationController({
  carDriveStage = 'idle',
  onCarDriveStageChange,
  children
}: {
  carDriveStage: 'idle' | 'back' | 'forward';
  onCarDriveStageChange?: (stage: 'idle' | 'back' | 'forward') => void;
  children: (carX: number, carZ: number) => React.ReactNode;
}) {
  const [carZ, setCarZ] = useState(-5);
  const [carX, setCarX] = useState(-20);
  const [carAnimStage, setCarAnimStage] = useState<'idle' | 'back' | 'forward'>('idle');
  const carAnimRef = useRef<{backStart: number|null, forwardStart: number|null}>({backStart: null, forwardStart: null});

  useEffect(() => {
    if (carDriveStage === 'back' && carAnimStage === 'idle') {
      setCarAnimStage('back');
      carAnimRef.current.backStart = null;
    }
    if (carDriveStage === 'forward' && carAnimStage !== 'forward') {
      setCarAnimStage('forward');
      carAnimRef.current.forwardStart = null;
    }
    if (carDriveStage === 'idle') {
      setCarAnimStage('idle');
      setCarZ(-5);
      setCarX(-20);
    }
  }, [carDriveStage, carAnimStage]);

  useFrame((state) => {
    if (carAnimStage === 'back') {
      if (carAnimRef.current.backStart === null) carAnimRef.current.backStart = state.clock.getElapsedTime();
      const elapsed = state.clock.getElapsedTime() - (carAnimRef.current.backStart ?? 0);
      const duration = 0.6;
      const startZ = -5;
      const endZ = startZ - 2;
      const t = Math.min(elapsed / duration, 1);
      const newZ = startZ + (endZ - startZ) * t;
      setCarZ(newZ);
      setCarX(-20); // keep x fixed when reversing
      if (t >= 1) {
        setCarAnimStage('idle');
        if (onCarDriveStageChange) onCarDriveStageChange('forward');
      }
    } else if (carAnimStage === 'forward') {
      if (carAnimRef.current.forwardStart === null) carAnimRef.current.forwardStart = state.clock.getElapsedTime();
      const elapsed = state.clock.getElapsedTime() - (carAnimRef.current.forwardStart ?? 0);
      const duration = 1.0; // 더 빠르게
      const startZ = -7;
      const endZ = startZ + 60; // 더 멀리
      const startX = -20;
      const endX = -48; // 더 오른쪽으로
      const t = Math.min(elapsed / duration, 1);
      const newZ = startZ + (endZ - startZ) * t;
      const newX = startX + (endX - startX) * t;
      setCarZ(newZ);
      setCarX(newX);
      if (t >= 1) {
        setCarAnimStage('idle');
        if (onCarDriveStageChange) onCarDriveStageChange('idle');
      }
    }
  });

  return <>{children(carX, carZ)}</>;
}

export function Scene({ 
  isAnimating, 
  showCarView: initialShowCarView, 
  showBlockchainInfo, 
  onReturnToInitial,
  isDownloading = false,
  onDownloadComplete,
  ipfsFileInfo,
  verificationStage = 'idle',
  onVerificationStageChange,
  carDriveStage = 'idle',
  onCarDriveStageChange
}: SceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomComplete, setZoomComplete] = useState(false);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [showCarView, setShowCarView] = useState(initialShowCarView);
  const [isShowingIpfsInfo, setIsShowingIpfsInfo] = useState(false);
  const [currentVerificationStage, setCurrentVerificationStage] = useState(verificationStage);
  const [closeupStage, setCloseupStage] = useState<'none' | 'hash' | 'cpabe' | 'final'>('none');
  const cameraControllerRef = useRef<{
    returnToInitialView: () => void;
  }>();

  // 상위 컴포넌트의 검증 상태 변경 시 현재 상태 업데이트
  useEffect(() => {
    if (verificationStage !== currentVerificationStage) {
      setCurrentVerificationStage(verificationStage);
      if (onVerificationStageChange) {
        onVerificationStageChange(verificationStage);
      }
    }
  }, [verificationStage, currentVerificationStage, onVerificationStageChange]);

  useEffect(() => {
    setCurrentVerificationStage(verificationStage);
  }, [verificationStage]);

  useEffect(() => {
    if (showCarView !== initialShowCarView) {
      setShowCarView(initialShowCarView);
    }
  }, [initialShowCarView]);

  useEffect(() => {
    console.log('State changed:', {
      showCarView,
      showUpdatePanel,
      isAnimating,
      zoomComplete
    });
  }, [showCarView, showUpdatePanel, isAnimating, zoomComplete]);

  // 검증 단계 변화 감지 및 클로즈업 복귀 타이머
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (currentVerificationStage === 'hash-verification') {
      setCloseupStage('hash');
      timeout = setTimeout(() => setCloseupStage('none'), 6000);
    } else if (currentVerificationStage === 'cpabe-decryption') {
      setCloseupStage('cpabe');
      timeout = setTimeout(() => setCloseupStage('none'), 6000);
    } else if (currentVerificationStage === 'final-decryption') {
      setCloseupStage('final');
      timeout = setTimeout(() => setCloseupStage('none'), 12000); // 12초로 증가
    } else {
      setCloseupStage('none');
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentVerificationStage]);

  const handleUpdateConfirm = () => {
    setShowUpdatePanel(false);
    if (cameraControllerRef.current) {
      cameraControllerRef.current.returnToInitialView();
      onReturnToInitial?.();
    }
  };

  React.useEffect(() => {
    function handleResetCamera() {
      if (cameraControllerRef.current && cameraControllerRef.current.returnToInitialView) {
        cameraControllerRef.current.returnToInitialView();
      }
    }
    window.addEventListener('resetCamera', handleResetCamera);
    return () => window.removeEventListener('resetCamera', handleResetCamera);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [-130, 10, 40], fov: 60 }}
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
        <SkyModel scale={600} position={[0, -30, 0]} rotation={[-Math.PI/2, 0, 0]} />
        <Suspense fallback={null}>
          <RoadModel 
            scale={0.1} 
            position={[3, -55, 0]} 
            rotation={[0, Math.PI / 2, 0]} 
          />
          <CarAnimationController carDriveStage={carDriveStage} onCarDriveStageChange={onCarDriveStageChange}>
            {(carX, carZ) => (
              <group>
                <TeslaModel 
                  scale={0.1} 
                  position={[carX, -5, carZ]} 
                  rotation={[0, (5 * Math.PI / 6) - (Math.PI / 36), 0]} 
                />
                {/* 검증 프로세스 시각화 */}
                {currentVerificationStage !== 'idle' && (
                  <group position={[-20, 5, -5]}>
                    <VerificationProcess
                      stage={currentVerificationStage}
                      position={[0, 0, 0]}  // 차량 바로 위에 위치
                      scale={1.5}
                    />
                  </group>
                )}
                {/* 검증 단계 시각화만 표시 */}
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
                  <Html position={[-50, -1, -30]} rotation={[0, Math.PI + (Math.PI / 1.65), 0]} transform occlude scale={2.8}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.9)',
                      padding: '25px',
                      borderRadius: '12px',
                      color: 'white',
                      width: '480px',
                      fontFamily: '-apple-system, sans-serif'
                    }}>
                      <h3 style={{ margin: '0 0 25px 0', fontSize: '1.4em' }}>블록체인 데이터 정보</h3>
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
                            eyJDX3RpbGRlIjogIk16cGhTbEJ2UTFWTUIwcE9jbU12...
                          </div>
                        </div>
                      </div>
                      {/* 데이터 무결성 검증 완료 패널 제거됨 */}
                      {/*
                      {currentVerificationStage !== 'idle' && (
                        <div style={{ marginTop: '25px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div style={{ color: '#22C55E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2em' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17L4 12" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            데이터 무결성 검증 완료
                          </div>
                          <div style={{ fontSize: '1.1em', color: '#9CA3AF' }}>모든 데이터가 성공적으로 검증되었습니다.</div>
                        </div>
                      )}
                      */}
                    </div>
                  </Html>
                )}
              </group>
            )}
          </CarAnimationController>
          <Blockchain 
            scale={2.9} 
            isAnimating={zoomComplete} 
            position={[-30, 35, -45]}
            showBlockchainInfo={showBlockchainInfo}
          />
          <IPFS 
            scale={3.4}
            isAnimating={isAnimating} 
            position={[-5, 25, 40]}
            isDownloading={isDownloading}
            onDownload={() => {
              if (ipfsFileInfo) {
                setIsShowingIpfsInfo(true);
                onDownloadComplete?.();
              }
            }}
            ipfsFileInfo={ipfsFileInfo}
          />
          {/* IPFS 파일 정보 패널 */}
          {isShowingIpfsInfo && ipfsFileInfo && (
            <Html position={[45, -1, 78]} rotation={[0, Math.PI + (Math.PI / 1.75), 0]} transform occlude scale={5.3}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.9)',
                padding: '25px',
                borderRadius: '12px',
                color: 'white',
                width: '480px',
                fontFamily: '-apple-system, sans-serif'
              }}>
                <h3 style={{ margin: '0 0 25px 0', fontSize: '1.4em' }}>IPFS 파일 정보</h3>
                <div style={{ marginBottom: '25px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '1.1em' }}>파일명</div>
                    <div style={{ 
                      background: 'rgba(96, 165, 250, 0.1)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      color: '#60A5FA',
                      fontSize: '1.1em',
                      fontFamily: 'monospace'
                    }}>
                      {ipfsFileInfo.name}
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '1.1em' }}>IPFS CID</div>
                    <div style={{ 
                      background: 'rgba(96, 165, 250, 0.1)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      color: '#60A5FA',
                      fontSize: '1.1em',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}>
                      {ipfsFileInfo.cid}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '1.1em' }}>파일 크기</div>
                    <div style={{ 
                      background: 'rgba(96, 165, 250, 0.1)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      color: '#60A5FA',
                      fontSize: '1.1em',
                      fontFamily: 'monospace'
                    }}>
                      {(ipfsFileInfo.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
              </div>
            </Html>
          )}
          <Environment preset="city" />
        </Suspense>
        <CameraController 
          ref={cameraControllerRef}
          isAnimating={isAnimating}
          showCarView={showCarView}
          showBlockchainInfo={showBlockchainInfo}
          closeupStage={closeupStage} // 추가
          carDriveStage={carDriveStage} // <-- 추가
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