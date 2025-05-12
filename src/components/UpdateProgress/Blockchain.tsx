import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface BlockchainProps {
  position?: [number, number, number];
  isAnimating?: boolean;
  showBlockInfo?: boolean;
  triggerAnimation?: boolean;
}

// HTML 라벨 컴포넌트
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

  const totalBlocks = 12;
  const activeBlocks = [2, 5, 8, 11];

  // 블록과 연결선 생성
  const { blocks, lines } = useMemo(() => {
    const blocks: JSX.Element[] = [];
    const lines: JSX.Element[] = [];
    
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
        
        lines.push(
          <line
            key={`line-${i}`}
            ref={el => {
              if (el) {
                // Cast to any first since the type system doesn't recognize the correct type
                lineRefs.current[i-1] = el as any;
              }
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
      }
    }

    return { blocks, lines };
  }, []);

  // 애니메이션
  useFrame(({ clock }) => {
    if (!isAnimating || !groupRef.current) return;

    const time = clock.elapsedTime;
    blockRefs.current.forEach((block, i) => {
      if (!block) return;
      
      const angle = (i / totalBlocks) * Math.PI * 4;
      const radius = 7;
      const moveX = Math.sin(time + i * 0.5) * 0.1;
      const moveY = Math.cos(time + i * 0.5) * 0.1;
      const moveZ = Math.sin(time + i * 0.5) * 0.1;

      block.position.x = Math.cos(angle) * radius + moveX;
      block.position.y = -10 + (i * 1.3) + moveY;
      block.position.z = Math.sin(angle) * radius + moveZ;

      // 연결선 업데이트
      if (i > 0) {
        const line = lineRefs.current[i-1];
        if (!line) return;

        const prevBlock = blockRefs.current[i-1];
        if (!prevBlock) return;

        const positions = new Float32Array([
          prevBlock.position.x, prevBlock.position.y, prevBlock.position.z,
          block.position.x, block.position.y, block.position.z
        ]);

        line.geometry.setAttribute('position', 
          new THREE.BufferAttribute(positions, 3)
        );
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {blocks}
      {lines}
    </group>
  );
}