import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IPFSProps {
  position?: [number, number, number];
  isAnimating?: boolean;
  scale?: number;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export function IPFS({
  position = [15, 0, 0],
  isAnimating = false,
  scale = 1,
  onDownload,
  isDownloading = false
}: IPFSProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const transferNodeRef = useRef<THREE.Mesh | null>(null);
  const transferEndPosition = useRef(new THREE.Vector3(-10, -10, -9)); 
  const selectedNodeIndex = useRef(6); // 중앙에 위치한 노드
  const animationPhase = useRef<'idle' | 'transfer' | 'complete'>('idle');
  const [showTransferNode, setShowTransferNode] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const totalNodes = 13;
  const activeNodes = [1, 3, 5, 7, 9, 11, 13];

  // IPFS 노드 생성
  const nodes = useMemo(() => {
    const nodes: JSX.Element[] = [];

    for (let i = 0; i < totalNodes; i++) {
      const angle = (i / totalNodes) * Math.PI * 2;
      const radius = 7.5;
      const heightScale = 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2) * heightScale;
      
      const isActive = activeNodes.includes(i);
      
      nodes.push(
        <mesh
          key={`node-${i}`}
          ref={el => {
            if (el) {
              nodesRef.current[i] = el;
              // 선택된 노드의 위치를 저장
              if (i === selectedNodeIndex.current) {
                transferNodeRef.current = el.clone();
                transferNodeRef.current.visible = false;
                if (transferNodeRef.current.material) {
                  (transferNodeRef.current.material as THREE.MeshStandardMaterial).metalness = 0.3;
                  (transferNodeRef.current.material as THREE.MeshStandardMaterial).roughness = 0.6;
                  (transferNodeRef.current.material as THREE.MeshStandardMaterial).envMapIntensity = 0.8;
                }
              }
            }
          }}
          position={[x, y, z]}
        >
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color={isActive ? 0xe6c973 : 0xd4b866}
            transparent
            opacity={isActive ? 0.9 : 0.7}
            metalness={0.3}
            roughness={0.6}
            envMapIntensity={0.8}
          />
        </mesh>
      );
    }

    return nodes;
  }, []);

  // 다운로드 시작 시 초기화
  React.useEffect(() => {
    if (isDownloading) {
      animationPhase.current = 'transfer';
      startTimeRef.current = Date.now();
      setShowTransferNode(true);
      
      if (transferNodeRef.current && groupRef.current) {
        transferNodeRef.current.visible = true;
        const selectedNode = nodesRef.current[selectedNodeIndex.current];
        if (selectedNode) {
          transferNodeRef.current.position.copy(selectedNode.position);
          groupRef.current.add(transferNodeRef.current);
        }
      }
    }
  }, [isDownloading]);

  // 애니메이션
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // 기본 노드 움직임
    if (isAnimating) {
      nodesRef.current.forEach((node, i) => {
        if (!node) return;
        
        const angle = (i / totalNodes) * Math.PI * 2;
        const radius = 10;
        const heightScale = 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2) * heightScale;

        node.position.set(x, y, z);
      });
    }

    // 다운로드 애니메이션
    if (animationPhase.current === 'transfer' && startTimeRef.current) {
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      
      if (!transferNodeRef.current) return;

      const transferDuration = 2.0; // 2초 동안 이동
      const transferProgress = Math.min(elapsedTime / transferDuration, 1);
      
      // 부드러운 이징 적용
      const easedProgress = 1 - Math.cos(transferProgress * Math.PI / 2); // easeOut
      
      const startPos = nodesRef.current[selectedNodeIndex.current]?.position.clone();
      if (!startPos) return;
      
      // 위치 이동 및 크기 감소
      const newPosition = new THREE.Vector3().lerpVectors(
        startPos,
        transferEndPosition.current,
        easedProgress
      );
      
      transferNodeRef.current.position.copy(newPosition);
      const scale = 1 * (1 - easedProgress * 0.9); // 최종 크기를 원래 크기의 10%로
      transferNodeRef.current.scale.set(scale, scale, scale);
      
      // 블록이 차량에 도달하면 완료 및 사라짐 효과
      if (transferProgress === 1) {
        animationPhase.current = 'complete';
        setShowTransferNode(false);
        onDownload?.();
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {nodes}
    </group>
  );
}