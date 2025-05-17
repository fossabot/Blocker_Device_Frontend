import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createParticleSystem, updateParticles } from '../../utils/three/animations';
import type { ParticleSystemProps } from '../../types/three';

interface IPFSProps {
  position?: [number, number, number];
  isAnimating?: boolean;
  scale?: number;
}

export function IPFS({
  position = [15, 0, 0],
  isAnimating = false,
  scale = 1
}: IPFSProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points[]>([]);

  const totalNodes = 13; // 15개로 증가
  const activeNodes = [1, 3, 5, 7, 9, 11, 13]; // 활성 노드도 비례하여 증가

  // IPFS 노드와 연결 생성
  const { nodes, connections } = useMemo(() => {
    const nodes: JSX.Element[] = [];
    const connections: JSX.Element[] = [];

    for (let i = 0; i < totalNodes; i++) {
      const angle = (i / totalNodes) * Math.PI * 2 + (Math.random() * 0.5 - 0.25); // 각도에 무작위성 추가
      const radius = 6 + Math.random() * 2; // 5-7 사이의 무작위 반경
      const heightScale = 3; // y축 높이 증가
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2) * heightScale + (Math.random() * 2 - 1); // 높이에 무작위성 추가

      const isActive = activeNodes.includes(i);
      
      // 노드 생성
      nodes.push(
        <mesh
          key={`node-${i}`}
          ref={el => {
            if (el) nodesRef.current[i] = el;
          }}
          position={[x, y, z]}
        >
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshPhongMaterial
            color={isActive ? 0xe04c7f : 0xe08f4c}
            transparent
            opacity={isActive ? 0.9 : 0.5}
          />
        </mesh>
      );

      // 파티클 시스템 생성
      if (isActive && i < activeNodes.length - 1) {
        const nextActiveIndex = activeNodes[activeNodes.indexOf(i) + 1];
        const nextAngle = (nextActiveIndex / totalNodes) * Math.PI * 2;
        const nextX = Math.cos(nextAngle) * radius;
        const nextZ = Math.sin(nextAngle) * radius;
        const nextY = Math.sin(nextAngle * 2) * 2;

        const particleProps: ParticleSystemProps = {
          startPos: new THREE.Vector3(x, y, z),
          endPos: new THREE.Vector3(nextX, nextY, nextZ),
          color: 0xe04c7f,
          count: 50
        };

        const particles = createParticleSystem(particleProps);
        particlesRef.current.push(particles);
        connections.push(
          <primitive key={`particles-${i}`} object={particles} />
        );
      }
    }

    return { nodes, connections };
  }, []);

  // 애니메이션
  useFrame((state, delta) => {
    if (!isAnimating || !groupRef.current) return;

    const time = state.clock.elapsedTime;

    // 노드 움직임
    nodesRef.current.forEach((node, i) => {
      if (!node) return;
      
      const angle = (i / totalNodes) * Math.PI * 2 + (Math.sin(time * 0.5 + i) * 0.1); // 각도에 움직임 추가
      const radius = 7 + Math.sin(time + i * 1.5) * 0.5; // 반경 움직임
      const heightScale = 3;
      const flutter = Math.sin(time * 2 + i) * 0.3;

      node.position.x = Math.cos(angle) * (radius + flutter);
      node.position.y = Math.sin(angle * 2) * heightScale + flutter + Math.sin(time * 1.5 + i) * 0.5;
      node.position.z = Math.sin(angle) * (radius + flutter);
    });

    // 파티클 업데이트
    particlesRef.current.forEach(particles => {
      if (!particles) return;
      updateParticles(particles);
    });
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {nodes}
      {connections}
    </group>
  );
}