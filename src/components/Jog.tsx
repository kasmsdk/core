import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// Type declarations for HLS.js and Dash.js
declare global {
    interface Window {
        Hls: any;
        dashjs: any;
    }
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

interface TimelineMarker {
    id: string;
    time: number;
    label: string;
    description?: string;
}

const Jog: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const [midiOutput, setMidiOutput] = useState<WebMidi.MIDIOutput | null>(null);
    const [midiSupported, setMidiSupported] = useState<boolean>(false);
    const [browserInfo, setBrowserInfo] = useState<string>('');
    const lastYRef = useRef<number | null>(null);

    // Video player state
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [volume, setVolume] = useState<number>(1);

    // Video streaming support
    const hlsRef = useRef<any>(null);
    const dashPlayerRef = useRef<any>(null);
    const [videoType, setVideoType] = useState<'mp4' | 'hls' | 'dash' | 'webcam'>('mp4');

    // Timeline markers
    const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([
        { id: '1', time: 10, label: 'Marker 1', description: 'First movement sequence' },
        { id: '2', time: 30, label: 'Marker 2', description: 'Jump sequence begins' },
        { id: '3', time: 60, label: 'Marker 3', description: 'Hand gestures' },
        { id: '4', time: 90, label: 'Marker 4', description: 'Complex movements' }
    ]);

    // Jog controls
    const [jogSpeed, setJogSpeed] = useState<number>(0);
    const jogIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastWheelTime = useRef<number>(0);

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
    const [jumpDistance, setJumpDistance] = useState<number | null>(null);
    const [takeoffPos, setTakeoffPos] = useState<{ x: number, y: number } | null>(null);
    const [landingPos, setLandingPos] = useState<{ x: number, y: number } | null>(null);

    // Track if detection loop is running
    const detectionLoopRunning = useRef(false);
    // Track model loading state
    const [modelLoaded, setModelLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState<string>('');
    // Track if we need to start detection after model loads
    const shouldStartDetection = useRef(false);

    // Enhanced status display with persistence
    const [displayLeftHandStatus, setDisplayLeftHandStatus] = useState<string>('Stationary');
    const [displayRightHandStatus, setDisplayRightHandStatus] = useState<string>('Stationary');
    const [displayJumpStatus, setDisplayJumpStatus] = useState<string>('On Ground');

    // Timers for status persistence
    const leftHandStatusTimer = useRef<NodeJS.Timeout | null>(null);
    const rightHandStatusTimer = useRef<NodeJS.Timeout | null>(null);
    const jumpStatusTimer = useRef<NodeJS.Timeout | null>(null);
    const jumpResetTimer = useRef<NodeJS.Timeout | null>(null);

    // Load HLS.js and Dash.js libraries dynamically
    useEffect(() => {
        const loadLibraries = async () => {
            // Load HLS.js
            if (!window.Hls) {
                const script1 = document.createElement('script');
                script1.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';
                document.head.appendChild(script1);
            }

            // Load Dash.js
            if (!window.dashjs) {
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.dashjs.org/latest/dash.all.min.js';
                document.head.appendChild(script2);
            }
        };

        loadLibraries();
    }, []);

    // Video time update handler
    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }, []);

    // Video metadata loaded handler
    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setCurrentTime(videoRef.current.currentTime);
        }
        console.log("Video metadata loaded");
        updateCanvasSize();
    }, []);

    // Play/pause handlers
    const handlePlay = useCallback(() => {
        setIsPlaying(true);
        handleVideoPlay();
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
        detectionLoopRunning.current = false;
    }, []);

    // Jog control functions
    const startJog = useCallback((speed: number) => {
        setJogSpeed(speed);
        if (jogIntervalRef.current) {
            clearInterval(jogIntervalRef.current);
        }

        if (speed !== 0 && videoRef.current) {
            jogIntervalRef.current = setInterval(() => {
                if (videoRef.current) {
                    const newTime = videoRef.current.currentTime + (speed * 0.1);
                    videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
                }
            }, 100);
        }
    }, [duration]);

    const stopJog = useCallback(() => {
        setJogSpeed(0);
        if (jogIntervalRef.current) {
            clearInterval(jogIntervalRef.current);
            jogIntervalRef.current = null;
        }
    }, []);

    // Mouse wheel handler for scrubbing
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const now = Date.now();

        // Throttle wheel events
        if (now - lastWheelTime.current < 50) return;
        lastWheelTime.current = now;

        if (videoRef.current) {
            const delta = -e.deltaY * 0.1; // Adjust sensitivity
            const newTime = videoRef.current.currentTime + delta;
            videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
        }
    }, [duration]);

    // Timeline marker jump
    const jumpToMarker = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // Add new timeline marker
    const addTimelineMarker = useCallback(() => {
        const newMarker: TimelineMarker = {
            id: Date.now().toString(),
            time: currentTime,
            label: `Marker ${timelineMarkers.length + 1}`,
            description: `Added at ${Math.round(currentTime)}s`
        };
        setTimelineMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time));
    }, [currentTime, timelineMarkers.length]);

    // Load video with appropriate streaming support
    const loadVideoWithStreaming = useCallback((url: string) => {
        if (!videoRef.current) return;

        // Clean up existing players
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (dashPlayerRef.current) {
            dashPlayerRef.current.destroy();
            dashPlayerRef.current = null;
        }

        const video = videoRef.current;
        video.srcObject = null;

        // Determine video type
        if (url.includes('.m3u8')) {
            setVideoType('hls');
            if (window.Hls && window.Hls.isSupported()) {
                hlsRef.current = new window.Hls();
                hlsRef.current.loadSource(url);
                hlsRef.current.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            }
        } else if (url.includes('.mpd')) {
            setVideoType('dash');
            if (window.dashjs) {
                dashPlayerRef.current = window.dashjs.MediaPlayer().create();
                dashPlayerRef.current.initialize(video, url, false);
            }
        } else {
            setVideoType('mp4');
            video.src = url;
        }

        video.load();
        setStream(null);
    }, []);

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

    // Helper function to update status with persistence
    const updateStatusWithPersistence = (
        newStatus: string,
        currentDisplayStatus: string,
        setDisplayStatus: React.Dispatch<React.SetStateAction<string>>,
        timer: React.MutableRefObject<NodeJS.Timeout | null>,
        minDisplayTime: number = 1000
    ) => {
        if (newStatus !== currentDisplayStatus) {
            setDisplayStatus(newStatus);
            if (timer.current) {
                clearTimeout(timer.current);
            }
            timer.current = setTimeout(() => {
                timer.current = null;
            }, minDisplayTime);
        } else if (!timer.current) {
            setDisplayStatus(newStatus);
        }
    };

    // MIDI and pose detection functions (keeping existing functionality)
    const sendMidiNote = (note: number, velocity = 127) => {
        if (midiOutput) {
            try {
                midiOutput.send([0x90, note, velocity]);
                setTimeout(() => {
                    midiOutput.send([0x80, note, 0]);
                }, 100);
            } catch (error) {
                console.warn('MIDI send failed:', error);
            }
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

        if (newDirection !== handMovement.current.direction && newDirection !== 'stationary') {
            handMovement.current.directionChangeCount++;
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
        if (leftAnkle.score < 0.3 || rightAnkle.score < 0.3 || nose.score < 0.3) return;

        const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
        const currentNoseY = nose.y;

        if (groundLevel.current === null) {
            groundLevel.current = avgAnkleY;
        } else {
            if (!isJumping.current) {
                const bodyHeight = avgAnkleY - currentNoseY;
                if (bodyHeight > 100) {
                    groundLevel.current = groundLevel.current * 0.9 + avgAnkleY * 0.1;
                }
            }
        }

        const bodyHeight = Math.abs(avgAnkleY - currentNoseY);
        const dynamicJumpThreshold = Math.max(15, bodyHeight * 0.08);
        const dynamicLandingThreshold = Math.max(8, bodyHeight * 0.04);

        if (!isJumping.current && avgAnkleY < groundLevel.current - dynamicJumpThreshold) {
            isJumping.current = true;
            jumpStartY.current = currentNoseY;
            sendMidiNote(48, 127);
            setTakeoffPos({ x: (leftAnkle.x + rightAnkle.x) / 2, y: avgAnkleY });
            setLandingPos(null);
            setJumpDistance(null);

            if (jumpResetTimer.current) {
                clearTimeout(jumpResetTimer.current);
                jumpResetTimer.current = null;
            }

            updateStatusWithPersistence('Jumping!', displayJumpStatus, setDisplayJumpStatus, jumpStatusTimer, 1500);
        } else if (isJumping.current && avgAnkleY > groundLevel.current - dynamicLandingThreshold) {
            isJumping.current = false;

            const landingX = (leftAnkle.x + rightAnkle.x) / 2;
            const landingY = avgAnkleY;

            setJumpEvents(prev => [...prev, {
                x: landingX,
                y: landingY,
                timestamp: Date.now(),
                fadeOpacity: 1.0
            }]);
            sendMidiNote(36, 127);

            setLandingPos({ x: landingX, y: landingY });
            if (takeoffPos) {
                const dx = landingX - takeoffPos.x;
                const dy = landingY - takeoffPos.y;
                const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
                setJumpDistance(distance);

                let direction = 'vertical';
                if (Math.abs(dx) > Math.abs(dy)) {
                    direction = dx > 0 ? 'right' : 'left';
                } else if (Math.abs(dy) > 5) {
                    direction = dy > 0 ? 'down' : 'up';
                }

                const jumpInfo = distance > 10 ? `Landed! (${distance}px ${direction})` : 'Landed!';
                updateStatusWithPersistence(jumpInfo, displayJumpStatus, setDisplayJumpStatus, jumpStatusTimer, 2000);

                jumpResetTimer.current = setTimeout(() => {
                    updateStatusWithPersistence('On Ground', displayJumpStatus, setDisplayJumpStatus, jumpStatusTimer, 500);
                    setJumpDistance(null);
                    setTakeoffPos(null);
                    setLandingPos(null);
                    jumpResetTimer.current = null;
                }, 2500);
            }
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
        const fadeDuration = 3000;

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

                ctx.font = '12px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText('LAND', jumpEvent.x, jumpEvent.y + 4);
                ctx.restore();
            }
        });

        setJumpEvents(prev => prev.filter(event => now - event.timestamp < fadeDuration));
    };

    // Main pose detection loop
    const detectPose = async () => {
        if (detectorRef.current && videoRef.current && canvasRef.current && !videoRef.current.paused) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    const videoRect = video.getBoundingClientRect();
                    canvas.style.position = 'absolute';
                    canvas.style.pointerEvents = 'none';
                    canvas.style.left = `${videoRect.left - (containerRef.current?.getBoundingClientRect().left || 0)}px`;
                    canvas.style.top = `${videoRect.top - (containerRef.current?.getBoundingClientRect().top || 0)}px`;
                    canvas.style.width = `${videoRect.width}px`;
                    canvas.style.height = `${videoRect.height}px`;

                    if (canvas.width !== Math.round(videoRect.width) || canvas.height !== Math.round(videoRect.height)) {
                        canvas.width = Math.round(videoRect.width);
                        canvas.height = Math.round(videoRect.height);
                    }

                    const poses = await detectorRef.current.estimatePoses(video);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const scaleX = videoRect.width / video.videoWidth;
                    const scaleY = videoRect.height / video.videoHeight;
                    ctx.save();
                    ctx.scale(scaleX, scaleY);

                    poses.forEach(pose => {
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

                        const leftWrist = pose.keypoints.find(k => k.name === 'left_wrist');
                        const rightWrist = pose.keypoints.find(k => k.name === 'right_wrist');

                        if (leftWrist && leftWrist.score && leftWrist.score > 0.5) {
                            const leftStatus = calculateMovement(
                                { x: leftWrist.x, y: leftWrist.y },
                                leftHandMovement,
                                'left'
                            );
                            updateStatusWithPersistence(leftStatus, displayLeftHandStatus, setDisplayLeftHandStatus, leftHandStatusTimer);
                        }

                        if (rightWrist && rightWrist.score && rightWrist.score > 0.5) {
                            const rightStatus = calculateMovement(
                                { x: rightWrist.x, y: rightWrist.y },
                                rightHandMovement,
                                'right'
                            );
                            updateStatusWithPersistence(rightStatus, displayRightHandStatus, setDisplayRightHandStatus, rightHandStatusTimer);
                        }

                        detectJump(pose.keypoints);
                        drawSkeleton(pose.keypoints, 0.5, ctx);
                    });

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

    const loadModel = async () => {
        try {
            console.log("Loading pose detection model...");
            setLoadingError('');

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

            if (shouldStartDetection.current) {
                shouldStartDetection.current = false;
                startDetectionLoop();
            }
        } catch (err) {
            console.error("Error loading model: ", err);
            setLoadingError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
                videoRef.current.addEventListener('loadedmetadata', () => {
                    videoRef.current?.play().catch(console.error);
                });
            }
            setStream(mediaStream);
            setVideoType('webcam');
        } catch (err) {
            console.error("Error accessing webcam: ", err);
            alert(`Camera access failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

        setDisplayLeftHandStatus('Stationary');
        setDisplayRightHandStatus('Stationary');
        setDisplayJumpStatus('On Ground');

        if (leftHandStatusTimer.current) clearTimeout(leftHandStatusTimer.current);
        if (rightHandStatusTimer.current) clearTimeout(rightHandStatusTimer.current);
        if (jumpStatusTimer.current) clearTimeout(jumpStatusTimer.current);
        if (jumpResetTimer.current) clearTimeout(jumpResetTimer.current);

        leftHandStatusTimer.current = null;
        rightHandStatusTimer.current = null;
        jumpStatusTimer.current = null;
        jumpResetTimer.current = null;
    };

    const handleCanPlay = () => {
        console.log("Video can play, model loaded:", modelLoaded);
        updateCanvasSize();

        if (modelLoaded && detectorRef.current) {
            startDetectionLoop();
        } else {
            shouldStartDetection.current = true;
            console.log("Waiting for model to load before starting detection");
        }
    };

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

    const startDetectionLoop = () => {
        if (detectionLoopRunning.current || !modelLoaded || !detectorRef.current) {
            return;
        }

        console.log("Starting detection loop");
        detectionLoopRunning.current = true;

        setTimeout(() => {
            updateCanvasSize();
            detectPose();
        }, 100);
    };

    const handleVideoPlay = () => {
        if (!detectionLoopRunning.current) {
            detectionLoopRunning.current = true;
            requestAnimationFrame(detectPose);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            resetTrackingState();
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            loadVideoWithStreaming(url);
        }
    };

    // Format time for display
    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Add wheel event listener for scrubbing
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    useEffect(() => {
        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const browser = detectBrowser();
        setBrowserInfo(browser);
        console.log(`Detected browser: ${browser}`);

        loadModel();
        initMidi();
    }, []);

    useEffect(() => {
        return () => {
            if (leftHandStatusTimer.current) clearTimeout(leftHandStatusTimer.current);
            if (rightHandStatusTimer.current) clearTimeout(rightHandStatusTimer.current);
            if (jumpStatusTimer.current) clearTimeout(jumpStatusTimer.current);
            if (jumpResetTimer.current) clearTimeout(jumpResetTimer.current);
            if (jogIntervalRef.current) clearInterval(jogIntervalRef.current);

            // Cleanup streaming players
            if (hlsRef.current) hlsRef.current.destroy();
            if (dashPlayerRef.current) dashPlayerRef.current.destroy();
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVideoEnd = () => {
            detectionLoopRunning.current = false;
            setIsPlaying(false);
        };

        const handleVideoError = (_e: Event) => {
            detectionLoopRunning.current = false;
            setIsPlaying(false);
        };

        video.addEventListener('ended', handleVideoEnd);
        video.addEventListener('error', handleVideoError);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);

        return () => {
            video.removeEventListener('ended', handleVideoEnd);
            video.removeEventListener('error', handleVideoError);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [handlePlay, handlePause, handleTimeUpdate, handleLoadedMetadata]);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Enhanced Kasm Jog with Professional Video Controls</h1>

            {/* Browser and Status Info */}
            <div style={{
                textAlign: 'center',
                margin: '10px 0',
                fontSize: '12px',
                color: '#666'
            }}>
                Browser: {browserInfo} | MIDI: {midiSupported ? (midiOutput ? 'Connected' : 'Supported') : 'Not Supported'} | Video Type: {videoType.toUpperCase()}
            </div>

            {!modelLoaded && !loadingError && <p>Loading pose detection model...</p>}
            {loadingError && <p style={{ color: 'red' }}>Error: {loadingError}</p>}

            {/* Control Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={initMidi} disabled={!!midiOutput || !midiSupported}>
                        {midiOutput ? 'MIDI Connected' : midiSupported ? 'Connect MIDI' : 'MIDI Unsupported'}
                    </button>
                    <button onClick={startCamera} disabled={!!stream}>
                        {stream ? 'Webcam On' : 'Start Webcam'}
                    </button>
                    <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#007acc', color: 'white', borderRadius: '4px' }}>
                        Upload Video
                        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => loadVideoWithStreaming('https://kasmsdk.github.io/public/theremin.webm')} disabled={!modelLoaded}>
                        Theremin Example
                    </button>
                </div>

                {/* URL Input for HLS/DASH streams */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Enter HLS (.m3u8) or DASH (.mpd) URL"
                        style={{ width: '300px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const url = (e.target as HTMLInputElement).value;
                                if (url) {
                                    resetTrackingState();
                                    loadVideoWithStreaming(url);
                                }
                            }
                        }}
                    />
                    <button onClick={() => {
                        const input = document.querySelector('input[placeholder*="HLS"]') as HTMLInputElement;
                        if (input?.value) {
                            resetTrackingState();
                            loadVideoWithStreaming(input.value);
                        }
                    }}>Load Stream</button>
                </div>

                {/* Video Container */}
                <div ref={containerRef} style={{
                    position: 'relative',
                    width: '640px',
                    height: '480px',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    background: '#000'
                }}>
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '6px',
                            display: 'block',
                            objectFit: 'contain'
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            pointerEvents: 'none',
                            borderRadius: '6px'
                        }}
                    />
                </div>

                {/* Professional Video Controls */}
                <div style={{
                    width: '640px',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #ccc'
                }}>
                    {/* Transport Controls */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <button onClick={() => videoRef.current && (videoRef.current.currentTime = 0)}>⏮</button>
                        <button
                            onMouseDown={() => startJog(-2)}
                            onMouseUp={stopJog}
                            onMouseLeave={stopJog}
                        >⏪</button>
                        <button
                            onMouseDown={() => startJog(-0.5)}
                            onMouseUp={stopJog}
                            onMouseLeave={stopJog}
                        >◀</button>
                        <button onClick={() => videoRef.current && (isPlaying ? videoRef.current.pause() : videoRef.current.play())}>
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button
                            onMouseDown={() => startJog(0.5)}
                            onMouseUp={stopJog}
                            onMouseLeave={stopJog}
                        >▶</button>
                        <button
                            onMouseDown={() => startJog(2)}
                            onMouseUp={stopJog}
                            onMouseLeave={stopJog}
                        >⏩</button>
                        <button onClick={() => videoRef.current && (videoRef.current.currentTime = duration)}>⏭</button>
                    </div>

                    {/* Timeline Scrubber */}
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => {
                                if (videoRef.current) {
                                    videoRef.current.currentTime = parseFloat(e.target.value);
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                            <span>{formatTime(currentTime)}</span>
                            <span>Jog Speed: {jogSpeed}x</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Speed and Volume Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <label>Speed: </label>
                            <select
                                value={playbackRate}
                                onChange={(e) => {
                                    const rate = parseFloat(e.target.value);
                                    setPlaybackRate(rate);
                                    if (videoRef.current) videoRef.current.playbackRate = rate;
                                }}
                            >
                                <option value={0.25}>0.25x</option>
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={1.25}>1.25x</option>
                                <option value={1.5}>1.5x</option>
                                <option value={2}>2x</option>
                            </select>
                        </div>
                        <div>
                            <label>Volume: </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => {
                                    const vol = parseFloat(e.target.value);
                                    setVolume(vol);
                                    if (videoRef.current) videoRef.current.volume = vol;
                                }}
                                style={{ width: '100px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline Markers Table */}
                <div style={{
                    width: '640px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid #ddd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0 }}>Timeline Markers</h3>
                        <button
                            onClick={addTimelineMarker}
                            style={{
                                padding: '6px 12px',
                                background: '#007acc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Add Marker
                        </button>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ddd' }}>Time</th>
                                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ddd' }}>Label</th>
                                <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #ddd' }}>Description</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {timelineMarkers.map((marker) => (
                                <tr
                                    key={marker.id}
                                    style={{
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        background: Math.abs(currentTime - marker.time) < 1 ? '#e3f2fd' : 'transparent'
                                    }}
                                    onClick={() => jumpToMarker(marker.time)}
                                >
                                    <td style={{ padding: '8px', borderRight: '1px solid #eee' }}>
                                        {formatTime(marker.time)}
                                    </td>
                                    <td style={{ padding: '8px', borderRight: '1px solid #eee' }}>
                                        {marker.label}
                                    </td>
                                    <td style={{ padding: '8px', borderRight: '1px solid #eee' }}>
                                        {marker.description}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTimelineMarkers(prev => prev.filter(m => m.id !== marker.id));
                                            }}
                                            style={{
                                                padding: '2px 8px',
                                                background: '#ff4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Movement Status Display */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                <div style={{
                    width: '640px',
                    padding: '16px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    textAlign: 'left',
                    lineHeight: '1.6',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}>
                    <div style={{ marginBottom: '12px', minHeight: '20px' }}>
                        <strong>Left Hand:</strong> {displayLeftHandStatus}
                    </div>
                    <div style={{ marginBottom: '12px', minHeight: '20px' }}>
                        <strong>Right Hand:</strong> {displayRightHandStatus}
                    </div>
                    <div style={{ minHeight: '20px' }}>
                        <strong>Jump Status:</strong> <span style={{
                        color: displayJumpStatus === 'Jumping!' ? '#ff8888' :
                            displayJumpStatus.startsWith('Landed!') ? '#88ff88' : '#fff',
                        fontWeight: 'bold'
                    }}>
                            {displayJumpStatus}
                        </span>
                        {jumpDistance !== null && landingPos && (
                            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                Distance jumped: <strong>{jumpDistance}px</strong><br />
                                Landed at: <strong>x={Math.round(landingPos.x)}, y={Math.round(landingPos.y)}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Jog;
