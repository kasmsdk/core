import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three';

interface VirtualInstrumentState {
    position: { x: number; y: number; z: number };
    rotation: { a: number; b: number; c: number };
    isGrabbed: boolean;
    grabController: XRInputSource | null;
}

interface HandMovement {
    direction: 'up' | 'down' | 'left' | 'right' | 'stationary';
    speed: number;
    lastPosition: { x: number; y: number };
    directionChangeCount: number;
}

interface JumpEvent {
    x: number;
    y: number;
    timestamp: number;
    fadeOpacity: number;
}

type XRMode = 'none' | 'ar' | 'vr';

const WebXR: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // WebXR and Three.js refs
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const xrSessionRef = useRef<XRSession | null>(null);
    const frameLoopRef = useRef<number | null>(null);
    const virtualCubeRef = useRef<THREE.Mesh | null>(null);
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

    // State
    const [xrSupported, setXrSupported] = useState<{ ar: boolean; vr: boolean }>({ ar: false, vr: false });
    const [currentMode, setCurrentMode] = useState<XRMode>('none');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [instrumentState, setInstrumentState] = useState<VirtualInstrumentState>({
        position: { x: 0, y: 0, z: -1 },
        rotation: { a: 0, b: 0, c: 0 },
        isGrabbed: false,
        grabController: null
    });

    // Pose detection refs
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState<string>('');
    const detectionLoopRunning = useRef(false);

    // Hand tracking state for AR mode
    const leftHandMovement = useRef<HandMovement>({
        direction: 'stationary',
        speed: 0,
        lastPosition: { x: 0, y: 0 },
        directionChangeCount: 0
    });
    const rightHandMovement = useRef<HandMovement>({
        direction: 'stationary',
        speed: 0,
        lastPosition: { x: 0, y: 0 },
        directionChangeCount: 0
    });

    // Jump detection state
    const [jumpEvents, setJumpEvents] = useState<JumpEvent[]>([]);
    const isJumping = useRef(false);
    const jumpStartY = useRef<number | null>(null);
    const groundLevel = useRef<number | null>(null);

    // Status display
    const [displayLeftHandStatus, setDisplayLeftHandStatus] = useState<string>('Stationary');
    const [displayRightHandStatus, setDisplayRightHandStatus] = useState<string>('Stationary');
    const [displayJumpStatus, setDisplayJumpStatus] = useState<string>('On Ground');

    // MIDI output
    const [midiOutput, setMidiOutput] = useState<WebMidi.MIDIOutput | null>(null);
    const [midiSupported, setMidiSupported] = useState<boolean>(false);

    // Initialize Three.js scene
    const initThreeJS = useCallback(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.xr.enabled = true;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Create virtual instrument cube
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshLambertMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, -1);
        scene.add(cube);

        // Add wireframe for better visibility
        const wireframe = new THREE.WireframeGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);
        cube.add(wireframeMesh);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        virtualCubeRef.current = cube;

        console.log('Three.js scene initialized');
    }, []);

    // WebXR support detection
    const checkXRSupport = useCallback(async () => {
        if (!('xr' in navigator)) {
            console.log('WebXR not supported');
            return;
        }

        try {
            const arSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
            const vrSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');

            setXrSupported({ ar: arSupported, vr: vrSupported });
            console.log(`WebXR Support - AR: ${arSupported}, VR: ${vrSupported}`);
        } catch (error) {
            console.error('Error checking WebXR support:', error);
            setXrSupported({ ar: false, vr: false });
        }
    }, []);

    // Start XR session
    const startXRSession = useCallback(async (mode: 'ar' | 'vr') => {
        if (!rendererRef.current || !('xr' in navigator)) return;

        try {
            const sessionMode = mode === 'ar' ? 'immersive-ar' : 'immersive-vr';
            const requiredFeatures = mode === 'ar' ? ['camera-access'] : [];
            const optionalFeatures = ['hand-tracking', 'local-floor'];

            const session = await (navigator as any).xr.requestSession(sessionMode, {
                requiredFeatures,
                optionalFeatures
            });

            await rendererRef.current.xr.setSession(session);
            xrSessionRef.current = session;
            setCurrentMode(mode);

            // Set up session event handlers
            session.addEventListener('end', handleXRSessionEnd);
            session.addEventListener('inputsourceschange', handleInputSourcesChange);

            // Start render loop
            rendererRef.current.setAnimationLoop(renderXRFrame);

            console.log(`${mode.toUpperCase()} session started`);

            // For AR mode, also start camera and pose detection
            if (mode === 'ar') {
                await startCamera();
            }

        } catch (error) {
            console.error(`Failed to start ${mode} session:`, error);
            alert(`Failed to start ${mode.toUpperCase()} session. Make sure you have a compatible headset or device.`);
        }
    }, []);

    // Handle XR session end
    const handleXRSessionEnd = useCallback(() => {
        if (rendererRef.current) {
            rendererRef.current.setAnimationLoop(null);
        }
        xrSessionRef.current = null;
        setCurrentMode('none');
        setInstrumentState(prev => ({ ...prev, isGrabbed: false, grabController: null }));
        console.log('XR session ended');
    }, []);

    // Handle input sources change (controllers)
    const handleInputSourcesChange = useCallback((event: any) => {
        console.log('Input sources changed:', event.session.inputSources.length);
    }, []);

    // XR render loop
    const renderXRFrame = useCallback((timestamp: number, frame: XRFrame) => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !virtualCubeRef.current) return;

        const session = frame.session;
        const pose = frame.getViewerPose(rendererRef.current.xr.getReferenceSpace());

        if (pose) {
            // Handle controller input
            handleControllerInput(session, frame);

            // Update virtual instrument
            updateVirtualInstrument();

            // Render the scene
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    }, []);

    // Handle controller input for grabbing and moving the cube
    const handleControllerInput = useCallback((session: XRSession, frame: XRFrame) => {
        if (!virtualCubeRef.current || !rendererRef.current) return;

        const referenceSpace = rendererRef.current.xr.getReferenceSpace();
        if (!referenceSpace) return;

        for (const inputSource of session.inputSources) {
            if (inputSource.gripSpace) {
                const gripPose = frame.getPose(inputSource.gripSpace, referenceSpace);
                if (gripPose) {
                    const position = gripPose.transform.position;
                    const orientation = gripPose.transform.orientation;

                    // Check if controller is near the cube for grabbing
                    const cubePosition = virtualCubeRef.current.position;
                    const distance = Math.sqrt(
                        Math.pow(position.x - cubePosition.x, 2) +
                        Math.pow(position.y - cubePosition.y, 2) +
                        Math.pow(position.z - cubePosition.z, 2)
                    );

                    // Handle grabbing
                    if (inputSource.gamepad?.buttons[1]?.pressed) { // Trigger button
                        if (distance < 0.2 && !instrumentState.isGrabbed) {
                            setInstrumentState(prev => ({
                                ...prev,
                                isGrabbed: true,
                                grabController: inputSource
                            }));
                        }
                    } else {
                        if (instrumentState.grabController === inputSource) {
                            setInstrumentState(prev => ({
                                ...prev,
                                isGrabbed: false,
                                grabController: null
                            }));
                        }
                    }

                    // Move cube if grabbed by this controller
                    if (instrumentState.isGrabbed && instrumentState.grabController === inputSource) {
                        const newPosition = {
                            x: position.x,
                            y: position.y,
                            z: position.z
                        };

                        const newRotation = {
                            a: orientation.x * 180 / Math.PI,
                            b: orientation.y * 180 / Math.PI,
                            c: orientation.z * 180 / Math.PI
                        };

                        setInstrumentState(prev => ({
                            ...prev,
                            position: newPosition,
                            rotation: newRotation
                        }));

                        // Send MIDI based on position and rotation
                        sendMidiFromInstrument(newPosition, newRotation);
                    }
                }
            }
        }
    }, [instrumentState]);

    // Update virtual instrument position and rotation
    const updateVirtualInstrument = useCallback(() => {
        if (!virtualCubeRef.current) return;

        const { position, rotation, isGrabbed } = instrumentState;

        virtualCubeRef.current.position.set(position.x, position.y, position.z);
        virtualCubeRef.current.rotation.set(
            rotation.a * Math.PI / 180,
            rotation.b * Math.PI / 180,
            rotation.c * Math.PI / 180
        );

        // Change cube appearance when grabbed
        const material = virtualCubeRef.current.material as THREE.MeshLambertMaterial;
        material.color.setHex(isGrabbed ? 0xff4444 : 0x00ff88);
        material.opacity = isGrabbed ? 1.0 : 0.8;
    }, [instrumentState]);

    // Send MIDI based on instrument state
    const sendMidiFromInstrument = useCallback((position: {x: number, y: number, z: number}, rotation: {a: number, b: number, c: number}) => {
        if (!midiOutput) return;

        try {
            // Map position to MIDI CC values (0-127)
            const xCC = Math.round(Math.max(0, Math.min(127, (position.x + 1) * 63.5)));
            const yCC = Math.round(Math.max(0, Math.min(127, (position.y + 1) * 63.5)));
            const zCC = Math.round(Math.max(0, Math.min(127, (position.z + 2) * 42.33)));

            // Map rotation to MIDI CC values
            const aCC = Math.round(Math.max(0, Math.min(127, (rotation.a + 180) * 127 / 360)));
            const bCC = Math.round(Math.max(0, Math.min(127, (rotation.b + 180) * 127 / 360)));
            const cCC = Math.round(Math.max(0, Math.min(127, (rotation.c + 180) * 127 / 360)));

            // Send MIDI CC messages
            midiOutput.send([0xB0, 1, xCC]); // X position
            midiOutput.send([0xB0, 2, yCC]); // Y position
            midiOutput.send([0xB0, 3, zCC]); // Z position
            midiOutput.send([0xB0, 4, aCC]); // A rotation
            midiOutput.send([0xB0, 5, bCC]); // B rotation
            midiOutput.send([0xB0, 6, cCC]); // C rotation
        } catch (error) {
            console.warn('MIDI send failed:', error);
        }
    }, [midiOutput]);

    // End XR session
    const endXRSession = useCallback(() => {
        if (xrSessionRef.current) {
            xrSessionRef.current.end();
        }
    }, []);

    // Camera and pose detection functions (for AR mode)
    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment' // Use rear camera for AR
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.addEventListener('loadedmetadata', () => {
                    videoRef.current?.play().catch(console.error);
                    startDetectionLoop();
                });
            }
            setStream(mediaStream);
        } catch (err) {
            console.error("Error accessing camera: ", err);
        }
    };

    // Pose detection functions (keeping from original)
    const loadModel = async () => {
        try {
            console.log("Loading pose detection model...");
            setLoadingError('');

            await tf.setBackend('webgl');
            await tf.ready();

            const model = poseDetection.SupportedModels.MoveNet;
            const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
            const detector = await poseDetection.createDetector(model, detectorConfig);
            detectorRef.current = detector;
            setModelLoaded(true);
            console.log("Pose detection model loaded successfully");
        } catch (err) {
            console.error("Error loading model: ", err);
            setLoadingError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const startDetectionLoop = () => {
        if (detectionLoopRunning.current || !modelLoaded || !detectorRef.current || currentMode !== 'ar') {
            return;
        }

        console.log("Starting pose detection loop for AR mode");
        detectionLoopRunning.current = true;
        detectPose();
    };

    const detectPose = async () => {
        if (detectorRef.current && videoRef.current && canvasRef.current && currentMode === 'ar' && !videoRef.current.paused) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    const poses = await detectorRef.current.estimatePoses(video);

                    // Project pose data onto the existing canvas used by Three.js
                    ctx.save();
                    ctx.globalCompositeOperation = 'source-over';

                    poses.forEach(pose => {
                        drawSkeleton(pose.keypoints, 0.5, ctx);
                        processHandMovements(pose.keypoints);
                        detectJump(pose.keypoints);
                    });

                    drawJumpMarkers(ctx);
                    ctx.restore();
                } catch (error) {
                    console.warn('Pose detection error:', error);
                }
            }

            if (detectionLoopRunning.current) {
                requestAnimationFrame(detectPose);
            }
        } else {
            detectionLoopRunning.current = false;
        }
    };

    // Pose processing functions (simplified versions from original)
    const processHandMovements = (keypoints: poseDetection.Keypoint[]) => {
        const leftWrist = keypoints.find(k => k.name === 'left_wrist');
        const rightWrist = keypoints.find(k => k.name === 'right_wrist');

        if (leftWrist && leftWrist.score && leftWrist.score > 0.5) {
            const leftStatus = calculateMovement(
                { x: leftWrist.x, y: leftWrist.y },
                leftHandMovement,
                'left'
            );
            setDisplayLeftHandStatus(leftStatus);
        }

        if (rightWrist && rightWrist.score && rightWrist.score > 0.5) {
            const rightStatus = calculateMovement(
                { x: rightWrist.x, y: rightWrist.y },
                rightHandMovement,
                'right'
            );
            setDisplayRightHandStatus(rightStatus);
        }
    };

    const calculateMovement = (
        currentPos: { x: number; y: number },
        handMovement: React.MutableRefObject<HandMovement>,
        handName: string
    ): string => {
        const { lastPosition } = handMovement.current;

        if (lastPosition.x === 0 && lastPosition.y === 0) {
            handMovement.current.lastPosition = currentPos;
            return 'Stationary';
        }

        const deltaX = currentPos.x - lastPosition.x;
        const deltaY = currentPos.y - lastPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const speed = Math.round(distance * 10) / 10;

        let newDirection: 'up' | 'down' | 'left' | 'right' | 'stationary' = 'stationary';

        if (distance > 2) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newDirection = deltaX > 0 ? 'right' : 'left';
            } else {
                newDirection = deltaY > 0 ? 'down' : 'up';
            }
        }

        handMovement.current.direction = newDirection;
        handMovement.current.speed = speed;
        handMovement.current.lastPosition = currentPos;

        const directionText = newDirection.charAt(0).toUpperCase() + newDirection.slice(1);
        return speed > 1 ? `${directionText} (${speed} px/frame)` : 'Stationary';
    };

    const detectJump = (keypoints: poseDetection.Keypoint[]) => {
        const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
        const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

        if (!leftAnkle?.score || !rightAnkle?.score) return;
        if (leftAnkle.score < 0.3 || rightAnkle.score < 0.3) return;

        const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;

        if (groundLevel.current === null) {
            groundLevel.current = avgAnkleY;
        }

        if (!isJumping.current && avgAnkleY < groundLevel.current - 15) {
            isJumping.current = true;
            setDisplayJumpStatus('Jumping!');

            setJumpEvents(prev => [...prev, {
                x: (leftAnkle.x + rightAnkle.x) / 2,
                y: avgAnkleY,
                timestamp: Date.now(),
                fadeOpacity: 1.0
            }]);
        } else if (isJumping.current && avgAnkleY > groundLevel.current - 8) {
            isJumping.current = false;
            setDisplayJumpStatus('Landed!');

            setTimeout(() => {
                setDisplayJumpStatus('On Ground');
            }, 2000);
        }
    };

    const drawSkeleton = (keypoints: poseDetection.Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D) => {
        keypoints.forEach(keypoint => {
            if (keypoint.score && keypoint.score > minConfidence) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    };

    const drawJumpMarkers = (ctx: CanvasRenderingContext2D) => {
        const now = Date.now();
        const fadeDuration = 3000; // milliseconds

        jumpEvents.forEach((jumpEvent) => {
            const age = now - jumpEvent.timestamp;
            if (age < fadeDuration) {
                const opacity = 1 - (age / fadeDuration);
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.arc(jumpEvent.x, jumpEvent.y, 15, 0, 2 * Math.PI);
                ctx.fillStyle = '#FF0000';
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        });

        setJumpEvents(prev => prev.filter(event => (now - event.timestamp) < fadeDuration));
    };

    // MIDI initialization
    const initMidi = async () => {
        if (typeof navigator.requestMIDIAccess === 'undefined') {
            console.warn("Web MIDI API is not supported in this browser.");
            setMidiSupported(false);
            return;
        }

        try {
            const midiAccess = await navigator.requestMIDIAccess();
            const outputs = midiAccess.outputs.values();
            const output = outputs.next().value;
            if (output) {
                setMidiOutput(output);
                setMidiSupported(true);
                console.log("MIDI connected:", output.name);
            } else {
                console.warn("No MIDI output devices found.");
                setMidiSupported(true);
            }
        } catch (err) {
            console.error("Could not access MIDI devices:", err);
            setMidiSupported(false);
        }
    };

    // Resize canvas
    const updateCanvasSize = () => {
        if (canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const container = containerRef.current;

            const containerWidth = Math.min(640, window.innerWidth * 0.8);
            const containerHeight = containerWidth * 0.75; // 4:3 aspect ratio

            container.style.width = `${containerWidth}px`;
            container.style.height = `${containerHeight}px`;

            canvas.width = containerWidth;
            canvas.height = containerHeight;
            canvas.style.width = `${containerWidth}px`;
            canvas.style.height = `${containerHeight}px`;

            if (rendererRef.current) {
                rendererRef.current.setSize(containerWidth, containerHeight);
            }
        }
    };

    // Effects
    useEffect(() => {
        checkXRSupport();
        initThreeJS();
        loadModel();
        initMidi();
        updateCanvasSize();

        const handleResize = () => updateCanvasSize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (xrSessionRef.current) {
                xrSessionRef.current.end();
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            detectionLoopRunning.current = false;
        };
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>WebXR Virtual Instrument Controller</h1>

            {/* Status Info */}
            <div style={{
                textAlign: 'center',
                margin: '10px 0',
                fontSize: '12px',
                color: '#666'
            }}>
                WebXR Support - AR: {xrSupported.ar ? 'Yes' : 'No'} | VR: {xrSupported.vr ? 'Yes' : 'No'} |
                MIDI: {midiSupported ? (midiOutput ? 'Connected' : 'Supported') : 'Not Supported'} |
                Current Mode: {currentMode.toUpperCase()}
            </div>

            {!modelLoaded && !loadingError && <p>Loading pose detection model...</p>}
            {loadingError && <p style={{ color: 'red' }}>Error: {loadingError}</p>}

            {/* Control Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => startXRSession('ar')}
                        disabled={!xrSupported.ar || currentMode !== 'none'}
                        style={{
                            padding: '12px 24px',
                            background: currentMode === 'ar' ? '#ff4444' : '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: xrSupported.ar && currentMode === 'none' ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {currentMode === 'ar' ? 'AR Active' : 'Start AR Mode'}
                    </button>

                    <button
                        onClick={() => startXRSession('vr')}
                        disabled={!xrSupported.vr || currentMode !== 'none'}
                        style={{
                            padding: '12px 24px',
                            background: currentMode === 'vr' ? '#ff4444' : '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: xrSupported.vr && currentMode === 'none' ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {currentMode === 'vr' ? 'VR Active' : 'Start VR Mode'}
                    </button>

                    <button
                        onClick={endXRSession}
                        disabled={currentMode === 'none'}
                        style={{
                            padding: '12px 24px',
                            background: currentMode !== 'none' ? '#ff4444' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: currentMode !== 'none' ? 'pointer' : 'not-allowed'
                        }}
                    >
                        End XR Session
                    </button>

                    <button onClick={initMidi} disabled={!!midiOutput || !midiSupported}>
                        {midiOutput ? 'MIDI Connected' : midiSupported ? 'Connect MIDI' : 'MIDI Unsupported'}
                    </button>
                </div>

                {/* Canvas Container */}
                <div ref={containerRef} style={{
                    position: 'relative',
                    maxWidth: '80vw',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    background: '#000',
                    margin: '0 auto'
                }}>
                    {/* Hidden video element for pose detection (AR mode) */}
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Main canvas for WebXR rendering and pose overlay */}
                    <canvas
                        ref={canvasRef}
                        style={{
                            display: 'block',
                            borderRadius: '6px'
                        }}
                    />
                </div>
            </div>

            {/* Virtual Instrument State Display */}
            <div style={{
                width: 'min(640px, 80vw)',
                margin: '0 auto',
                padding: '20px',
                border: '2px solid #007acc',
                borderRadius: '12px',
            }}>
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#fff' }}>Virtual Instrument Controller</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    fontFamily: 'monospace',
                    fontSize: '16px'
                }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#aaffaa' }}>Spatial Offset (XYZ)</h4>
                        <div><strong>X:</strong> {instrumentState.position.x.toFixed(3)}</div>
                        <div><strong>Y:</strong> {instrumentState.position.y.toFixed(3)}</div>
                        <div><strong>Z:</strong> {instrumentState.position.z.toFixed(3)}</div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#ffff7a' }}>3D Rotation (ABC)</h4>
                        <div><strong>A:</strong> {instrumentState.rotation.a.toFixed(1)}°</div>
                        <div><strong>B:</strong> {instrumentState.rotation.b.toFixed(1)}°</div>
                        <div><strong>C:</strong> {instrumentState.rotation.c.toFixed(1)}°</div>
                    </div>
                </div>

                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: instrumentState.isGrabbed ? 'rgba(255,68,68,0.6)' : 'rgba(0,255,136,0.6)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: instrumentState.isGrabbed ? '#cc0000' : '#006600'
                }}>
                    Status: {instrumentState.isGrabbed ? 'GRABBED - Moving Cube!' : 'Ready - Point and grab the cube'}
                </div>
            </div>

            {/* Pose Detection Status (AR Mode Only) */}
            {currentMode === 'ar' && (
                <div style={{
                    width: 'min(640px, 80vw)',
                    margin: '16px auto 0',
                    padding: '16px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    textAlign: 'left',
                    lineHeight: '1.6',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>AR Pose Detection</h4>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>Left Hand:</strong> {displayLeftHandStatus}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>Right Hand:</strong> {displayRightHandStatus}
                    </div>
                    <div>
                        <strong>Jump Status:</strong> <span style={{
                        color: displayJumpStatus === 'Jumping!' ? '#ff8888' :
                            displayJumpStatus === 'Landed!' ? '#88ff88' : '#333',
                        fontWeight: 'bold'
                    }}>
                            {displayJumpStatus}
                        </span>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div style={{
                maxWidth: '640px',
                margin: '20px auto 0',
                padding: '16px',
                border: '1px solid #bee5eb',
                borderRadius: '8px',
                fontSize: '14px'
            }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Instructions:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    <li><strong>AR Mode:</strong> Overlays virtual cube on real world camera view + pose detection</li>
                    <li><strong>VR Mode:</strong> Fully virtual environment with just the cube controller</li>
                    <li>Use VR/AR controllers to point at and grab the green cube</li>
                    <li>Press trigger button to grab, move controllers to change XYZ position</li>
                    <li>Twist controllers to change ABC rotation values</li>
                    <li>Position and rotation data is sent as MIDI CC messages when grabbed</li>
                    <li>WebXR requires compatible headset or device (Quest, HoloLens, etc.)</li>
                    <li>Some browsers may require HTTPS for WebXR to work</li>
                </ul>
            </div>
        </div>
    );
};

export default WebXR;
