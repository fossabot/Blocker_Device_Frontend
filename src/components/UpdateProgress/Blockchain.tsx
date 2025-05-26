import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BlockchainProps {
  position?: [number, number, number];
  isAnimating?: boolean;
  scale?: number;
  showBlockchainInfo?: boolean;
}

export function Blockchain({ 
  position = [-15, 0, 0], 
  isAnimating = false,
  scale = 1,
  showBlockchainInfo = false
}: BlockchainProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blockRefs = useRef<THREE.Mesh[]>([]);
  const lineRefs = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>[]>([]);
  const lastBlockRef = useRef<THREE.Mesh | null>(null);
  const lastLineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null>(null);
  const transferBlockRef = useRef<THREE.Mesh | null>(null);
  const animationStartTime = useRef<number | null>(null);
  const lightRef = useRef<THREE.Group | null>(null);
  const animationPhase = useRef<'none' | 'block' | 'light' | 'transfer' | 'complete'>('none');
  const lightProgress = useRef<number>(0);
  const lightPathPositions = useRef<THREE.Vector3[]>([]);
  const currentLightSegment = useRef<number>(0);
  const totalLightSegments = 11; // 12->1번까지 총 11개의 세그먼트

  const totalBlocks = 11; // 항상 11개 블록만 표시
  const activeBlocks = [1, 4, 5, 8]; // 2,4,6,9번 블록 (0-based index이므로 1 빼기)

  const [blockCreated, setBlockCreated] = useState(false);
  const [showTransferBlock, setShowTransferBlock] = useState(false);
  const transferStartPosition = useRef(new THREE.Vector3());
  const transferEndPosition = useRef(new THREE.Vector3(-10, -12, 18)); // 차량의 정확한 위치로 수정

  useEffect(() => {
    if (isAnimating) {
      // 즉시 블록 생성 애니메이션 시작
      animationPhase.current = 'block';
      animationStartTime.current = Date.now();
    }
  }, [isAnimating]);

  useEffect(() => {
    if (showBlockchainInfo && blockCreated) {
      // 블록체인 정보 수신 시 전송용 블록 표시 및 이동 애니메이션 시작
      console.log('Starting block transfer animation');
      setShowTransferBlock(true);
      animationPhase.current = 'transfer';
      animationStartTime.current = Date.now();
    }
  }, [showBlockchainInfo, blockCreated]);

  // 빛의 경로 생성
  const createLightPath = () => {
    if (!groupRef.current) return;

    const positions: THREE.Vector3[] = [];
    
    // 12번 블록에서 시작
    const startPos = lastBlockRef.current?.position.clone() || new THREE.Vector3();
    positions.push(startPos);
    transferStartPosition.current.copy(startPos);

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
      const angle = (i / totalBlocks) * Math.PI * 4;
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
          <meshStandardMaterial
            color={isActive ? 0x4c7fe0 : 0x8faee5}
            transparent
            opacity={isActive ? 0.9 : 0.6}
            metalness={0.3}
            roughness={0.7}
            envMapIntensity={0.8}
          />
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
    // 블록들이 항상 살랑살랑 움직이도록
    const t = Date.now() * 0.001;
    blockRefs.current.forEach((block, i) => {
      if (block) {
        // 각 블록마다 phase 다르게, 진폭/주기 랜덤하게
        const phase = i * 0.5;
        const amp = 0.15 + (i % 3) * 0.05;
        const freq = 0.7 + (i % 2) * 0.2;
        // 원래 위치에서 살짝 offset
        const angle = (i / totalBlocks) * Math.PI * 4;
        const radius = 7;
        const baseX = Math.cos(angle) * radius;
        const baseZ = Math.sin(angle) * radius;
        const baseY = -10 + (i * 1.3);
        block.position.x = baseX + Math.sin(t * freq + phase) * amp;
        block.position.y = baseY + Math.cos(t * freq * 0.7 + phase) * amp * 0.5;
        block.position.z = baseZ + Math.cos(t * freq + phase) * amp;
      }
    });

    if (!animationStartTime.current || animationPhase.current === 'none' || animationPhase.current === 'complete') {
      return;
    }

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
      lastBlockRef.current.scale.set(blockProgress * 2, blockProgress * 2, blockProgress * 2);
      lastLineRef.current.scale.setScalar(blockProgress);

      // 현재 세그먼트의 선 밝기 조정
      if (currentLightSegment.current < lineRefs.current.length) {
        // 전체 선들의 기본 밝기 설정
        lineRefs.current.forEach((line, index) => {
          if (line && line.material) {
            if (index < currentLightSegment.current) {
              line.material.opacity = 0.4; // 이미 지나간 선은 약간 밝게
            } else if (index > currentLightSegment.current) {
              line.material.opacity = 0.2; // 아직 지나지 않은 선은 어둡게
            }
          }
        });

        // 현재 선 매우 밝게 표시
        const currentLine = lineRefs.current[currentLightSegment.current];
        if (currentLine && currentLine.material) {
          currentLine.material.opacity = 0.8; // 현재 선은 가장 밝게
        }
      }

      if (blockProgress === 1) {
        setBlockCreated(true);
        // 빛 이동 애니메이션을 12번 블록 생성 직후 바로 시작
        animationPhase.current = 'light';
        animationStartTime.current = Date.now();
        createLightPath();
        // setTimeout(() => {
        //   animationPhase.current = 'light';
        //   animationStartTime.current = Date.now();
        //   createLightPath();
        // }, 2000); // 카메라가 원래 위치로 돌아갈 시간을 주기 위해 2초 대기 (기존 코드 주석처리)
      }
    } else if (animationPhase.current === 'light') {
      // 불빛 이동 속도를 더 천천히: 기존 1.1초 → 2.2초로 변경
      const totalPathDuration = 2.2;
      const segmentDuration = totalPathDuration / totalLightSegments;
      const elapsedLightTime = elapsedTime;

      currentLightSegment.current = Math.min(Math.floor(elapsedLightTime / segmentDuration), totalLightSegments - 1);
      lightProgress.current = Math.min((elapsedLightTime % segmentDuration) / segmentDuration, 1);

      updateLightPosition();

      // 전체 경로 완료 체크
      if (elapsedLightTime >= totalPathDuration) {
        animationPhase.current = 'transfer';
        animationStartTime.current = Date.now();
      }
    } else if (animationPhase.current === 'transfer') {
      // 복제된 블록이 차량으로 이동하는 애니메이션
      if (!transferBlockRef.current || !lastBlockRef.current) return;

      const transferDuration = 2.0; // 2초 동안 이동
      const transferProgress = Math.min(elapsedTime / transferDuration, 1);
      
      // 부드러운 이징 적용
      const easedProgress = 1 - Math.cos(transferProgress * Math.PI / 2); // easeOut
      
      const startPos = lastBlockRef.current.position.clone();
      
      // 위치 이동 및 크기 감소
      const newPosition = new THREE.Vector3().lerpVectors(
        startPos,
        transferEndPosition.current,
        easedProgress
      );
      
      transferBlockRef.current.position.copy(newPosition);
      const scale = 2 * (1 - easedProgress * 0.9); // 최종 크기를 원래 크기의 10%로 수정
      transferBlockRef.current.scale.set(scale, scale, scale);
      
      // 블록이 차량에 도달하면 완료 및 사라짐 효과
      if (transferProgress === 1) {
        animationPhase.current = 'complete';
        setShowTransferBlock(false); // 블록을 사라지게 함
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {blocks}
      {lines}
      
      {/* 12번 블록과 연결선 - 항상 렌더링 */}
      <mesh
        ref={lastBlockRef}
        position={lastBlockPosition}
        scale={[0, 0, 0]}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={0x4c7fe0}
          transparent
          opacity={0.8}
          metalness={0.3}
          roughness={0.7}
          envMapIntensity={0.8}
        />
      </mesh>
      
      <primitive object={new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          blockRefs.current[totalBlocks - 1]?.position || new THREE.Vector3(),
          lastBlockPosition
        ]),
        new THREE.LineBasicMaterial({ color: 0x4c7fe0, transparent: true, opacity: 0.2 })
      )} ref={lastLineRef} />

      {/* 전송용 복제 블록 */}
      {showTransferBlock && (
        <mesh
          ref={transferBlockRef}
          position={lastBlockPosition.clone()}
          scale={[2, 2, 2]}
        >
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial
            color={0x4c7fe0}
            transparent
            opacity={0.8}
            metalness={0.3}
            roughness={0.7}
            envMapIntensity={0.8}
          />
        </mesh>
      )}

      {/* 불빛 효과 */}
      <group ref={lightRef} visible={animationPhase.current === 'light'}>
        {/* 발광하는 중심 구체 */}
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        
        {/* 발광 효과 */}
        <mesh>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshBasicMaterial
            color={0x4c7fe0}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}