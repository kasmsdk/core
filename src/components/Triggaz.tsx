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

    useEffect(() => {
        const detectPose = async () => {
            if (detectorRef.current && videoRef.current && canvasRef.current && !videoRef.current.paused) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

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

        const videoElement = videoRef.current;
        let animationFrameId: number;

        const detectionLoop = async () => {
            await detectPose();
            animationFrameId = requestAnimationFrame(detectionLoop);
        };

        const startDetection = () => {
            if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                detectionLoop();
            }
        };

        if (videoElement) {
            videoElement.addEventListener('loadedmetadata', startDetection);
        }

        return () => {
            if (videoElement) {
                videoElement.removeEventListener('loadedmetadata', startDetection);
            }
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream, midiOutput]);

    const KEYPOINT_EDGE_INDS_TO_COLOR = {
        'nose-left_eye': 'm',
        'nose-right_eye': 'c',
        'left_eye-left_ear': 'm',
        'right_eye-right_ear': 'c',
        'nose-left_shoulder': 'm',
        'nose-right_shoulder': 'c',
        'left_shoulder-left_elbow': 'm',
        'left_elbow-left_wrist': 'm',
        'right_shoulder-right_elbow': 'c',
        'right_elbow-right_wrist': 'c',
        'left_shoulder-right_shoulder': 'y',
        'left_shoulder-left_hip': 'm',
        'right_shoulder-right_hip': 'c',
        'left_hip-right_hip': 'y',
        'left_hip-left_knee': 'm',
        'left_knee-left_ankle': 'm',
        'right_hip-right_knee': 'c',
        'right_knee-right_ankle': 'c'
    };

    const drawSkeleton = (keypoints: poseDetection.Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D) => {
        const keypointMap = new Map(keypoints.map(keypoint => [keypoint.name, keypoint]));

        for (const [edge, color] of Object.entries(KEYPOINT_EDGE_INDS_TO_COLOR)) {
            const [startName, endName] = edge.split('-');
            const start = keypointMap.get(startName);
            const end = keypointMap.get(endName);

            if (start && end && start.score && end.score && start.score > minConfidence && end.score > minConfidence) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        keypoints.forEach(keypoint => {
            if (keypoint.score && keypoint.score > 0.5) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
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
                    <video ref={videoRef} autoPlay playsInline style={{ width: '640px', height: '480px', borderRadius: '8px', display: 'block' }} />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '640px', height: '480px', pointerEvents: 'none', borderRadius: '8px' }} />
                </div>
            </div>
        </div>
    );
};

export default Triggaz;
