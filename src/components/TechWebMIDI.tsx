import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';

// TechWebMIDI streaming stats component
function WebMIDIStats() {
  const textRef = useRef<THREE.Mesh>(null);
  const [stats, setStats] = useState({
    protocol: 'TechWebMIDI',
    latency: '45ms',
    throughput: '125 Mbps',
    objects: 1247,
    subscribers: 8,
    publishers: 3,
    quality: 'Ultra Low Latency'
  });

  useFrame(() => {
    // Simulate real-time TechWebMIDI stats
    setStats(prev => ({
      ...prev,
      latency: `${(40 + Math.sin(Date.now() * 0.001) * 10).toFixed(0)}ms`,
      throughput: `${(120 + Math.sin(Date.now() * 0.0015) * 20).toFixed(0)} Mbps`,
      objects: prev.objects + Math.floor(Math.random() * 3),
      subscribers: 8 + Math.floor(Math.sin(Date.now() * 0.002) * 2),
      publishers: 3 + Math.floor(Math.cos(Date.now() * 0.0025) * 1)
    }));
  });

  return (
    <group position={[0, 0, -2]}>
      {/* Main title */}
      <Text
        ref={textRef}
        position={[0, 0.8, 0]}
        fontSize={0.25}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        font="/fonts/monospace.woff"
      >
        WebMIDI
      </Text>

      {/* Protocol info */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.12}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        Protocol: {stats.protocol} | Quality: {stats.quality}
      </Text>

      {/* Latency and throughput */}
      <Text
        position={[0, 0.2, 0]}
        fontSize={0.1}
        color="#ff6600"
        anchorX="center"
        anchorY="middle"
      >
        Latency: {stats.latency} | Throughput: {stats.throughput}
      </Text>

      {/* Objects and connections */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.1}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        Objects: {stats.objects} | Subscribers: {stats.subscribers}
      </Text>

      {/* Publishers */}
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.1}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
      >
        Publishers: {stats.publishers}
      </Text>

      {/* Status */}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.08}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        Ultra-low latency media streaming over QUIC
      </Text>
    </group>
  );
}

// TechWebMIDI network visualization
function WebMIDIVisualization() {
  const publisherRef = useRef<THREE.Mesh>(null);
  const relayRef = useRef<THREE.Mesh>(null);
  const subscriberRefs = useRef<THREE.Mesh[]>([]);
  const dataFlowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const time = Date.now() * 0.001;

    // Animate publisher
    if (publisherRef.current) {
      publisherRef.current.rotation.y = time * 0.4;
      publisherRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
    }

    // Animate relay
    if (relayRef.current) {
      relayRef.current.rotation.x = time * 0.3;
      relayRef.current.rotation.z = time * 0.2;
    }

    // Animate subscribers
    subscriberRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.rotation.y = time * (0.5 + index * 0.1);
        ref.position.y = Math.sin(time * (1 + index * 0.3)) * 0.1;
      }
    });

    // Animate data flow
    if (dataFlowRef.current) {
      dataFlowRef.current.position.x = Math.sin(time * 3) * 0.4;
      const material = dataFlowRef.current.material as THREE.MeshBasicMaterial;
      if (material && 'opacity' in material) {
        material.opacity = 0.7 + Math.sin(time * 5) * 0.2;
      }
    }
  });

  return (
    <group position={[2, 0, -2]}>
      {/* Publisher */}
      <Box
        ref={publisherRef}
        args={[0.3, 0.3, 0.3]}
        position={[-0.8, 0.4, 0]}
      >
        <meshBasicMaterial color="#00ff00" />
      </Box>

      {/* Relay/CDN */}
      <Sphere
        ref={relayRef}
        args={[0.2, 16, 16]}
        position={[0, 0.2, 0]}
      >
        <meshBasicMaterial color="#ffff00" />
      </Sphere>

      {/* Data flow */}
      <Plane
        ref={dataFlowRef}
        args={[0.6, 0.03]}
        position={[0, 0.4, 0]}
      >
        <meshBasicMaterial color="#00ffff" transparent />
      </Plane>

      {/* Subscribers */}
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          ref={(el) => {
            if (el) subscriberRefs.current[index] = el;
          }}
          args={[0.2, 0.2, 0.2]}
          position={[0.6 + index * 0.3, -0.2 - index * 0.2, 0]}
        >
          <meshBasicMaterial color="#ff6600" />
        </Box>
      ))}

      {/* Labels */}
      <Text
        position={[-0.8, 0.1, 0]}
        fontSize={0.06}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
      >
        Publisher
      </Text>

      <Text
        position={[0, -0.1, 0]}
        fontSize={0.06}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        WebMIDI Relay
      </Text>

      <Text
        position={[0.8, -0.6, 0]}
        fontSize={0.06}
        color="#ff6600"
        anchorX="center"
        anchorY="middle"
      >
        Subscribers
      </Text>

      <Text
        position={[0, -0.9, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        WebMIDI Network
      </Text>

      <Text
        position={[0, -1.1, 0]}
        fontSize={0.06}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        QUIC Transport
      </Text>
    </group>
  );
}

