import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Wireframe, Environment, Float, MeshDistortMaterial } from '@react-three/drei';

function FuturisticHouse() {
  const geom = useMemo(() => new THREE.BoxGeometry(3, 2, 3).toNonIndexed(), []);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
      <group>
        {/* Core structure */}
        <mesh position={[0, 0, 0]} geometry={geom}>
          <meshPhysicalMaterial 
            color="#0a0a0a" 
            metalness={0.9} 
            roughness={0.1}
            envMapIntensity={2}
            clearcoat={1}
          />
          <Wireframe thickness={0.03} stroke="#00f0ff" />
        </mesh>
        
        {/* Floating roof element */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[3.5, 0.2, 3.5]} />
          <meshPhysicalMaterial 
            color="#00f0ff" 
            emissive="#00f0ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Internal AI core */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <MeshDistortMaterial 
            color="#9d4edd"
            emissive="#9d4edd"
            distort={0.4}
            speed={4}
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#00f0ff" />
      <directionalLight position={[-10, 10, -5]} intensity={1} color="#9d4edd" />
      
      <FuturisticHouse />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate 
        autoRotateSpeed={1}
      />
      <Environment preset="city" />
    </Canvas>
  );
}
