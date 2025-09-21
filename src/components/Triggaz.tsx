import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

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

const Triggaz: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const [midiOutput, setMidiOutput] = useState<WebMidi.MIDIOutput | null>(null);
    const [midiSupported, setMidiSupported] = useState<boolean>(false);
    const [browserInfo, setBrowserInfo] = useState<string>('');
    const lastYRef = useRef<number | null>(null);

    // Hand tracking state
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

    // Track if detection loop is running
    const detectionLoopRunning = useRef(false);
    // Track model loading state
    const [modelLoaded, setModelLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState<string>('');
    // Track if we need to start detection after model loads
    const shouldStartDetection = useRef(false);

    // Movement display state
    const [leftHandStatus, setLeftHandStatus] = useState<string>('Stationary');
    const [rightHandStatus, setRightHandStatus] = useState<string>('Stationary');
    const [jumpStatus, setJumpStatus] = useState<string>('On Ground');

    // Browser detection
    const detectBrowser = () => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Firefox')) {
            return 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari';
        } else if (userAgent.includes('Chrome')) {
            return 'Chrome';
        } else if (userAgent.includes('Edge')) {
            return 'Edge';
        }
        return 'Unknown';
    };

    // --- Utility functions used in detection ---
    const sendMidiNote = (note: number, velocity = 127) => {
        if (midiOutput) {
            try {
                midiOutput.send([0x90, note, velocity]); // Note on
                setTimeout(() => {
                    midiOutput.send([0x80, note, 0]); // Note off
                }, 100);
            } catch (error) {
                console.warn('MIDI send failed:', error);
            }
        } else if (!midiSupported) {
            // Visual feedback when MIDI is not available
            console.log(`♪ Note ${note} (velocity: ${velocity})`);
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
        const speed = Math.round(distance * 10) / 10; // Round to 1 decimal

        let newDirection: 'up' | 'down' | 'left' | 'right' | 'stationary' = 'stationary';

        // Determine primary direction (threshold for movement detection)
        if (distance > 2) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newDirection = deltaX > 0 ? 'right' : 'left';
            } else {
                newDirection = deltaY > 0 ? 'down' : 'up';
            }
        }

        // Check for direction change
        if (newDirection !== handMovement.current.direction && newDirection !== 'stationary') {
            handMovement.current.directionChangeCount++;
            // Send MIDI note on direction change
            const midiNote = handName === 'left' ? 64 + (handMovement.current.directionChangeCount % 12) : 72 + (handMovement.current.directionChangeCount % 12);
            sendMidiNote(midiNote, Math.min(127, Math.round(speed * 10)));
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
        const nose = keypoints.find(k => k.name === 'nose');

        if (!leftAnkle?.score || !rightAnkle?.score || !nose?.score) return;
        if (leftAnkle.score < 0.5 || rightAnkle.score < 0.5 || nose.score < 0.5) return;

        const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
        const currentNoseY = nose.y;

        // Initialize ground level
        if (groundLevel.current === null) {
            groundLevel.current = avgAnkleY;
        } else {
            // Update ground level gradually when person is likely on ground
            if (!isJumping.current) {
                groundLevel.current = groundLevel.current * 0.95 + avgAnkleY * 0.05;
            }
        }

        const jumpThreshold = 30; // pixels above ground level
        const landingThreshold = 15; // pixels above ground level

        // Detect jump start
        if (!isJumping.current && avgAnkleY < groundLevel.current - jumpThreshold) {
            isJumping.current = true;
            jumpStartY.current = currentNoseY;
            setJumpStatus('Jumping!');
            sendMidiNote(48, 127); // Low note for jump start
        }

        // Detect landing
        else if (isJumping.current && avgAnkleY > groundLevel.current - landingThreshold) {
            isJumping.current = false;

            // Add landing marker
            const landingX = (leftAnkle.x + rightAnkle.x) / 2;
            const landingY = avgAnkleY;

            setJumpEvents(prev => [...prev, {
                x: landingX,
                y: landingY,
                timestamp: Date.now(),
                fadeOpacity: 1.0
            }]);

            setJumpStatus('Landed!');
            sendMidiNote(36, 127); // Even lower note for landing

            // Reset status after delay
            setTimeout(() => {
                setJumpStatus('On Ground');
            }, 1000);
        }
    };

    const BODY_PARTS = {
        'left_arm': [['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist']],
        'right_arm': [['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist']],
        'left_leg': [['left_hip', 'left_knee'], ['left_knee', 'left_ankle']],
        'right_leg': [['right_hip', 'right_knee'], ['right_knee', 'right_ankle']],
        'torso': [['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip'], ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip']],
        'face': [['left_eye', 'right_eye'], ['nose', 'left_eye'], ['nose', 'right_eye'], ['left_eye', 'left_ear'], ['right_eye', 'right_ear']]
    };

    const drawSkeleton = (keypoints: poseDetection.Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D) => {
        const keypointMap = new Map(keypoints.map(keypoint => [keypoint.name, keypoint]));
        const baseResolution = 640 * 480;
        const currentResolution = ctx.canvas.width * ctx.canvas.height;
        const scaleFactor = Math.max(1, Math.sqrt(currentResolution / baseResolution));
        const lineWidth = Math.max(2, Math.round(4 * scaleFactor));
        const circleRadius = Math.max(3, Math.round(5 * scaleFactor));

        const drawSegment = (startName: string, endName: string, color: string) => {
            const start = keypointMap.get(startName);
            const end = keypointMap.get(endName);
            if (start && end && start.score && end.score && start.score > minConfidence && end.score > minConfidence) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            }
        };

        BODY_PARTS.left_arm.forEach(segment => drawSegment(segment[0], segment[1], '#FF0000'));
        BODY_PARTS.right_arm.forEach(segment => drawSegment(segment[0], segment[1], '#00FF00'));
        BODY_PARTS.left_leg.forEach(segment => drawSegment(segment[0], segment[1], '#FF0000'));
        BODY_PARTS.right_leg.forEach(segment => drawSegment(segment[0], segment[1], '#00FF00'));
        BODY_PARTS.torso.forEach(segment => drawSegment(segment[0], segment[1], '#FFFF00'));
        BODY_PARTS.face.forEach(segment => drawSegment(segment[0], segment[1], '#0000FF'));

        keypoints.forEach(keypoint => {
            if (keypoint.score && keypoint.score > minConfidence) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, circleRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = Math.max(1, Math.round(scaleFactor));
                ctx.stroke();
            }
        });
    };

    const drawJumpMarkers = (ctx: CanvasRenderingContext2D) => {
        const now = Date.now();
        const fadeDuration = 3000; // 3 seconds fade

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

                // Add "LAND" text
                ctx.font = '12px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText('LAND', jumpEvent.x, jumpEvent.y + 4);
                ctx.restore();
            }
        });

        // Clean up old jump events
        setJumpEvents(prev => prev.filter(event => now - event.timestamp < fadeDuration));
    };

    // --- Main pose detection loop ---
    const detectPose = async () => {
        if (detectorRef.current && videoRef.current && canvasRef.current && !videoRef.current.paused) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    // Use videoRect for canvas overlay and drawing scale
                    const videoRect = video.getBoundingClientRect();
                    // Set canvas style to match videoRect (displayed size)
                    canvas.style.position = 'absolute';
                    canvas.style.pointerEvents = 'none';
                    canvas.style.left = `${videoRect.left - (containerRef.current?.getBoundingClientRect().left || 0)}px`;
                    canvas.style.top = `${videoRect.top - (containerRef.current?.getBoundingClientRect().top || 0)}px`;
                    canvas.style.width = `${videoRect.width}px`;
                    canvas.style.height = `${videoRect.height}px`;
                    // Set canvas internal size to match video display size for 1:1 drawing
                    if (canvas.width !== Math.round(videoRect.width) || canvas.height !== Math.round(videoRect.height)) {
                        canvas.width = Math.round(videoRect.width);
                        canvas.height = Math.round(videoRect.height);
                    }
                    // Draw pose scaled to videoRect
                    const poses = await detectorRef.current.estimatePoses(video);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Calculate scale factors from video intrinsic to display size
                    const scaleX = videoRect.width / video.videoWidth;
                    const scaleY = videoRect.height / video.videoHeight;
                    ctx.save();
                    ctx.scale(scaleX, scaleY);

                    poses.forEach(pose => {
                        // Original nose tracking for head movement
                        const nose = pose.keypoints.find(k => k.name === 'nose');
                        if (nose && nose.score && nose.score > 0.5) {
                            if (lastYRef.current !== null) {
                                const deltaY = nose.y - lastYRef.current;
                                if (deltaY < -10) {
                                    sendMidiNote(60);
                                }
                            }
                            lastYRef.current = nose.y;
                        }

                        // Hand movement tracking
                        const leftWrist = pose.keypoints.find(k => k.name === 'left_wrist');
                        const rightWrist = pose.keypoints.find(k => k.name === 'right_wrist');

                        if (leftWrist && leftWrist.score && leftWrist.score > 0.5) {
                            const leftStatus = calculateMovement(
                                { x: leftWrist.x, y: leftWrist.y },
                                leftHandMovement,
                                'left'
                            );
                            setLeftHandStatus(leftStatus);
                        }

                        if (rightWrist && rightWrist.score && rightWrist.score > 0.5) {
                            const rightStatus = calculateMovement(
                                { x: rightWrist.x, y: rightWrist.y },
                                rightHandMovement,
                                'right'
                            );
                            setRightHandStatus(rightStatus);
                        }

                        // Jump detection
                        detectJump(pose.keypoints);

                        drawSkeleton(pose.keypoints, 0.5, ctx);
                    });

                    // Draw jump markers (in scaled context)
                    drawJumpMarkers(ctx);

                    ctx.restore();
                } catch (error) {
                    console.warn('Detection loop error:', error);
                }
            }
            requestAnimationFrame(detectPose);
        } else {
            detectionLoopRunning.current = false;
        }
    };

    const initMidi = async () => {
        // Check MIDI support first
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
                setMidiSupported(true); // API is supported, just no devices
            }
        } catch (err) {
            console.error("Could not access MIDI devices:", err);
            setMidiSupported(false);
        }
    };

    const loadModel = async () => {
        try {
            console.log("Loading pose detection model...");
            setLoadingError('');

            // Try multiple backends for better browser compatibility
            const backends = ['webgl', 'webgpu', 'cpu'];
            let backendSet = false;

            for (const backend of backends) {
                try {
                    console.log(`Trying backend: ${backend}`);
                    await tf.setBackend(backend);
                    await tf.ready();
                    console.log(`Successfully set backend: ${backend}`);
                    backendSet = true;
                    break;
                } catch (backendError) {
                    console.warn(`Backend ${backend} failed:`, backendError);
                    continue;
                }
            }

            if (!backendSet) {
                throw new Error('No supported TensorFlow.js backend found');
            }

            const model = poseDetection.SupportedModels.MoveNet;
            const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
            const detector = await poseDetection.createDetector(model, detectorConfig);
            detectorRef.current = detector;
            setModelLoaded(true);
            console.log("Pose detection model loaded successfully");

            // If we're waiting to start detection, start it now
            if (shouldStartDetection.current) {
                shouldStartDetection.current = false;
                startDetectionLoop();
            }
        } catch (err) {
            console.error("Error loading model: ", err);
            setLoadingError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`);

            // Try with CPU backend as fallback
            if (!modelLoaded) {
                try {
                    console.log("Trying CPU backend as fallback...");
                    await tf.setBackend('cpu');
                    await tf.ready();
                    const model = poseDetection.SupportedModels.MoveNet;
                    const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
                    const detector = await poseDetection.createDetector(model, detectorConfig);
                    detectorRef.current = detector;
                    setModelLoaded(true);
                    setLoadingError('');
                    console.log("Pose detection model loaded with CPU backend");

                    if (shouldStartDetection.current) {
                        shouldStartDetection.current = false;
                        startDetectionLoop();
                    }
                } catch (fallbackErr) {
                    console.error("CPU fallback also failed:", fallbackErr);
                    setLoadingError(`Model loading failed completely: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`);
                }
            }
        }
    };

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Add event listener to handle auto-play restrictions
                videoRef.current.addEventListener('loadedmetadata', () => {
                    videoRef.current?.play().catch(console.error);
                });
            }
            setStream(mediaStream);
        } catch (err) {
            console.error("Error accessing webcam: ", err);
            alert(`Camera access failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Helper to set crossOrigin for remote videos - improved for Safari
    const setVideoCrossOrigin = (url: string) => {
        if (videoRef.current) {
            // Only set crossOrigin for remote URLs
            if (/^https?:\/\//.test(url)) {
                videoRef.current.crossOrigin = 'anonymous';
            } else {
                videoRef.current.removeAttribute('crossOrigin');
            }
            // Safari-specific: set preload
            videoRef.current.preload = 'metadata';
        }
    };

    const loadDemoMovie = () => {
        resetTrackingState();
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            const url = 'https://kasmsdk.github.io/public/theremin.webm';
            setVideoCrossOrigin(url);
            videoRef.current.src = url;
            videoRef.current.load();
            // Handle autoplay for Safari/Firefox
            videoRef.current.play().catch(err => {
                console.warn('Autoplay blocked:', err);
            });
            setStream(null);
        }
    };

    const loadDemoMovie2 = () => {
        resetTrackingState();
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            const url = 'https://kasmsdk.github.io/public/kasm_pose_airguitar.webm';
            setVideoCrossOrigin(url);
            videoRef.current.src = url;
            videoRef.current.load();
            videoRef.current.play().catch(err => {
                console.warn('Autoplay blocked:', err);
            });
            setStream(null);
        }
    };

    const loadDemoMovie3 = () => {
        resetTrackingState();
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            const url = 'https://kasmsdk.github.io/public/kasm_pose_jump.webm';
            setVideoCrossOrigin(url);
            videoRef.current.src = url;
            videoRef.current.load();
            videoRef.current.play().catch(err => {
                console.warn('Autoplay blocked:', err);
            });
            setStream(null);
        }
    };

    const loadDemoMovie4 = () => {
        resetTrackingState();
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            const url = 'https://kasmsdk.github.io/public/kasm_pose_dance.webm';
            setVideoCrossOrigin(url);
            videoRef.current.src = url;
            videoRef.current.load();
            videoRef.current.play().catch(err => {
                console.warn('Autoplay blocked:', err);
            });
            setStream(null);
        }
    };

    const resetTrackingState = () => {
        leftHandMovement.current = {
            direction: 'stationary',
            speed: 0,
            lastPosition: { x: 0, y: 0 },
            directionChangeCount: 0
        };
        rightHandMovement.current = {
            direction: 'stationary',
            speed: 0,
            lastPosition: { x: 0, y: 0 },
            directionChangeCount: 0
        };
        groundLevel.current = null;
        isJumping.current = false;
        jumpStartY.current = null;
        setJumpEvents([]);
        setLeftHandStatus('Stationary');
        setRightHandStatus('Stationary');
        setJumpStatus('On Ground');
    };

    // Ensure updateCanvasSize is always called after video loads
    const handleLoadedMetadata = () => {
        console.log("Video metadata loaded");
        updateCanvasSize();
        // Do not start detection loop here; wait for canplay
    };

    // Start detection loop only when video can play (first frame available)
    const handleCanPlay = () => {
        console.log("Video can play, model loaded:", modelLoaded);
        updateCanvasSize();

        // Only start detection if model is loaded
        if (modelLoaded && detectorRef.current) {
            startDetectionLoop();
        } else {
            // Mark that we should start detection once model is loaded
            shouldStartDetection.current = true;
            console.log("Waiting for model to load before starting detection");
        }
    };

    // Use videoRect for pixel-perfect alignment
    const updateCanvasSize = () => {
        if (videoRef.current && canvasRef.current && containerRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (video.videoWidth && video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                container.style.width = `${video.videoWidth}px`;
                container.style.height = `${video.videoHeight}px`;
            }
            const videoRect = video.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            canvas.style.position = 'absolute';
            canvas.style.pointerEvents = 'none';
            canvas.style.left = `${videoRect.left - containerRect.left}px`;
            canvas.style.top = `${videoRect.top - containerRect.top}px`;
            canvas.style.width = `${videoRect.width}px`;
            canvas.style.height = `${videoRect.height}px`;
        }
    };

    // Only start detection loop if not already running and model is loaded
    const startDetectionLoop = () => {
        if (detectionLoopRunning.current || !modelLoaded || !detectorRef.current) {
            console.log("Cannot start detection loop:", {
                running: detectionLoopRunning.current,
                modelLoaded,
                detectorExists: !!detectorRef.current
            });
            return;
        }

        console.log("Starting detection loop");
        detectionLoopRunning.current = true;

        // Add a small delay to ensure video is fully ready
        setTimeout(() => {
            updateCanvasSize();
            detectPose();
        }, 100);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            resetTrackingState();
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                setVideoCrossOrigin(url);
                videoRef.current.src = url;
                videoRef.current.load();
                videoRef.current.play().catch(err => {
                    console.warn('File video autoplay blocked:', err);
                });
                setStream(null);
            }
        }
    };

    // Handle window resize to keep canvas aligned
    useEffect(() => {
        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load model on component mount and detect browser
    useEffect(() => {
        const browser = detectBrowser();
        setBrowserInfo(browser);
        console.log(`Detected browser: ${browser}`);

        loadModel();
        initMidi();
    }, []);

    // Reset detection loop flag when video ends or errors occur
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVideoEnd = () => {
            console.log("Video ended, stopping detection");
            detectionLoopRunning.current = false;
        };

        const handleVideoError = (e: Event) => {
            console.log("Video error, stopping detection", e);
            detectionLoopRunning.current = false;
        };

        const handleVideoPause = () => {
            console.log("Video paused, stopping detection");
            detectionLoopRunning.current = false;
        };

        video.addEventListener('ended', handleVideoEnd);
        video.addEventListener('error', handleVideoError);
        video.addEventListener('pause', handleVideoPause);

        return () => {
            video.removeEventListener('ended', handleVideoEnd);
            video.removeEventListener('error', handleVideoError);
            video.removeEventListener('pause', handleVideoPause);
        };
    }, []);

    return (
        <div className="kasm-landing-container">
            <h1>Kasm Triggaz</h1>
            <p>Pose detection with webcam or video file to trigger MIDI events</p>

            {/* Browser and Status Info */}
            <div style={{
                textAlign: 'center',
                margin: '10px 0',
                fontSize: '12px',
                color: '#666'
            }}>
                Browser: {browserInfo} | MIDI: {midiSupported ? (midiOutput ? 'Connected' : 'Supported') : 'Not Supported'}
            </div>

            {!modelLoaded && !loadingError && <p>Loading pose detection model...</p>}
            {loadingError && <p style={{ color: 'red' }}>Error: {loadingError}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="kasm-demo-btn" onClick={initMidi} disabled={!!midiOutput || !midiSupported}>
                        {midiOutput ? 'MIDI Connected' : midiSupported ? 'Connect MIDI' : 'MIDI Unsupported'}
                    </button>
                    <button className="kasm-demo-btn" onClick={startCamera} disabled={!!stream}>
                        {stream ? 'Webcam On' : 'Start Webcam'}
                    </button>
                    <label className="kasm-demo-btn">
                        Upload Video
                        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie} disabled={!modelLoaded}>
                        Theremin Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie2} disabled={!modelLoaded}>
                        Air Guitar Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie3} disabled={!modelLoaded}>
                        Jumping Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie4} disabled={!modelLoaded}>
                        Dance Example
                    </button>
                </div>
                <div className="kasm-sunken-panel" ref={containerRef} style={{ position: 'relative', width: '640px', height: '480px' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        onLoadedMetadata={handleLoadedMetadata}
                        onCanPlay={handleCanPlay}
                        onResize={updateCanvasSize}
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '8px',
                            display: 'block',
                            objectFit: 'contain'
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            pointerEvents: 'none',
                            borderRadius: '8px'
                        }}
                    />
                </div>
            </div>
            {/* Movement Status Display */}
            <div style={{
                justifyContent: 'left',
            }}>
                <div>
                    <strong>Left Hand:</strong> {leftHandStatus}
                </div>
                <br/>
                <div>
                    <strong>Right Hand:</strong> {rightHandStatus}
                </div>
                <br/>
                <div>
                    <strong>Jump Status:</strong> <span style={{ color: jumpStatus === 'Jumping!' ? '#ffff00' : jumpStatus === 'Landed!' ? '#ff6600' : '#ffffff' }}>
                        {jumpStatus}
                    </span>
                </div>
            </div>

        </div>
    );
};

export default Triggaz;