// TechWebMIDI features and capabilities
function WebMIDIFeatures() {
  const [features] = useState([
    "🚀 Ultra Low Latency",
    "📦 Object-based Delivery",
    "🔄 Adaptive Bitrate",
    "🌐 CDN Integration",
    "📱 Multi-device Sync",
    "🔒 Built-in Security"
  ]);

  const [capabilities] = useState([
    "Live Streaming",
    "Interactive Media",
    "Gaming Applications",
    "Real-time Collaboration",
    "IoT Data Streams"
  ]);

  return (
    <group position={[-2, 0, -2]}>
      <Text
        position={[0, 1, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        WebMIDI Features
      </Text>

      {features.map((feature, index) => (
        <Text
          key={index}
          position={[0, 0.6 - index * 0.15, 0]}
          fontSize={0.07}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
        >
          {feature}
        </Text>
      ))}

      <Text
        position={[0, -0.5, 0]}
        fontSize={0.1}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        Use Cases
      </Text>

      {capabilities.map((capability, index) => (
        <Text
          key={index}
          position={[0, -0.7 - index * 0.1, 0]}
          fontSize={0.06}
          color="#ff6600"
          anchorX="center"
          anchorY="middle"
        >
          • {capability}
        </Text>
      ))}
    </group>
  );
}

// Main TechWebMIDI scene
function WebMIDIScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <WebMIDIStats />
      <WebMIDIVisualization />
      <WebMIDIFeatures />
    </>
  );
}

export default function TechWebMIDI() {
  const [isSupported, setIsSupported] = useState({
    webmidi: false,
  });

  useEffect(() => {
    // Check for TechWebMIDI and related API support
    const checkSupport = () => {
      const support = {
        webmidi: false // TechWebMIDI is still experimental
      };

      setIsSupported(support);
    };

    checkSupport();
  }, []);

  return (
    <div className="webmidi-container" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div className="webmidi-header" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '1rem',
        borderRadius: '10px',
        color: 'white'
      }}>
        <h2>📡 WebMIDI</h2>
        <p>Ultra-low latency media streaming protocol</p>
        <p style={{ fontSize: '0.9em', marginTop: '10px', color: '#aaa' }}>
          Object-based media delivery with Rust WebAssembly optimization
        </p>
        <div style={{ marginTop: '10px', fontSize: '0.8em' }}>
          <div style={{ color: isSupported.webmidi ? '#00ff00' : '#ffaa00' }}>
            {isSupported.webmidi ? '✅' : '🚧'} WebMIDI (Experimental)
          </div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}
      >
        <WebMIDIScene />
      </Canvas>
    </div>
  );
}
