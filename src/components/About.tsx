import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Company info display component
function CompanyInfo() {
  const textRef = useRef<THREE.Mesh>(null);
  const [currentInfo, setCurrentInfo] = useState(0);

  const companyData = [
    {
      title: "Kasm XR Experience",
      subtitle: "Advanced WebXR Platform",
      description: "Control virtual musical instruments that aren't quite all there"
    },
    {
      title: "Rust WebAssembly Core",
      subtitle: "High-Performance Computing",
      description: "Shared WASM foundation across all modules"
    },
    {
      title: "WebXR Innovation",
      subtitle: "Immersive Experiences",
      description: "AR/VR capabilities for modern web browsers"
    }
  ];

  useFrame(() => {
    // Cycle through company info every 3 seconds
    const now = Date.now();
    const cycleIndex = Math.floor((now / 3000) % companyData.length);
    if (cycleIndex !== currentInfo) {
      setCurrentInfo(cycleIndex);
    }
  });

  const current = companyData[currentInfo];

  return (
    <group position={[0, 0, -2]}>
      {/* Main title */}
      <Text
        ref={textRef}
        position={[0, 0.8, 0]}
        fontSize={0.25}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        {current.title}
      </Text>

      {/* Subtitle */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.15}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        {current.subtitle}
      </Text>

      {/* Description */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.12}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        {current.description}
      </Text>

      {/* Progress indicator */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.08}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        {currentInfo + 1} / {companyData.length}
      </Text>
    </group>
  );
}

// Technology showcase with rotating elements
function TechnologyShowcase() {
  const rustRef = useRef<THREE.Mesh>(null);
  const webxrRef = useRef<THREE.Mesh>(null);
  const webgpuRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const time = Date.now() * 0.001;

    if (rustRef.current) {
      rustRef.current.rotation.y = time * 0.5;
      rustRef.current.position.y = Math.sin(time) * 0.2;
    }
    if (webxrRef.current) {
      webxrRef.current.rotation.x = time * 0.3;
      webxrRef.current.position.y = Math.cos(time * 1.2) * 0.15;
    }
    if (webgpuRef.current) {
      webgpuRef.current.rotation.z = time * 0.7;
      webgpuRef.current.position.y = Math.sin(time * 0.8) * 0.25;
    }
  });

  return (
    <group position={[2, 0, -2]}>
      {/* Rust logo representation */}
      <Box
        ref={rustRef}
        args={[0.3, 0.3, 0.3]}
        position={[0, 0.5, 0]}
      >
        <meshBasicMaterial color="#ce422b" />
      </Box>

      {/* WebXR representation */}
      <Sphere
        ref={webxrRef}
        args={[0.15, 16, 16]}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial color="#00d4ff" />
      </Sphere>

      {/* WebGPU representation */}
      <Box
        ref={webgpuRef}
        args={[0.2, 0.2, 0.2]}
        position={[0, -0.5, 0]}
      >
        <meshBasicMaterial color="#ff6b35" />
      </Box>

      {/* Labels */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.08}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        Core Technologies
      </Text>

      <Text
        position={[0, -1.2, 0]}
        fontSize={0.06}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        🦀 Rust WebAssembly
      </Text>

      <Text
        position={[0, -1.35, 0]}
        fontSize={0.06}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        🥽 WebXR
      </Text>

      <Text
        position={[0, -1.5, 0]}
        fontSize={0.06}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        ⚡ WebGPU
      </Text>
    </group>
  );
}

// Features and capabilities display
function FeaturesDisplay() {
  const [features] = useState([
    "🎵 TechWebMIDI Audio Synthesis",
    "🥽 AR/VR MIDI Controllers"
  ]);

  return (
    <group position={[-2, 0, -2]}>
      <Text
        position={[0, 1, 0]}
        fontSize={0.12}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        Platform Features
      </Text>

      {features.map((feature, index) => (
        <Text
          key={index}
          position={[0, 0.6 - index * 0.2, 0]}
          fontSize={0.08}
          color="#fff600"
          outlineColor="#fff600"
          outlineWidth={0.01}
          anchorX="center"
          anchorY="middle"
        >
          {feature}
        </Text>
      ))}

      <Text
        position={[0, -0.8, 0]}
        fontSize={0.06}
        color="#fff600"
        outlineColor="#fff600"
        outlineWidth={0.01}
        anchorX="center"
        anchorY="middle"
      >
        Powered by Rust + WebAssembly
      </Text>
    </group>
  );
}

// Main About component
function AboutScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <CompanyInfo />
      <TechnologyShowcase />
      <FeaturesDisplay />
    </>
  );
}

export default function About() {
  return (
    <div className="about-container" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div className="about-header" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '1rem',
        borderRadius: '10px',
        color: 'white'
      }}>
        <h2>About</h2>
        <p>Kasm SDK Open Source Community</p>
        <p style={{ fontSize: '0.9em', marginTop: '10px', color: '#aaa' }}>
          Kasm SDK is an open source community project focused on building advanced web based musical instruments including AR and VR instruments and MIDI controllers
        </p>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}
      >
        <AboutScene />
      </Canvas>
    </div>
  );
}
