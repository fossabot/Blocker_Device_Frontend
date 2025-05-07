import * as THREE from 'three';
import { gsap } from 'gsap';
import type { ParticleSystemProps } from '../../types/three';

export function createParticleSystem({ startPos, endPos, color, count = 100 }: ParticleSystemProps) {
  const particleGeometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];
  
  for(let i = 0; i < count; i++) {
    positions.push(
      startPos.x + (Math.random() - 0.5),
      startPos.y + (Math.random() - 0.5),
      startPos.z + (Math.random() - 0.5)
    );
    
    velocities.push({
      x: (endPos.x - startPos.x) * 0.01 + (Math.random() - 0.5) * 0.02,
      y: (endPos.y - startPos.y) * 0.01 + (Math.random() - 0.5) * 0.02,
      z: (endPos.z - startPos.z) * 0.01 + (Math.random() - 0.5) * 0.02
    });
  }
  
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.userData = {
    velocities,
    endPos
  };
  
  return particles;
}

export function updateParticles(particles: THREE.Points): boolean {
  const positions = particles.geometry.attributes.position.array as Float32Array;
  let complete = true;

  for(let i = 0; i < positions.length; i += 3) {
    const targetX = particles.userData.endPos.x;
    const targetY = particles.userData.endPos.y;
    const targetZ = particles.userData.endPos.z;

    positions[i] += particles.userData.velocities[i/3].x;
    positions[i + 1] += particles.userData.velocities[i/3].y;
    positions[i + 2] += particles.userData.velocities[i/3].z;

    if (Math.abs(positions[i] - targetX) > 0.1 ||
        Math.abs(positions[i + 1] - targetY) > 0.1 ||
        Math.abs(positions[i + 2] - targetZ) > 0.1) {
      complete = false;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
  return complete;
}

export function animateCameraToTarget(
  camera: THREE.Camera,
  controls: any,
  target: THREE.Vector3,
  position: THREE.Vector3,
  duration: number = 2
) {
  const tl = gsap.timeline();

  tl.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration,
    ease: "power2.inOut"
  });

  tl.to(controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: duration * 0.5,
    ease: "power2.inOut",
    onUpdate: () => controls.update()
  }, `-=${duration * 0.5}`);

  return tl;
}