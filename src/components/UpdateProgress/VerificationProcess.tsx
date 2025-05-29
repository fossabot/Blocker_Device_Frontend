import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import GoldKey from './GoldKey';
import KeyCard from './KeyCard';

interface VerificationProcessProps {
  stage: 'hash-verification' | 'cpabe-decryption' | 'final-decryption' | 'idle';
  position?: [number, number, number];
  scale?: number;
  onCpabeDecryptionComplete?: () => void;
}

export function VerificationProcess({
  stage,
  position = [0, 0, 0],
  scale = 1,
  onCpabeDecryptionComplete
}: VerificationProcessProps) {
  const hashCube1Ref = useRef<THREE.Mesh>(null);
  const hashCube2Ref = useRef<THREE.Mesh>(null);
  const lockRef = useRef<THREE.Group>(null);
  const fileModelRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // --- Hash merge animation state ---
  const [isMerging, setIsMerging] = useState(false);
  const [merged, setMerged] = useState(false);
  const [cube1Pos, setCube1Pos] = useState<[number, number, number]>([-7, 1.5, 0]);
  const [cube2Pos, setCube2Pos] = useState<[number, number, number]>([7, 1.5, 0]);
  const [cubeColor, setCubeColor] = useState('#60A5FA');
  const [showLabels, setShowLabels] = useState(true);

  // 파티클 시스템 설정
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(500 * 3); // 500개의 파티클로 증가
    const colors = new Float32Array(500 * 3); // 각 파티클의 색상
    
    for(let i = 0; i < positions.length; i += 3) {
      // 위치: 더 넓은 범위에 분포
      positions[i] = (Math.random() - 0.5) * 12;
      positions[i + 1] = (Math.random() - 0.5) * 12;
      positions[i + 2] = (Math.random() - 0.5) * 12;
      
      // 색상: 보라색 계열의 그라데이션
      const mixFactor = Math.random();
      colors[i] = 0.7 + mixFactor * 0.3; // R: 파티클마다 다른 빨강 값
      colors[i + 1] = 0.3 + mixFactor * 0.4; // G: 파티클마다 다른 초록 값
      colors[i + 2] = 0.9 + mixFactor * 0.1; // B: 파티클마다 다른 파랑 값
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    return geometry;
  }, []);

  // --- Device Private Key Animation State (for cpabe-decryption) ---
  const [keyPhase, setKeyPhase] = useState<'wait' | 'jump1' | 'jump2' | 'appear' | 'wait2' | 'move' | 'enter' | 'light' | 'symmetric'>('wait');
  const [keyAnimTime, setKeyAnimTime] = useState(0); // seconds since phase start
  const keyAnimRef = useRef<number>(0);
  const keyPhaseStart = useRef<number>(0);

  // Phase durations (seconds)
  const keyPhaseDurations = {
    wait: 1.0,      // 첫 대기 1초 (2초→1초로 변경)
    jump1: 0.5,     // 점프1
    jump2: 0.5,     // 점프2
    appear: 0.7,    // 포물선 이동(차량→암호문 앞)
    move: 0.7,      // 포물선 이동(암호문 앞→암호문 내부)
    enter: 0.5,     // 암호문 안으로 진입
    light: 0.6,
    symmetric: 0.1
  };

  // Phase transition logic (cpabe-decryption only)
  const appearStarted = useRef(false);
  useEffect(() => {
    if (stage !== 'cpabe-decryption') {
      setKeyPhase('wait');
      setKeyAnimTime(0);
      keyPhaseStart.current = 0;
      appearStarted.current = false;
      return;
    }
    if (!appearStarted.current) {
      setKeyPhase('wait');
      setKeyAnimTime(0);
      keyPhaseStart.current = performance.now();
      appearStarted.current = true;
    }
    let raf: number;
    function animate() {
      const now = performance.now();
      const elapsed = (now - keyPhaseStart.current) / 1000;
      setKeyAnimTime(elapsed);
      let nextPhase: typeof keyPhase = keyPhase;
      if (keyPhase === 'wait' && elapsed > keyPhaseDurations.wait) nextPhase = 'jump1';
      if (keyPhase === 'jump1' && elapsed > keyPhaseDurations.jump1) nextPhase = 'jump2';
      if (keyPhase === 'jump2' && elapsed > keyPhaseDurations.jump2) nextPhase = 'appear';
      if (keyPhase === 'appear' && elapsed > keyPhaseDurations.appear) nextPhase = 'move'; // wait2 삭제, 바로 move로
      if (keyPhase === 'move' && elapsed > keyPhaseDurations.move) nextPhase = 'enter';
      if (keyPhase === 'enter' && elapsed > keyPhaseDurations.enter) nextPhase = 'light';
      if (keyPhase === 'light' && elapsed > keyPhaseDurations.light) nextPhase = 'symmetric';
      if (nextPhase !== keyPhase) {
        setKeyPhase(nextPhase);
        setKeyAnimTime(0);
        keyPhaseStart.current = now;
      } else {
        raf = requestAnimationFrame(animate);
      }
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [stage, keyPhase]);

  // 애니메이션 프레임
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 해시 검증 애니메이션
    if (stage === 'hash-verification' && hashCube1Ref.current && hashCube2Ref.current) {
      if (!isMerging && Math.abs(hashCube1Ref.current.position.x - hashCube2Ref.current.position.x) < 1.2) {
        setIsMerging(true);
      }
      if (!isMerging) {
        // Approach
        const newX1 = THREE.MathUtils.lerp(hashCube1Ref.current.position.x, -0.5, 0.02);
        const newX2 = THREE.MathUtils.lerp(hashCube2Ref.current.position.x, 0.5, 0.02);
        hashCube1Ref.current.position.x = newX1;
        hashCube2Ref.current.position.x = newX2;
        setCube1Pos([newX1, 1.5, 0]);
        setCube2Pos([newX2, 1.5, 0]);
        // 큐브 회전 (더 복잡한 패턴)
        hashCube1Ref.current.rotation.y += 0.02;
        hashCube1Ref.current.rotation.x = Math.sin(time) * 0.2;
        hashCube2Ref.current.rotation.y -= 0.02;
        hashCube2Ref.current.rotation.x = Math.cos(time) * 0.2;
      } else if (!merged) {
        // Merge animation
        if (hashCube1Ref.current && hashCube2Ref.current) {
          // Interpolate positions to center
          const x1 = THREE.MathUtils.lerp(hashCube1Ref.current.position.x, 0, 0.18);
          const x2 = THREE.MathUtils.lerp(hashCube2Ref.current.position.x, 0, 0.18);
          hashCube1Ref.current.position.x = x1;
          hashCube2Ref.current.position.x = x2;
          setCube1Pos([x1, 1.5, 0]);
          setCube2Pos([x2, 1.5, 0]);
          // Fade out cubes as they merge
          if (Math.abs(x1) < 0.1 && Math.abs(x2) < 0.1) {
            setShowLabels(false);
            setMerged(true);
            setCubeColor('#22C55E'); // green
          }
        }
      }
    }      // CP-ABE 복호화 애니메이션
    if (stage === 'cpabe-decryption' && lockRef.current && fileModelRef.current) {
      // 차량 키와 CP-ABE 구체의 복호화 진행 상태 시각화
      const decryptProgress = Math.min(1, time / 12); // 12초에 걸쳐 완료되는 효과 (기존 10초에서 늘림)
      const finalPhase = decryptProgress > 0.8; // 최종 단계 여부 - 새로운 대칭키 생성

      // CP-ABE 구체 회전 효과 - 좀 더 부드럽고 세련된 움직임
      lockRef.current.rotation.y = finalPhase ? 
        THREE.MathUtils.lerp(lockRef.current.rotation.y, 0, 0.05) : // 최종 단계에서는 안정화
        time * 0.15;
      
      lockRef.current.rotation.x = finalPhase ?
        THREE.MathUtils.lerp(lockRef.current.rotation.x, 0, 0.05) : // 최종 단계에서는 안정화
        Math.sin(time * 0.1) * 0.05;
      
      // 중심 구체들에 대한 애니메이션 (CP-ABE 암호화 구체)
      if(lockRef.current.children.length > 0) {
        const sphereGroup = lockRef.current.children[0];
        if(sphereGroup.children.length >= 3) {
          // 외부 구체 효과 - CP-ABE 암호문
          const outerSphere = sphereGroup.children[0] as THREE.Mesh;
          if(outerSphere.material instanceof THREE.MeshStandardMaterial) {
            // 키 대입에 따른 외부 구체 반응
            if (finalPhase) {
              // 최종 단계에서 외부 구체는 더 투명해짐 (내부 대칭키만 남도록)
              outerSphere.material.opacity = THREE.MathUtils.lerp(
                outerSphere.material.opacity, 
                0.3, 
                0.1
              );
            } else {
              outerSphere.material.opacity = 0.9 - decryptProgress * 0.4;
            }
            
            // 색상이 키 대입에 따라 변화 (분홍색 -> 금색)
            const colorProgress = Math.min(1, decryptProgress * 1.5);
            const startColor = new THREE.Color(0xEC4899); // 분홍색
            const endColor = new THREE.Color(0xF59E0B); // 금색
            outerSphere.material.color.copy(startColor).lerp(endColor, colorProgress);
            outerSphere.material.emissive.copy(startColor).lerp(endColor, colorProgress);
            outerSphere.material.emissiveIntensity = finalPhase ? 
              0.8 + Math.sin(time * 3) * 0.2 : // 최종 단계에서 강한 발광 맥동
              0.4 + decryptProgress * 0.5;
          }
          
          // 내부 구체 - 복호화 진행 시각화 (대칭키 형성)
          const innerSphere = sphereGroup.children[1] as THREE.Mesh;
          if(innerSphere.material instanceof THREE.MeshStandardMaterial) {
            if (finalPhase) {
              // 최종 단계에서 내부 구체(대칭키)는 더 뚜렷하게 표현
              innerSphere.material.opacity = THREE.MathUtils.lerp(
                innerSphere.material.opacity, 
                1.0, 
                0.1
              );
              
              // 최종 단계에서 발광 효과 강화 (대칭키 완성)
              const finalPulse = 1.0 + Math.sin(time * 4) * 0.15;
              innerSphere.material.emissiveIntensity = 1.2 + finalPulse * 0.3;
              
              // 완전한 금색으로 고정 (대칭키 색상)
              innerSphere.material.color.set(0xFCD34D);
              innerSphere.material.emissive.set(0xFCD34D);
              
              // 완성된 대칭키는 약간 더 큰 규모로 표현
              const finalKeySize = 1.0 + Math.sin(time * 2.5) * 0.05;
              innerSphere.scale.set(finalKeySize, finalKeySize, finalKeySize);
            } else {
              // 점진적 변화 단계
              // 더 세련된 맥동 효과
              const pulseFrequency = 1.5 + decryptProgress * 2; // 진행에 따라 맥동 빈도 증가
              const baseEmissive = 0.7 + Math.sin(time * pulseFrequency) * 0.3;
              innerSphere.material.emissiveIntensity = baseEmissive + decryptProgress * 0.6;
              
              // 키 대입이 진행됨에 따라 색상이 분홍색에서 금색으로 변화 (대칭키로 변화)
              const colorProgress = Math.min(1, decryptProgress * 1.2);
              const startColor = new THREE.Color(0xFF99CC); // 연한 분홍색
              const endColor = new THREE.Color(0xFCD34D); // 금색 (대칭키 색상)
              innerSphere.material.color.copy(startColor).lerp(endColor, colorProgress);
              innerSphere.material.emissive.copy(startColor).lerp(endColor, colorProgress);
              
              // 키 대입 진행에 따른 내부 구체 맥동
              // 더 세련된 맥동 패턴 - 진행에 따라 안정적인 맥동으로 변화
              const pulseFrequency2 = 3 + decryptProgress * 2;
              const pulseAmplitude = 0.1 + decryptProgress * 0.15;
              const pulseIntensity = 1 + Math.sin(time * pulseFrequency2) * pulseAmplitude;
              innerSphere.scale.set(
                pulseIntensity,
                pulseIntensity,
                pulseIntensity
              );
            }
          }
          
          // 외부 와이어프레임 구체 - 디바이스 키 접근 네트워크 시각화
          const outerWireSphere = sphereGroup.children[2] as THREE.Mesh;
          
          if (finalPhase) {
            // 최종 단계에서 와이어프레임은 안정화되며 대칭키를 보호하는 구조로 표현
            // 더 부드러운 회전
            outerWireSphere.rotation.x = outerWireSphere.rotation.x + 0.002;
            outerWireSphere.rotation.z = outerWireSphere.rotation.z - 0.001;
            outerWireSphere.rotation.y = outerWireSphere.rotation.y + 0.003;
          } else {
            // 초기 단계의 더 역동적인 회전 패턴
            outerWireSphere.rotation.x = time * 0.15;
            outerWireSphere.rotation.z = time * -0.1;
            outerWireSphere.rotation.y = time * 0.2;
          }
          
          if(outerWireSphere.material instanceof THREE.MeshStandardMaterial) {
            if (finalPhase) {
              // 최종 단계에서 완전한 금색 와이어프레임
              outerWireSphere.material.color.set(0xFEF3C7);
              outerWireSphere.material.emissive.set(0xFEF3C7);
              outerWireSphere.material.emissiveIntensity = 0.7 + Math.sin(time * 3) * 0.2;
              outerWireSphere.material.opacity = 0.7 + Math.sin(time * 2) * 0.1;
            } else {
              // 와이어프레임 색상 변화 (흰색 -> 금색)
              const wireColorProgress = Math.min(1, decryptProgress * 1.5);
              const wireStartColor = new THREE.Color(0xFFFFFF);
              const wireEndColor = new THREE.Color(0xFEF3C7);
              outerWireSphere.material.color.copy(wireStartColor).lerp(wireEndColor, wireColorProgress);
              outerWireSphere.material.emissive.copy(wireStartColor).lerp(wireEndColor, wireColorProgress);
              outerWireSphere.material.emissiveIntensity = 0.2 + decryptProgress * 0.6;
              
              // 키 대입 진행에 따라 와이어프레임이 점점 활성화
              outerWireSphere.material.opacity = 0.3 + decryptProgress * 0.5;
            }
          }
        }
      }
      
      // 차량에서 생성된 키 애니메이션 (CP-ABE 구체로 이동)
      if (fileModelRef.current) {
        // 복호화 단계에 따라 다른 애니메이션 적용
        const decryptProgress = Math.min(1, time / 12); // 12초에 걸쳐 완료되는 효과 (기존 10초에서 늘림)
        
        if (decryptProgress < 0.5) {
          // 1단계: 차량에서 키가 생성되고 CP-ABE 구체로 이동
          const moveProgress = decryptProgress / 0.5; // 0~1 사이 값으로 정규화
          
          // 키가 차량에서 CP-ABE 구체로 부드럽게 이동
          const startX = -6;
          const endX = 3;
          const pathX = startX + (endX - startX) * moveProgress;
          
          // 호 형태의 경로로 이동 (위로 올라갔다가 내려옴)
          const pathY = 1.5 + Math.sin(moveProgress * Math.PI) * 2;
          
          // 키 위치 업데이트
          fileModelRef.current.position.x = pathX;
          fileModelRef.current.position.y = pathY;
          
          // 키가 이동하면서 회전 (목적지를 향해 자연스럽게 회전)
          fileModelRef.current.rotation.y = Math.PI / 2 + moveProgress * Math.PI;
          fileModelRef.current.rotation.z = Math.sin(moveProgress * Math.PI) * 0.5;
        } else if (decryptProgress < 0.8) {
          // 2단계: 키가 CP-ABE 구체에 대입되는 애니메이션
          const insertProgress = (decryptProgress - 0.5) / 0.3; // 0~1 사이 값으로 정규화
          
          // 키가 CP-ABE 구체에 가까워짐 (살짝 안으로 들어감)
          fileModelRef.current.position.x = 3 - insertProgress * 1.0;
          fileModelRef.current.position.y = 1.5;
          
          // 키 회전 (삽입되는 움직임)
          fileModelRef.current.rotation.y = Math.PI * 1.5;
          fileModelRef.current.rotation.x = 0;
          fileModelRef.current.rotation.z = 0;
        } else {
          // 3단계: 새로운 대칭키 생성 (원래 키는 서서히 사라짐)
          const finalProgress = (decryptProgress - 0.8) / 0.2; // 0~1 사이 값으로 정규화
          
          // 원래 키가 점차 투명해지고 사라짐
          if (fileModelRef.current.children.length > 0) {
            const model = fileModelRef.current.children[0] as THREE.Group;
            if (model && model.children.length > 0) {
              model.children.forEach((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.opacity = 1.0 - finalProgress * 0.9;
                  child.material.transparent = true;
                }
              });
            }
            
            // 발광 효과도 점차 감소
            const keyLight = fileModelRef.current.children[1] as THREE.PointLight;
            if (keyLight) {
              keyLight.intensity = 2.5 * (1.0 - finalProgress);
              keyLight.distance = 7 * (1.0 - finalProgress);
            }
          }
          
          // 키가 CP-ABE 구체에 완전히 흡수됨
          fileModelRef.current.position.x = 2.0 - finalProgress * 2.0;
          fileModelRef.current.scale.set(
            1.0 - finalProgress * 0.9,
            1.0 - finalProgress * 0.9,
            1.0 - finalProgress * 0.9
          );
          
          // 새로운 대칭키가 차량 위로 이동하여 떠 있음 (최종 단계)
          if (finalProgress > 0.5) {
            // CP-ABE 대칭키 라벨 추가
            const labelExists = document.querySelector('.symmetric-key-label');
            if (!labelExists) {
              const label = document.createElement('div');
              label.className = 'symmetric-key-label';
              label.style.position = 'absolute';
              label.style.backgroundColor = 'rgba(30,41,59,0.92)';
              label.style.color = '#fff';
              label.style.padding = '2px 10px';
              label.style.borderRadius = '6px';
              label.style.fontSize = '0.95em';
              label.style.fontWeight = '500';
              label.style.border = '1.5px solid #FCD34D';
              label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
              label.style.whiteSpace = 'nowrap';
              label.style.pointerEvents = 'none';
              label.style.letterSpacing = '0.01em';
              label.style.transform = 'translate(-50%, -50%)';
              label.style.opacity = '0';
              label.style.transition = 'opacity 0.5s ease';
              label.textContent = '생성된 대칭키';
              
              // 위치 계산 (차량 위에 위치)
              label.style.left = '40%';
              label.style.top = '35%';
              
              document.body.appendChild(label);
              
              // 애니메이션을 위한 지연 표시
              setTimeout(() => {
                label.style.opacity = '1';
              }, 100);
            }
          }
        }
      }
    }    // 최종 복호화 애니메이션
    if (stage === 'final-decryption' && fileModelRef.current && particlesRef.current) {
      // 차량 위 대칭키 회전 및 효과
      const carSymmetricKey = fileModelRef.current.parent?.children[0] as THREE.Group;
      if (carSymmetricKey) {
        carSymmetricKey.rotation.y = time * 0.3;
        carSymmetricKey.position.y = 2.5 + Math.sin(time * 1.5) * 0.1;
        
        // 대칭키 내부 구체 맥동 효과
        if (carSymmetricKey.children.length > 0) {
          const keyCore = carSymmetricKey.children[0] as THREE.Mesh;
          const keyWireframe = carSymmetricKey.children[1] as THREE.Mesh;
          const pulse = 1.0 + Math.sin(time * 2) * 0.1;
          keyCore.scale.set(pulse, pulse, pulse);
          
          if (keyWireframe) {
            keyWireframe.rotation.y = time * -0.2;
            keyWireframe.rotation.x = time * 0.15;
          }
        }
      }
      
      // 파일 모델 기본 회전 및 효과
      fileModelRef.current.rotation.y = time * 0.2;
      fileModelRef.current.position.y = 1.5 + Math.sin(time * 1.5) * 0.08;
      
      // 복호화 진행 상태 계산 (처음 5초 동안 진행)
      const decryptProgress = Math.min(1, time / 5);

      // 차량의 대칭키가 파일을 복호화하는 과정 애니메이션
      if(fileModelRef.current.children.length > 0) {
        // 암호화된 파일 모델 (잠긴 상태)
        if(fileModelRef.current.children[0]) {
          const encryptedFile = fileModelRef.current.children[0] as THREE.Mesh;
          
          // 복호화 진행에 따른 파일 상태 변화
          if(encryptedFile.material instanceof THREE.MeshStandardMaterial) {
            // 파일 색상이 점진적으로 변화 (보라색 -> 청록색) - 복호화 진행 표시
            const colorProgress = Math.min(1, decryptProgress * 1.5); // 빠른 색상 변화
            const startColor = new THREE.Color(0xA855F7); // 처음 보라색 (암호화됨)
            const endColor = new THREE.Color(0x0EA5E9); // 청록색 (복호화됨)
            encryptedFile.material.color.copy(startColor).lerp(endColor, colorProgress);
            encryptedFile.material.emissive.copy(startColor).lerp(endColor, colorProgress);
            
            // 투명도가 점차 변화 - 완전히 복호화되면 더 선명해짐
            encryptedFile.material.opacity = 0.7 + colorProgress * 0.3;
            
            // 발광 강도도 점차 높아짐 - 복호화가 진행될수록 더 밝게
            encryptedFile.material.emissiveIntensity = 0.3 + colorProgress * 0.6;
            
            // 파일 자체의 스케일 효과 - 복호화가 완료되면 약간 확장
            if (colorProgress > 0.8) {
              const pulseScale = 1.0 + (colorProgress - 0.8) * 0.1 + Math.sin(time * 3) * 0.02;
              encryptedFile.scale.set(pulseScale, pulseScale, 1);
            }
          }
        }
        
        // 파일 내부 데이터 라인 애니메이션 - 데이터가 해독되는 모습
        for(let i = 1; i < 9; i++) {
          if(fileModelRef.current.children[i]) {
            const dataLine = fileModelRef.current.children[i] as THREE.Mesh;
            
            // 각 데이터 라인이 순차적으로 복호화되는 효과
            // 더 명확한 진행감을 위해 시작 시점 조정
            const lineDecryptThreshold = i * 0.08; // 각 라인의 복호화 시작 시점
            const lineDecrypting = decryptProgress > lineDecryptThreshold;
            
            if(dataLine.material instanceof THREE.MeshStandardMaterial) {
              // 라인이 순차적으로 복호화됨 - 투명도로 표현
              dataLine.material.opacity = lineDecrypting ? 
                Math.min(1, (decryptProgress - lineDecryptThreshold) * 10) : 0;
              
              // 복호화된 데이터 라인의 색상도 변화 (흰색 -> 밝은 청록색)
              if(lineDecrypting) {
                const lineProgress = Math.min(1, (decryptProgress - lineDecryptThreshold) * 3);
                const lineStartColor = new THREE.Color(0xFFFFFF);
                const lineEndColor = new THREE.Color(0x7EDCE2);
                dataLine.material.color.copy(lineStartColor).lerp(lineEndColor, lineProgress);
                dataLine.material.emissive.copy(lineStartColor).lerp(lineEndColor, lineProgress);
                
                // 복호화 중인 데이터 라인에 물결 효과 - 데이터 처리 시각화
                // 더 역동적인 데이터 흐름 효과
                const waveSpeed = 3 + i * 0.2; // 각 라인마다 다른 속도
                const waveAmplitude = 0.15 + (lineProgress * 0.1); // 진행에 따라 진폭 증가
                dataLine.position.x = 3 + Math.sin(time * waveSpeed + i * 0.5) * waveAmplitude;
                // 데이터 라인 길이 변화 - 복호화 진행에 따라 길이 변화
                dataLine.scale.x = 3 + Math.sin(time * (2 + i * 0.15) + i) * 0.3 + lineProgress * 0.2;
              }
            }
          }
        }
        
        // 복호화된 파일 아이콘 - 최종 복호화 표시
        if(fileModelRef.current.children[9]) {
          const fileIcon = fileModelRef.current.children[9] as THREE.Mesh;
          
          if(fileIcon.material instanceof THREE.MeshStandardMaterial) {
            // 아이콘은 85% 복호화 진행 후 나타남 - 파일이 사용 가능함을 의미
            const iconRevealProgress = decryptProgress > 0.85 ? 
              Math.min(1, (decryptProgress - 0.85) * 10) : 0;
            
            // 복호화 완료 시 아이콘이 나타나는 효과
            fileIcon.material.opacity = iconRevealProgress;
            
            // 아이콘 색상도 청록색으로 변경
            if(iconRevealProgress > 0) {
              fileIcon.material.color.set(0x0EA5E9);
              fileIcon.material.emissive.set(0x0EA5E9);
            }
            
            // 더 세련된 스케일 효과 (약간의 오버슈트로 튀어오르는 효과)
            const bounceEffect = iconRevealProgress < 0.5 ? 
              iconRevealProgress * 2 : 
              1 + Math.sin((iconRevealProgress - 0.5) * Math.PI) * 0.2;
            
            fileIcon.scale.set(
              bounceEffect * 1.2, 
              bounceEffect * 1.2, 
              bounceEffect * 1.2
            );
            
            // 복호화 완료 아이콘 맥동 효과
            if(iconRevealProgress > 0.5) {
              const pulse = 1 + Math.sin(time * 4) * 0.12;
              fileIcon.material.emissiveIntensity = 0.9 + Math.sin(time * 5) * 0.2;
              fileIcon.scale.multiplyScalar(pulse);
            }
          }
        }
        
        // 내부 발광 효과 - 복호화 에너지
        if(fileModelRef.current.children[10]) {
          const innerLight = fileModelRef.current.children[10] as THREE.PointLight;
          // 복호화 진행에 따라 파일 내부에서 빛이 점점 강해짐
          innerLight.intensity = 0.2 + decryptProgress * 1.8;
          innerLight.distance = 2 + decryptProgress * 5;
          
          // 복호화 진행에 따라 빛의 색상도 변화 (보라색 -> 청록색)
          const lightColorProgress = Math.min(1, decryptProgress * 1.5);
          const lightStartColor = new THREE.Color(0xA855F7);
          const lightEndColor = new THREE.Color(0x0EA5E9);
          innerLight.color.copy(lightStartColor).lerp(lightEndColor, lightColorProgress);
        }
      }
      
      // 파티클 애니메이션 - 차량 위 대칭키에서 파일로 흐르는 데이터
      if (particlesRef.current) {
        // 대칭키가 작동하기 시작할 때 파티클 표시 (즉시 표시)
        particlesRef.current.visible = true;
        
        if(particlesRef.current.visible) {
          // 데이터 복호화 과정을 표현하는 파티클 움직임
          // 더 정교한 회전 패턴
          particlesRef.current.rotation.y = time * 0.25;
          particlesRef.current.rotation.z = time * 0.12;
          
          // 파티클 위치 업데이트
          const positions = particlesRef.current.geometry.attributes.position.array;
          const colors = particlesRef.current.geometry.attributes.color.array;
          
          for (let i = 0; i < positions.length; i += 3) {
            // 데이터 흐름을 표현하는 파티클 움직임 패턴
            // 차량 위 대칭키에서 파일로 데이터 흐름
            if (decryptProgress < 0.3) {
              const keyPhase = decryptProgress / 0.3; // 0~1
              
              // 키에서 파일로 이동하는 파티클 패턴
              const particleProgress = (i / positions.length) + keyPhase * 0.8; // 각 파티클의 진행 상태
              const normalizedProgress = particleProgress - Math.floor(particleProgress); // 0~1 사이 값
              
              // 경로 생성 - 키에서 파일로 곡선 패턴
              const pathX = -6 + normalizedProgress * 9; // -6(키 위치)에서 3(파일 위치)로
              const pathY = 2.5 + Math.sin(normalizedProgress * Math.PI) * 1.5; // 호 형태 경로
              const pathZ = Math.sin(normalizedProgress * Math.PI * 2) * (1 - normalizedProgress) * 1.5;
              
              // 경로 주변에 약간의 변동성 추가
              const jitterAmount = (1 - normalizedProgress) * 0.8; // 진행에 따라 변동성 감소
              positions[i] = pathX + (Math.random() - 0.5) * jitterAmount;
              positions[i + 1] = pathY + (Math.random() - 0.5) * jitterAmount;
              positions[i + 2] = pathZ + (Math.random() - 0.5) * jitterAmount;
            } 
            // 중간 단계: 파일 외부에서 복호화 진행 (대칭키 적용)
            else if (decryptProgress < 0.7) {
              const keyPhase = (decryptProgress - 0.3) / 0.4; // 0~1
              
              // 파일 표면에서 언락 패턴을 형성하는 궤도
              const fileAngle = (i / positions.length) * Math.PI * 10 + time * (1 + keyPhase);
              const fileHeight = ((i % 12) / 6 - 1) * 2.5; // 파일 높이를 따라 분포
              
              // 파일 주변에서 잠금 해제 패턴 형성 (패턴이 점차 안정화)
              const orbitSize = 2.5 * (1 - keyPhase * 0.8); // 궤도 반경이 점차 감소
              const stabilityFactor = Math.pow(keyPhase, 1.5); // 안정화 계수 (비선형)
              
              // 처음에는 불규칙하다가 점차 패턴화되는 움직임
              positions[i] = 3 + Math.cos(fileAngle) * orbitSize * (1 - stabilityFactor * 0.5) + 
                            (Math.random() - 0.5) * (1 - keyPhase) * 0.8;
              positions[i + 1] = fileHeight * (1 - stabilityFactor * 0.3) + 
                                Math.sin(time + i * 0.05) * (1 - keyPhase) * 0.8;
              positions[i + 2] = Math.sin(fileAngle) * orbitSize * (1 - stabilityFactor * 0.5) +
                                (Math.random() - 0.5) * (1 - keyPhase) * 0.8;
            } 
            // 후기 단계: 파일 내부로 침투하여 데이터 복호화 (완료 단계)
            else {
              const decryptPhase = (decryptProgress - 0.7) / 0.3; // 0~1
              
              // 데이터 라인을 따라 흐르는 효과 - 규칙적인 패턴
              const dataLineIndex = i % 8; // 8개의 데이터 라인
              const linePosition = -2 + dataLineIndex * 0.5; // 데이터 라인 위치
              
              // 데이터 라인을 따라 흐르는 파티클
              const flowProgress = ((i / 24) % 1.0 + time * 0.5) % 1.0; // 흐름 진행도
              const xOffset = (flowProgress - 0.5) * 3; // x축 이동 (-1.5 ~ 1.5)
              
              // 최종 단계에서는 더 안정적인 데이터 흐름 패턴
              const finalStability = Math.pow(decryptPhase, 2); // 비선형 안정화
              
              positions[i] = 3 + xOffset * (1 - finalStability * 0.6);
              positions[i + 1] = linePosition + Math.sin(time * 2 + i * 0.02) * 0.15 * (1 - finalStability * 0.8);
              positions[i + 2] = Math.sin(flowProgress * Math.PI * 2) * 0.25 * (1 - finalStability * 0.7);
            }
            
            // 파티클 색상 변화 - 대칭키 색상(노란색)에서 복호화된 파일 색상(청록색)으로 점진적 변화
            if (colors && i < colors.length) {
              // 복호화 단계별 색상 변화
              if (decryptProgress < 0.3) {
                // 초기: 밝은 금색 (대칭키 색상)
                colors[i] = 0.98 + Math.sin(time + i * 0.01) * 0.02; // R (금색)
                colors[i + 1] = 0.90 + Math.cos(time * 0.5 + i * 0.01) * 0.1; // G (금색)
                colors[i + 2] = 0.3 + Math.sin(time * 0.2 + i * 0.01) * 0.1; // B (금색)
              } else if (decryptProgress < 0.7) {
                // 중간: 금색에서 보라색으로 변화 (대칭키와 암호화 파일 상호작용)
                const mixPhase = (decryptProgress - 0.3) / 0.4;
                
                // 더 부드러운 색상 전환
                const goldColor = new THREE.Color(0xFCD34D); // 금색
                const purpleColor = new THREE.Color(0xA855F7); // 보라색
                const mixColor = goldColor.clone().lerp(purpleColor, mixPhase);
                
                // 약간의 변동성 추가
                const variation = Math.sin(time * 2 + i * 0.01) * 0.1;
                
                colors[i] = mixColor.r + variation * 0.05; // R
                colors[i + 1] = mixColor.g + variation * 0.05; // G
                colors[i + 2] = mixColor.b + variation * 0.05; // B
              } else {
                // 후기: 보라색에서 청록색으로 변화 (복호화 완료)
                const finalPhase = (decryptProgress - 0.7) / 0.3;
                
                // 더 밝고 선명한 최종 색상
                const purpleColor = new THREE.Color(0xA855F7); // 보라색
                const cyanColor = new THREE.Color(0x0EA5E9); // 청록색
                const finalColor = purpleColor.clone().lerp(cyanColor, finalPhase);
                
                // 완료에 가까워질수록 더 안정적인 색상
                const finalVariation = Math.sin(time * 1.5 + i * 0.01) * 0.1 * (1 - finalPhase);
                
                colors[i] = finalColor.r + finalVariation * 0.05; // R
                colors[i + 1] = finalColor.g + finalVariation * 0.05; // G
                colors[i + 2] = finalColor.b + finalVariation * 0.05; // B
              }
            }
          }
          
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
          if(particlesRef.current.geometry.attributes.color) {
            particlesRef.current.geometry.attributes.color.needsUpdate = true;
          }
        }
      }
      
      // 주변 발광 링들 애니메이션 - 복호화 과정의 진행 상태를 시각화
      // 파일 주변의 발광 링들이 CP-ABE 키 색상(금색)에서 복호화된 파일 색상(청록색)으로 변화
      const sphereRings = document.querySelectorAll('sphere');
      sphereRings.forEach((sphereRing, index) => {
        const meshRing = sphereRing as unknown as THREE.Mesh;
        if(meshRing && meshRing.material) {
          if(meshRing.material instanceof THREE.MeshBasicMaterial) {
            // 복호화 단계에 따른 링 색상 변화
            if (decryptProgress < 0.4) {
              // 초기: 금색 발광 (대칭키 에너지)
              meshRing.material.color.set(0xFCD34D);
              meshRing.material.opacity = 0.1 + decryptProgress * 0.4;
            } else if (decryptProgress < 0.7) {
              // 중간: 금색 -> 보라색 (대칭키와 암호화된 파일 상호작용)
              const mixPhase = (decryptProgress - 0.4) / 0.3;
              const ringMixColor = new THREE.Color(0xFCD34D).lerp(new THREE.Color(0xA855F7), mixPhase);
              meshRing.material.color.set(ringMixColor);
              meshRing.material.opacity = 0.2 + decryptProgress * 0.3;
            } else {
              // 후기: 보라색 -> 청록색 (복호화 완료)
              const finalPhase = (decryptProgress - 0.7) / 0.3;
              const ringFinalColor = new THREE.Color(0xA855F7).lerp(new THREE.Color(0x0EA5E9), finalPhase);
              meshRing.material.color.set(ringFinalColor);
              meshRing.material.opacity = 0.3 + finalPhase * 0.4;
            }
          }
          
          // 링의 맥동 및 회전 애니메이션
          // 더 우아한 맥동 패턴
          const pulseFrequency = index ? 1.2 : 0.8;
          const pulsePhase = index ? 0 : Math.PI / 2; // 위상차
          const pulseFactor = 1 + Math.sin(time * pulseFrequency + pulsePhase) * 0.12;
          meshRing.scale.set(pulseFactor, pulseFactor, pulseFactor);
          
          // 더 복잡한 회전 패턴
          meshRing.rotation.z = time * (index ? 0.08 : -0.06);
          meshRing.rotation.x = time * (index ? -0.04 : 0.03);
          meshRing.rotation.y = time * (index ? -0.02 : 0.02);
        }
      });
    }
  });

  // Reset state on stage change
  useEffect(() => {
    if (stage !== 'hash-verification') {
      setIsMerging(false);
      setMerged(false);
      setCube1Pos([-7, 1.5, 0]);
      setCube2Pos([7, 1.5, 0]);
      setCubeColor('#60A5FA');
      setShowLabels(true);
    }
  }, [stage]);

  // Call onCpabeDecryptionComplete when cpabe-decryption animation is done
  const calledCpabeComplete = useRef(false);
  useEffect(() => {
  if (stage === 'cpabe-decryption' && keyPhase === 'symmetric' && !calledCpabeComplete.current) {
    calledCpabeComplete.current = true;
    if (typeof onCpabeDecryptionComplete === 'function') {
      onCpabeDecryptionComplete();
    }
  }
  if (stage !== 'cpabe-decryption') {
    calledCpabeComplete.current = false;
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, keyPhase]);

  // --- 최종 복호화 애니메이션 상태 ---
  const [finalAnim, setFinalAnim] = useState({ progress: 0, merged: false, exploded: false, particles: [] as {x:number,y:number,z:number,vx:number,vy:number,vz:number}[] });
  const keyCardRef = useRef<THREE.Group>(null);
  const symKeyRef = useRef<THREE.Group>(null);
  const yellowSphereRef = useRef<THREE.Mesh>(null);
  const carParticlesRef = useRef<THREE.Points>(null);
  // 파티클 초기화
  const PARTICLE_COUNT = 120;
  const [particleGeo] = useState(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(PARTICLE_COUNT*3).fill(0), 3));
    return geo;
  });

  // 애니메이션 진행
  useEffect(() => {
    if (stage === 'final-decryption') {
      setFinalAnim({ progress: 0, merged: false, exploded: false, particles: [] });
      let raf: number;
      const start = performance.now();
      function animate() {
        const now = performance.now();
        // 지속시간을 2.8초 → 3.3초로 증가
        let t = Math.min(1, (now - start) / 3000);
        setFinalAnim(fa => ({ ...fa, progress: t }));
        if (t < 1) raf = requestAnimationFrame(animate);
        else setTimeout(() => setFinalAnim(fa => ({ ...fa, merged: true })), 200); // 합쳐짐
      }
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    }
  }, [stage]);

  useEffect(() => {
    // 합쳐진 후 노란 구 커짐 -> 팡 터짐 -> 파티클 애니메이션
    if (finalAnim.merged && !finalAnim.exploded) {
      let grow = 0;
      let raf: number;
      // 카메라 시점 초기화
      if (typeof window !== 'undefined') {
        const evt = new CustomEvent('resetCamera');
        window.dispatchEvent(evt);
      }
      function growAndExplode() {
        grow += 0.025; // 더 느리게 커짐 (1.6초)
        if (yellowSphereRef.current) {
          yellowSphereRef.current.scale.set(1+grow*6,1+grow*6,1+grow*6);
        }
        if (grow < 1.1) {
          raf = requestAnimationFrame(growAndExplode);
        } else {
          // 파티클 생성
          const particles = Array.from({length:PARTICLE_COUNT}).map(() => {
            const theta = Math.random()*2*Math.PI;
            const phi = Math.random()*Math.PI;
            return {
              x:0, y:2.5, z:0,
              vx: Math.sin(phi)*Math.cos(theta)*2 + (Math.random()-0.5)*0.5,
              vy: Math.abs(Math.cos(phi))*2 + 2 + Math.random()*1.5,
              vz: Math.sin(phi)*Math.sin(theta)*2 + (Math.random()-0.5)*0.5
            };
          });
          setFinalAnim(fa => ({ ...fa, exploded: true, particles }));
        }
      }
      growAndExplode();
      return () => cancelAnimationFrame(raf);
    }
  }, [finalAnim.merged]);

  // 파티클 낙하 애니메이션
  useFrame(() => {
    if (stage === 'final-decryption') {
      // 1. 키카드/대칭키 이동 및 회전
      if (!finalAnim.merged && keyCardRef.current && symKeyRef.current) {
        const t = finalAnim.progress;
        // 더 오래 돌다가 들어가도록: t가 0~0.7까지는 궤도, 0.7~1에서만 직선 접근
        let orbitT = Math.min(1, t / 0.7);
        let approachT = t > 0.7 ? (t - 0.7) / 0.3 : 0;
        // 궤도 반경
        const orbitRadius = 1.35 - 0.95 * orbitT; // 기존보다 0.15씩만 증가
        const orbitAngle = Math.PI/2 + Math.PI * 3 * orbitT; // 1.5바퀴 이상
        // 궤도 위치
        let keyCardX = -6 + Math.cos(orbitAngle) * orbitRadius;
        let keyCardZ = Math.sin(orbitAngle) * orbitRadius;
        let symKeyX = 3 - Math.cos(orbitAngle) * orbitRadius;
        let symKeyZ = -Math.sin(orbitAngle) * orbitRadius;
        // 마지막 30% 구간에서만 직선으로 접근
        if (t > 0.7) {
          keyCardX = keyCardX + (0 - keyCardX) * approachT;
          keyCardZ = keyCardZ + (0 - keyCardZ) * approachT;
          symKeyX = symKeyX + (0 - symKeyX) * approachT;
          symKeyZ = symKeyZ + (0 - symKeyZ) * approachT;
        }
        keyCardRef.current.position.x = keyCardX;
        keyCardRef.current.position.z = keyCardZ;
        symKeyRef.current.position.x = symKeyX;
        symKeyRef.current.position.z = symKeyZ;
        keyCardRef.current.rotation.y = Math.PI/4 + t * Math.PI * 1.1;
        // (대칭키 자회전도 아주 약간만 더 동적이게)
        symKeyRef.current.rotation.y = t * Math.PI * 1.1; // 1.1바퀴, 여전히 느리게
        symKeyRef.current.rotation.x = Math.sin(t * Math.PI) * 0.1;
      }
      // 2. 파티클 낙하(더 빠르게, 더 아래까지)
      if (finalAnim.exploded && carParticlesRef.current) {
        const dt = 1/60;
        const gravity = 9.8 * 0.45; // 기존보다 더 빠르게(0.2→0.38)
        const newParticles = finalAnim.particles.map(p => {
          let vy = p.vy - gravity*dt;
          let y = p.y + vy*dt;
          // 더 아래(-2.5→-6.5)까지 떨어지도록
          if (y < -6.5) {
            y = -6.5;
            vy = 0;
          }
          return { ...p, x: p.x + p.vx*dt, y, z: p.z + p.vz*dt, vy };
        });
        const posArr = carParticlesRef.current.geometry.attributes.position.array;
        newParticles.forEach((p,i) => {
          posArr[i*3]=p.x; posArr[i*3+1]=p.y; posArr[i*3+2]=p.z;
        });
        carParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        setFinalAnim(fa => ({ ...fa, particles: newParticles }));
      }
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* 해시 검증 단계 */}
      {stage === 'hash-verification' && (
        <>
          {/* Show two cubes until merged, then show one merged cube */}
          {!merged && (
            <>
              <Box
                ref={hashCube1Ref}
                position={[cube1Pos[0], 1.5, 0]}
                scale={[2, 2, 2]}
                material={new THREE.MeshStandardMaterial({ 
                  color: cubeColor,
                  metalness: 0.7,
                  roughness: 0.2,
                  emissive: cubeColor,
                  emissiveIntensity: 0.5
                })}
              />
              {showLabels && (
                <Html position={[cube1Pos[0] - 3.5, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
                  <div style={{
                    background: 'rgba(30,41,59,0.92)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.95em',
                    fontWeight: 500,
                    border: '1.5px solid #60A5FA',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    letterSpacing: '0.01em'
                  }}>블록체인 해시</div>
                </Html>
              )}
              <Box
                ref={hashCube2Ref}
                position={[cube2Pos[0], 1.5, 0]}
                scale={[2, 2, 2]}
                material={new THREE.MeshStandardMaterial({ 
                  color: cubeColor,
                  metalness: 0.7,
                  roughness: 0.2,
                  emissive: cubeColor,
                  emissiveIntensity: 0.5
                })}
              />
              {showLabels && (
                <Html position={[cube2Pos[0] + 3.5, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
                  <div style={{
                    background: 'rgba(30,41,59,0.92)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.95em',
                    fontWeight: 500,
                    border: '1.5px solid #60A5FA',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    letterSpacing: '0.01em'
                  }}>IPFS 파일 해시</div>
                </Html>
              )}
            </>
          )}
          {/* Show merged cube and label */}
          {merged && (
            <>
              <Box
                position={[0, 1.5, 0]}
                scale={[2.5, 2.5, 2.5]}
                material={new THREE.MeshStandardMaterial({ 
                  color: cubeColor,
                  metalness: 0.8,
                  roughness: 0.15,
                  emissive: cubeColor,
                  emissiveIntensity: 0.7
                })}
              />
              <Html position={[0, 4.5, 0]} center style={{ pointerEvents: 'none', opacity: 1, transition: 'opacity 0.3s' }}>
                <div style={{
                  background: 'rgba(34,197,94,0.92)',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  fontSize: '0.95em',
                  fontWeight: 500,
                  border: '1.5px solid #22C55E',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  letterSpacing: '0.01em'
                }}>해시 일치: 검증 완료</div>
              </Html>
            </>
          )}
        </>
      )}

      {/* CP-ABE 복호화 단계 */}
      {stage === 'cpabe-decryption' && (
        <group ref={lockRef}>
          {/* --- Device Private Key Animation --- */}
          {/* 개인키(골드키) 애니메이션: 1초 대기 → 제자리 점프 2회 → 포물선 이동 → 암호문 안으로 포물선 이동 → 진입 */}
          {(() => {
            // 위치 계산
            const start: [number, number, number] = [-6, 0.2, 0];
            const mid: [number, number, number] = [2.2, 1.5, 0]; // 차량 위
            const inside: [number, number, number] = [3, 1.5, 0]; // 암호문 내부(진입)
            let keyPos: [number, number, number] = start;
            let keyScale = 0.2;
            let keyVisible = false;
            let showKeyCard = false;
            let cipherScale = 1.0;
            let cipherVisible = true;
            let showExploding = false;
            let keyCardSpin = 0;

            // 암호문 커짐/터짐/키카드 생성 타이밍 계산
            if (keyPhase === 'wait') {
              // 1초 대기: 차량 옆에 정지
              keyPos = start;
              keyScale = 0.2;
              keyVisible = true;
              cipherScale = 1.0;
              cipherVisible = true;
            } else if (keyPhase === 'jump1') {
              // 제자리 점프1
              const t = Math.min(keyAnimTime / keyPhaseDurations.jump1, 1);
              keyPos = [start[0], start[1] + Math.sin(Math.PI * t) * 0.7, start[2]];
              keyScale = 0.22;
              keyVisible = true;
              cipherScale = 1.0;
              cipherVisible = true;
            } else if (keyPhase === 'jump2') {
              // 제자리 점프2
              const t = Math.min(keyAnimTime / keyPhaseDurations.jump2, 1);
              keyPos = [start[0], start[1] + Math.sin(Math.PI * t) * 0.5, start[2]];
              keyScale = 0.21;
              keyVisible = true;
              cipherScale = 1.0;
              cipherVisible = true;
            } else if (keyPhase === 'appear') {
              // 포물선 이동(차량→암호문 앞)
              const t = Math.min(keyAnimTime / keyPhaseDurations.appear, 1);
              // 포물선: start→mid
              const control: [number, number, number] = [ (start[0]+mid[0])/2, Math.max(start[1], mid[1])+2.0, (start[2]+mid[2])/2 ];
              keyPos = [
                (1-t)*(1-t)*start[0] + 2*(1-t)*t*control[0] + t*t*mid[0],
                (1-t)*(1-t)*start[1] + 2*(1-t)*t*control[1] + t*t*mid[1],
                (1-t)*(1-t)*start[2] + 2*(1-t)*t*control[2] + t*t*mid[2],
              ];
              keyScale = 0.23 + t*0.05;
              keyVisible = true;
              cipherScale = 1.0;
              cipherVisible = true;
            } else if (keyPhase === 'move') {
              // 포물선 이동(암호문 앞→암호문 내부)
              const t = Math.min(keyAnimTime / keyPhaseDurations.move, 1);
              // 포물선: mid→inside
              const control: [number, number, number] = [ (mid[0]+inside[0])/2+0.5, Math.max(mid[1], inside[1])+1.0, (mid[2]+inside[2])/2 ];
              keyPos = [
                (1-t)*(1-t)*mid[0] + 2*(1-t)*t*control[0] + t*t*inside[0],
                (1-t)*(1-t)*mid[1] + 2*(1-t)*t*control[1] + t*t*inside[1],
                (1-t)*(1-t)*mid[2] + 2*(1-t)*t*control[2] + t*t*inside[2],
              ];
              keyScale = 0.28 - t*0.18;
              keyVisible = true;
              // 암호문이 점점 커짐 (0.3~1.0 구간에서 1.0→1.7까지 커짐)
              cipherScale = 1.0 + t * 0.7;
              cipherVisible = true;
            } else if (keyPhase === 'enter') {
              // 암호문 내부로 진입하며 사라짐, 암호문은 커지다가 터짐, 키카드 생성
              const t = Math.min(keyAnimTime / keyPhaseDurations.enter, 1);
              keyPos = inside;
              keyScale = 0.1 - t*0.1;
              keyVisible = t < 1;
              // 암호문이 더 커지다가 터짐 (1.7→2.2)
              cipherScale = 1.7 + t * 0.5;
              cipherVisible = t < 0.8; // 80%에서 터짐(사라짐)
              showExploding = t >= 0.8;
              showKeyCard = t >= 0.7; // 70%부터 키카드 생성
              keyCardSpin = t; // 0~1까지 증가
            } else if (keyPhase === 'light' || keyPhase === 'symmetric') {
              keyVisible = false;
              showKeyCard = true;
              showExploding = false;
              cipherVisible = false;
              cipherScale = 1.0;
              keyCardSpin = 1;
            }
            // 시간 기반 회전값
            const spin = (typeof window !== 'undefined' ? performance.now() : 0) * 0.002 + keyCardSpin * Math.PI * 1;
            return (
              <>
                {/* GoldKey(개인키) */}
                {keyVisible && (
                  <group position={keyPos} scale={[keyScale, keyScale, keyScale]}>
                    <GoldKey scale={0.3} />
                    <pointLight
                      position={[0, 0, 0]}
                      intensity={1.5}
                      distance={4}
                      color={0xFCD34D}
                    />
                    {/* 디바이스 속성키 라벨 - 더 위로 이동 */}
                    <Html position={[0, 4.5, 0]} center style={{ pointerEvents: 'none' }}>
                      <div style={{
                        background: 'rgba(30,41,59,0.92)',
                        color: '#fff',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        fontSize: '0.95em',
                        fontWeight: 500,
                        border: '1.5px solid #FCD34D',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        letterSpacing: '0.01em'
                      }}>디바이스 속성키</div>
                    </Html>
                  </group>
                )}
                {/* 암호문 구체 (커지다가 터짐) */}
                {cipherVisible && (
                  <group position={[3, 1.5, 0]} scale={[cipherScale, cipherScale, cipherScale]}>
                    <Sphere
                      args={[2, 32, 32]}
                      material={new THREE.MeshStandardMaterial({ 
                        color: 0xEC4899,
                        metalness: 0.9,
                        roughness: 0.1,
                        emissive: 0xEC4899,
                        emissiveIntensity: 0.4,
                        wireframe: false,
                        transparent: true,
                        opacity: 0.9
                      })}
                    />
                    <Sphere
                      args={[2.3, 16, 16]}
                      material={new THREE.MeshBasicMaterial({
                        color: 0xFEF3C7,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                      })}
                    />
                    {/* 속성 기반 암호문 라벨 - 더 위로 이동 */}
                    <Html position={[0, 2.7, 0]} center style={{ pointerEvents: 'none' }}>
                      <div style={{
                        background: 'rgba(30,41,59,0.92)',
                        color: '#fff',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        fontSize: '0.95em',
                        fontWeight: 500,
                        border: '1.5px solid #EC4899',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        letterSpacing: '0.01em'
                      }}>속성 기반 암호문</div>
                    </Html>
                  </group>
                )}
                {/* 암호문 터지는 효과 (간단한 파티클 등) */}
                {showExploding && (
                  <group position={[3, 1.5, 0]}>
                    {/* 간단한 파티클 효과 등 추가 가능 */}
                  </group>
                )}
                {/* 키카드 생성 및 회전 */}
                {showKeyCard && (
                  <group position={[1, 3, 0]} rotation={[0, spin, Math.sin(spin)*0.15]}>
                    <group rotation={[0, Math.PI/4, -Math.PI/2]}> 
                      <KeyCard />
                    </group>
                    <pointLight position={[0, 0, 0]} intensity={1.2} distance={6} color={0xFCD34D} />
                    {/* 대칭키 라벨 - cp-abe 복호화에서만, 테두리 하늘색 */}
                    <Html position={[0, 4.1, 0]} center style={{ pointerEvents: 'none' }}>
                      <div style={{
                        background: 'rgba(30,41,59,0.92)',
                        color: '#fff',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        fontSize: '0.95em',
                        fontWeight: 500,
                        border: '1.5px solid #38BDF8', // sky blue
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        letterSpacing: '0.01em'
                      }}>대칭키</div>
                    </Html>
                  </group>
                )}
              </>
            );
          })()}
          {/* --- 기존 CP-ABE 구체 및 라벨 --- */}
          {/* 암호화된 데이터 구체 (CP-ABE 구체) */}
          {(stage === 'cpabe-decryption' && keyPhase !== 'light' && keyPhase !== 'symmetric') && (
            <group>
              <Sphere
                position={[3, 1.5, 0]}
                args={[2, 32, 32]}
                material={new THREE.MeshStandardMaterial({ 
                  color: 0xEC4899,
                  metalness: 0.9,
                  roughness: 0.1,
                  emissive: 0xEC4899,
                  emissiveIntensity: 0.4,
                  wireframe: false,
                  transparent: true,
                  opacity: 0.9
                })}
              />
              {/* 하얀 격자무늬 wireframe */}
              <Sphere
                position={[3, 1.5, 0]}
                args={[2.3, 16, 16]}
                material={new THREE.MeshBasicMaterial({
                  color: 0xFEF3C7,
                  wireframe: true,
                  transparent: true,
                  opacity: 0.5
                })}
              />
            </group>
          )}
        </group>
      )}

      {/* 최종 파일 복호화 단계 */}
      {stage === 'final-decryption' && (
        <group>
          {/* 1. 키카드와 대칭키가 서로 회전하며 가까워짐 */}
          {!finalAnim.merged && (
            <>
              <group ref={keyCardRef} position={[-6, 2.5, 0]}>
                <group scale={[0.3, 0.3, 0.3]} rotation={[0, Math.PI/4, -Math.PI/2]}>
                  {/* 키카드 크기 확 줄임 */}
                  <KeyCard />
                  <pointLight position={[0, 0, 0]} intensity={1.2} distance={6} color={0xFCD34D} />
                </group>
                {/* <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
                  <div className="key-label" style={{
                    background: 'rgba(30,41,59,0.92)',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: '6px',
                    fontSize: '0.95em',
                    fontWeight: 500,
                    border: '1.5px solid #FCD34D',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    letterSpacing: '0.01em'
                  }}>대칭키</div>
                </Html> */}
              </group>
              <group ref={symKeyRef} position={[3, 1.5, 0]}>
                <Sphere
                  args={[2.2, 32, 32]} // 대칭키 구 확 키움
                  material={new THREE.MeshStandardMaterial({
                    color: 0xFCD34D,
                    metalness: 0.9,
                    roughness: 0.1,
                    emissive: 0xFCD34D,
                    emissiveIntensity: 0.7,
                    transparent: true,
                    opacity: 0.9
                  })}
                />
                <Sphere
                  args={[2.7, 24, 24]} // 대칭키 그리드도 확 키움
                  material={new THREE.MeshBasicMaterial({
                    color: 0xFEF3C7,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5
                  })}
                />
                <pointLight position={[0, 0, 0]} intensity={1.5} distance={8} color={0xFCD34D} />
              </group>
            </>
          )}
          {/* 2. 합쳐진 후 노란 구가 커지다가 팡 터짐 */}
          {finalAnim.merged && !finalAnim.exploded && (
            <mesh ref={yellowSphereRef} position={[0, 2.0, 0]}>
              <sphereGeometry args={[1, 24, 24]} />
              <meshStandardMaterial color={0xFCD34D} metalness={0.9} roughness={0.1} emissive={0xFCD34D} emissiveIntensity={1.2} />
            </mesh>
          )}
          {/* 3. 파티클이 차 위로 내림 */}
          {finalAnim.exploded && (
            <points ref={carParticlesRef} geometry={particleGeo} position={[0,0,0]}>
              <pointsMaterial vertexColors={false} color={0xFCD34D} size={0.28} transparent opacity={0.88} blending={THREE.AdditiveBlending} sizeAttenuation depthWrite={false} />
            </points>
          )}
          {/* 복호화중 라벨: 노란 구가 터지기 전까지만 표시 */}
          {/* {finalAnim.merged && !finalAnim.exploded && (
            <Html position={[3, 6.5, 0]} center style={{ pointerEvents: 'none' }}>
              <div className="decrypt-label" style={{
                background: 'rgba(30,41,59,0.92)',
                color: '#fff',
                padding: '2px 10px',
                borderRadius: '6px',
                fontSize: '0.95em',
                fontWeight: 500,
                border: '1.5px solid #FCD34D',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                letterSpacing: '0.01em'
              }}>업데이트 파일 최종 복호화</div>
            </Html>
          )} */}
        </group>
      )}
    </group>
  );
}
