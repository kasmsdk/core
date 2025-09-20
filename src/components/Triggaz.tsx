import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

const Triggaz: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const [midiOutput, setMidiOutput] = useState<WebMidi.MIDIOutput | null>(null);
    const lastYRef = useRef<number | null>(null);

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
        } catch (err)
        {
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

    useEffect(() => {
        loadModel();
    }, []);

    const detectPose = async () => {
        if (detectorRef.current && videoRef.current && canvasRef.current && !videoRef.current.paused) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.style.width = `${video.clientWidth}px`;
                canvas.style.height = `${video.clientHeight}px`;

                const poses = await detectorRef.current.estimatePoses(video);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                poses.forEach(pose => {
                    const nose = pose.keypoints.find(k => k.name === 'nose');
                    if (nose && nose.score && nose.score > 0.5) {
                        if (lastYRef.current !== null) {
                            const deltaY = nose.y - lastYRef.current;
                            if (deltaY < -10) { // Jumping up
                                sendMidiNote(60); // C4
                            }
                        }
                        lastYRef.current = nose.y;
                    }

                    drawSkeleton(pose.keypoints, 0.5, ctx);
                });
            }
            requestAnimationFrame(detectPose);
        }
    };

    const startDetectionLoop = () => {
        if (videoRef.current) {
            detectPose();
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

        const drawSegment = (startName: string, endName: string, color: string) => {
            const start = keypointMap.get(startName);
            const end = keypointMap.get(endName);
            if (start && end && start.score && end.score && start.score > minConfidence && end.score > minConfidence) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
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
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#FFFFFF'; // White
                ctx.fill();
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
                setStream(null); // Stop webcam stream if it's running
            }
        }
    };

    return (
        <div className="kasm-landing-container">
            <h1>Kasm Triggaz</h1>
            <p>Pose detection with webcam or video file to trigger MIDI events</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                <button className="kasm-demo-btn" onClick={initMidi} disabled={!!midiOutput}>
                    {midiOutput ? 'MIDI Connected' : 'Connect MIDI'}
                </button>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="kasm-demo-btn" onClick={startCamera} disabled={!!stream}>
                        {stream ? 'Webcam On' : 'Start Webcam'}
                    </button>
                    <label className="kasm-demo-btn" style={{ display: 'inline-block', cursor: 'pointer', margin: 0 }}>
                        Upload Video
                        <input type="file" accept="video/mp4" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                </div>
                <div className="kasm-sunken-panel">
                    <video ref={videoRef} autoPlay playsInline onLoadedMetadata={startDetectionLoop} style={{ width: '640px', height: '480px', borderRadius: '8px', display: 'block', objectFit: 'cover' }} />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '640px', height: '480px', pointerEvents: 'none', borderRadius: '8px' }} />
                </div>
            </div>
        </div>
    );
};

export default Triggaz;
