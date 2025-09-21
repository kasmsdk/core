import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

const Triggaz: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const [midiOutput, setMidiOutput] = useState<WebMidi.MIDIOutput | null>(null);
    const lastYRef = useRef<number | null>(null);
    // Track if detection loop is running
    const detectionLoopRunning = useRef(false);

    const initMidi = async () => {
        if (navigator.requestMIDIAccess) {
            try {
                const midiAccess = await navigator.requestMIDIAccess();
                const outputs = midiAccess.outputs.values();
                const output = outputs.next().value;
                if (output) {
                    setMidiOutput(output);
                } else {
                    console.warn("No MIDI output devices found.");
                }
            } catch (err) {
                console.error("Could not access MIDI devices.", err);
            }
        } else {
            console.error("Web MIDI API is not supported in this browser.");
        }
    };

    const sendMidiNote = (note: number, velocity = 127) => {
        if (midiOutput) {
            midiOutput.send([0x90, note, velocity]); // Note on
            setTimeout(() => {
                midiOutput.send([0x80, note, 0]); // Note off
            }, 100);
        }
    };

    const loadModel = async () => {
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
            const detector = await poseDetection.createDetector(model, detectorConfig);
            detectorRef.current = detector;
        } catch (err) {
            console.error("Error loading model: ", err);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            setStream(mediaStream);
        } catch (err) {
            console.error("Error accessing webcam: ", err);
        }
    };

    const loadDemoMovie = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = 'https://kasmsdk.github.io/public/theremin.webm';
            videoRef.current.play();
            setStream(null); // Stop webcam stream if it's running
        }
    };

    const loadDemoMovie2 = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = 'https://kasmsdk.github.io/public/kasm_pose_airguitar.webm';
            videoRef.current.play();
            setStream(null); // Stop webcam stream if it's running
        }
    };

    const loadDemoMovie3 = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = 'https://kasmsdk.github.io/public/kasm_pose_jump.webm';
            videoRef.current.play();
            setStream(null); // Stop webcam stream if it's running
        }
    };

    const loadDemoMovie4 = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = 'https://kasmsdk.github.io/public/kasm_pose_dance.webm';
            videoRef.current.play();
            setStream(null); // Stop webcam stream if it's running
        }
    };

    const loadDemoMovie5 = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = 'https://kasmsdk.github.io/public/Kasm_Triggaz_Pose_Test.mp4';
            videoRef.current.play();
            setStream(null);
        }
    };

    // Ensure updateCanvasSize is always called after video loads
    const handleLoadedMetadata = () => {
        updateCanvasSize();
        startDetectionLoop();
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

            // Use videoRect for alignment
            const videoRect = video.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            // Use videoRect for canvas overlay
            canvas.style.position = 'absolute';
            canvas.style.pointerEvents = 'none';
            canvas.style.left = `${videoRect.left - containerRect.left}px`;
            canvas.style.top = `${videoRect.top - containerRect.top}px`;
            canvas.style.width = `${videoRect.width}px`;
            canvas.style.height = `${videoRect.height}px`;
        }
    };

    // Only start detection loop if not already running
    const startDetectionLoop = () => {
        if (detectionLoopRunning.current) return;
        detectionLoopRunning.current = true;
        // Wait for video to be ready and canvas to be sized
        setTimeout(() => {
            updateCanvasSize();
            detectPose();
        }, 50);
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

        // Calculate scaling factor based on video resolution
        // Base scale for 640x480, then scale up proportionally
        const baseResolution = 640 * 480;
        const currentResolution = ctx.canvas.width * ctx.canvas.height;
        const scaleFactor = Math.max(1, Math.sqrt(currentResolution / baseResolution));

        // Scale line width and circle radius based on resolution
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

        BODY_PARTS.left_arm.forEach(segment => drawSegment(segment[0], segment[1], '#FF0000')); // Red
        BODY_PARTS.right_arm.forEach(segment => drawSegment(segment[0], segment[1], '#00FF00')); // Green
        BODY_PARTS.left_leg.forEach(segment => drawSegment(segment[0], segment[1], '#FF0000')); // Red
        BODY_PARTS.right_leg.forEach(segment => drawSegment(segment[0], segment[1], '#00FF00')); // Green
        BODY_PARTS.torso.forEach(segment => drawSegment(segment[0], segment[1], '#FFFF00')); // Yellow
        BODY_PARTS.face.forEach(segment => drawSegment(segment[0], segment[1], '#0000FF')); // Blue

        keypoints.forEach(keypoint => {
            if (keypoint.score && keypoint.score > minConfidence) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, circleRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#FFFFFF'; // White
                ctx.fill();
                // Add a colored border for better visibility
                ctx.strokeStyle = '#000000'; // Black border
                ctx.lineWidth = Math.max(1, Math.round(scaleFactor));
                ctx.stroke();
            }
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.src = url;
                videoRef.current.play();
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

    useEffect(() => {
        loadModel();
    }, []);

    return (
        <div className="kasm-landing-container">
            <h1>Kasm Triggaz</h1>
            <p>Pose detection with webcam or video file to trigger MIDI events</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="kasm-demo-btn" onClick={initMidi} disabled={!!midiOutput} style={{ display: 'none' }}>
                        {midiOutput ? 'MIDI Connected' : 'Connect MIDI'}
                    </button>
                    <button className="kasm-demo-btn" onClick={startCamera} disabled={!!stream}>
                        {stream ? 'Webcam On' : 'Start Webcam'}
                    </button>
                    <label className="kasm-demo-btn">
                        Upload Video
                        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie}>
                        Theremin Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie2}>
                        Air Guitar Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie3}>
                        Jumping Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie4}>
                        Dance Example
                    </button>
                    <button className="kasm-demo-btn" onClick={loadDemoMovie5}>
                        Triggaz Pose Test
                    </button>
                </div>
                <div className="kasm-sunken-panel" ref={containerRef} style={{ position: 'relative', width: '640px', height: '480px' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        onLoadedMetadata={handleLoadedMetadata}
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
        </div>
    );
};

export default Triggaz;
