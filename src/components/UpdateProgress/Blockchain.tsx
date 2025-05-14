import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface BlockchainProps {
  position?: [number, number, number];
  isAnimating?: boolean;
}

interface BlockLabelProps {
  text: string;
  position: [number, number, number];
}

const BlockLabel: React.FC<BlockLabelProps> = ({ text, position }) => (
  <Html position={position}>
    <div className="transaction-label">{text}</div>
  </Html>
);

export function Blockchain({ 
  position = [-15, 0, 0], 
  isAnimating = false
}: BlockchainProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blockRefs = useRef<THREE.Mesh[]>([]);
  const lineRefs = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>[]>([]);
  const lastBlockRef = useRef<THREE.Mesh | null>(null);
  const lastLineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null>(null);
  const animationStartTime = useRef<number | null>(null);
  const lightRef = useRef<THREE.Group | null>(null);
  const animationPhase = useRef<'none' | 'block' | 'light' | 'complete'>('none');
  const lightProgress = useRef<number>(0);
  const lightPathPositions = useRef<THREE.Vector3[]>([]);
  const currentLightSegment = useRef<number>(0);
  const totalLightSegments = 11; // 12->1번까지 총 11개의 세그먼트

  const totalBlocks = 11; // 항상 11개 블록만 표시
  const activeBlocks = [2, 5, 8]; // 11번 블록은 제외

  const [blockCreated, setBlockCreated] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // 즉시 블록 생성 애니메이션 시작
      animationPhase.current = 'block';
      animationStartTime.current = Date.now();
    }
  }, [isAnimating]);

  const createLightPath = () => {
    if (!groupRef.current) return;

    const positions: THREE.Vector3[] = [];
    
    // 12번 블록에서 시작
    const startPos = lastBlockPosition.clone();
    positions.push(startPos);

    // 나머지 블록들을 순회하며 경로 생성
    for (let i = totalBlocks - 1; i >= 0; i--) {
      const block = blockRefs.current[i];
      if (block) {
        positions.push(block.position.clone());
      }
    }

    // 두 점씩 경로 생성
    const paths: THREE.Vector3[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      paths.push(positions[i]);
      paths.push(positions[i + 1]);
    }

    lightPathPositions.current = paths;
    console.log('Created light path:', {
      totalPoints: paths.length,
      segments: paths.length / 2
    });
  };

  const updateLightPosition = () => {
    if (!lightRef.current || lightPathPositions.current.length === 0) return;

    const segmentIndex = currentLightSegment.current * 2;
    if (segmentIndex >= lightPathPositions.current.length - 1) return;

    const start = lightPathPositions.current[segmentIndex];
    const end = lightPathPositions.current[segmentIndex + 1];
    const progress = lightProgress.current;

    const newPosition = new THREE.Vector3().lerpVectors(start, end, progress);
    lightRef.current.position.copy(newPosition);
  };

  // 블록과 연결선 생성
  const { blocks, lines, lastBlockPosition } = useMemo(() => {
    const blocks: JSX.Element[] = [];
    const lines: JSX.Element[] = [];
    
    // 12번 블록의 위치 계산 (11번 블록 다음 위치)
    const lastIndex = totalBlocks - 1;
    const lastAngle = ((lastIndex + 1) / totalBlocks) * Math.PI * 4; // 마지막 다음 위치의 각도
    const radius = 7;
    const lastBlockX = Math.cos(lastAngle) * radius;
    const lastBlockZ = Math.sin(lastAngle) * radius;
    const lastBlockY = -10 + ((lastIndex + 1) * 1.3);
    const lastBlockPosition = new THREE.Vector3(lastBlockX, lastBlockY, lastBlockZ);

    for (let i = 0; i < totalBlocks; i++) {
      // 블록 위치 계산
      const angle = (i / totalBlocks) * Math.PI * 4;
      const radius = 7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = -10 + (i * 1.3);

      // 블록 생성
      const isActive = activeBlocks.includes(i);
      blocks.push(
        <mesh
          key={`block-${i}`}
          ref={el => {
            if (el) blockRefs.current[i] = el;
          }}
          position={[x, y, z]}
          scale={isActive ? 2 : 1}
        >
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshPhongMaterial
            color={isActive ? 0x4c7fe0 : 0x8faee5}
            transparent
            opacity={isActive ? 0.8 : 0.5}
          />
          {isActive && (
            <BlockLabel position={[0, 2, 0]} text={`Block #${i+1}`} />
          )}
        </mesh>
      );

      // 이전 블록과 연결선 생성
      if (i > 0) {
        const prevPos = new THREE.Vector3(
          Math.cos((i-1) / totalBlocks * Math.PI * 4) * radius,
          -10 + ((i-1) * 1.3),
          Math.sin((i-1) / totalBlocks * Math.PI * 4) * radius
        );
        const currentPos = new THREE.Vector3(x, y, z);
        
        const points = [prevPos, currentPos];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const line = (
          <line
            key={`line-${i}`}
            ref={el => {
              if (el) lineRefs.current[i-1] = el as any;
            }}
          >
            <bufferGeometry attach="geometry" {...lineGeometry} />
            <lineBasicMaterial
              attach="material"
              color={0x4c7fe0}
              transparent
              opacity={0.2}
            />
          </line>
        );
        lines.push(line);
      }
    }

    return { blocks, lines, lastBlockPosition };
  }, [totalBlocks, activeBlocks]);

  // 애니메이션
  useFrame(() => {
    if (!animationStartTime.current || animationPhase.current === 'none' || animationPhase.current === 'complete') return;

    const elapsedTime = (Date.now() - animationStartTime.current) / 1000;

    // 디버그 로그
    console.log('Animation timing:', {
      elapsedTime,
      animationPhase: animationPhase.current,
      currentSegment: currentLightSegment.current,
      progress: lightProgress.current,
      hasBlock: !!lastBlockRef.current,
      blockScale: lastBlockRef.current?.scale.x || 0
    });

    if (animationPhase.current === 'block') {
      if (!lastBlockRef.current || !lastLineRef.current) return;

      const blockProgress = Math.min(elapsedTime / 1, 1);
      
      lastBlockRef.current.position.copy(lastBlockPosition);
      lastBlockRef.current.scale.setScalar(blockProgress);
      lastLineRef.current.scale.setScalar(blockProgress);

      if (blockProgress === 1) {
        setBlockCreated(true);
        animationPhase.current = 'light';
        animationStartTime.current = Date.now();
        createLightPath();
      }
    } else if (animationPhase.current === 'light') {
      const totalPathDuration = 2.2; // 전체 경로를 도는 시간 (0.2초 * 11 세그먼트)
      const segmentDuration = totalPathDuration / totalLightSegments;
      const elapsedLightTime = elapsedTime;

      currentLightSegment.current = Math.min(Math.floor(elapsedLightTime / segmentDuration), totalLightSegments - 1);
      lightProgress.current = Math.min((elapsedLightTime % segmentDuration) / segmentDuration, 1);

      // 불빛 위치 업데이트
      if (!lightRef.current && groupRef.current) {
        // 불빛 그룹 생성 및 추가
        const lightGroup = new THREE.Group();
        
        // 발광하는 중심 구체
        const coreMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        lightGroup.add(coreMesh);
        
        // 내부 발광
        const innerGlowMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 0x4c7fe0,
            transparent: true,
            opacity: 0.3
          })
        );
        lightGroup.add(innerGlowMesh);
        
        // 외부 발광
        const outerGlowMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 0x4c7fe0,
            transparent: true,
            opacity: 0.1
          })
        );
        lightGroup.add(outerGlowMesh);
        
        groupRef.current.add(lightGroup);
        lightRef.current = lightGroup;
      }

      updateLightPosition();

      // 전체 경로 완료 체크
      if (elapsedLightTime >= totalPathDuration) {
        animationPhase.current = 'complete';
        console.log('Animation complete');
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {blocks}
      {lines}
      
      {/* 12번 블록과 연결선 - 항상 렌더링하되 scale로 제어 */}
      <mesh
        ref={lastBlockRef}
        position={lastBlockPosition}
        scale={0}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshPhongMaterial color={0x4c7fe0} transparent opacity={0.8} />
        <BlockLabel position={[0, 2, 0]} text="Block #12" />
      </mesh>
      
      <primitive object={new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          blockRefs.current[totalBlocks - 1]?.position || new THREE.Vector3(),
          lastBlockPosition
        ]),
        new THREE.LineBasicMaterial({ color: 0x4c7fe0, transparent: true, opacity: 0.2 })
      )} ref={lastLineRef} />

      {/* 불빛 효과 */}
      {animationPhase.current === 'light' && (
        <group ref={lightRef}>
          {/* 발광하는 중심 구체 */}
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
          
          {/* 내부 발광 */}
          <mesh>
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshBasicMaterial
              color={0x4c7fe0}
              transparent
              opacity={0.3}
            />
          </mesh>
          
          {/* 외부 발광 */}
          <mesh>
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshBasicMaterial
              color={0x4c7fe0}
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}