import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IPFSProps {
  position?: [number, number, number];
  isAnimating?: boolean;
  scale?: number;
  onDownload?: () => void;
  isDownloading?: boolean;
  ipfsFileInfo?: {
    cid: string;
    name: string;
    size: number;
  };
}

export function IPFS({
  position = [15, 0, 0],
  isAnimating = false,
  scale = 1,
  onDownload,
  isDownloading = false,
  ipfsFileInfo
}: IPFSProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const transferNodeRef = useRef<THREE.Mesh | null>(null);
  const transferEndPosition = useRef(new THREE.Vector3(-10, -10, -9)); 
  const selectedNodeIndex = useRef(6);
  const animationPhase = useRef<'idle' | 'transfer' | 'complete'>('idle');
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

  // 애니메이션
  useFrame(() => {
    if (!groupRef.current) return;

    // 항상 노드 살랑살랑 움직임 적용
    const t = Date.now() * 0.001;
    nodesRef.current.forEach((node, i) => {
      if (!node) return;
      const phase = i * 0.6;
      const amp = 0.18 + (i % 3) * 0.04;
      const freq = 0.8 + (i % 2) * 0.18;
      const angle = (i / totalNodes) * Math.PI * 2;
      const radius = 7.5;
      const heightScale = 3;
      const baseX = Math.cos(angle) * radius;
      const baseZ = Math.sin(angle) * radius;
      const baseY = Math.sin(angle * 2) * heightScale;
      node.position.x = baseX + Math.sin(t * freq + phase) * amp;
      node.position.y = baseY + Math.cos(t * freq * 0.7 + phase) * amp * 0.5;
      node.position.z = baseZ + Math.cos(t * freq + phase) * amp;
    });

    // 다운로드 애니메이션
    if (animationPhase.current === 'transfer' && startTimeRef.current) {
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      
      if (!transferNodeRef.current) return;

      const transferDuration = 1.5; // 기존 2.0 → 1.5초로 더 빠르게
      const transferProgress = Math.min(elapsedTime / transferDuration, 1);
      
      const easedProgress = 1 - Math.cos(transferProgress * Math.PI / 2);
      
      const startPos = nodesRef.current[selectedNodeIndex.current]?.position.clone();
      if (!startPos) return;
      
      const newPosition = new THREE.Vector3().lerpVectors(
        startPos,
        transferEndPosition.current,
        easedProgress
      );
      
      transferNodeRef.current.position.copy(newPosition);
      const scale = 1 * (1 - easedProgress * 0.9);
      transferNodeRef.current.scale.set(scale, scale, scale);
      
      if (transferProgress === 1) {
        animationPhase.current = 'complete';
        onDownload?.();
      }
    }
  });

  React.useEffect(() => {
    if (isDownloading) {
      animationPhase.current = 'transfer';
      startTimeRef.current = Date.now();
      
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

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {nodes}
    </group>
  );
}