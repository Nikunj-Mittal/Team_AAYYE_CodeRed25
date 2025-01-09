import React, { useEffect, useRef, useState } from 'react';

function HandGestureControl({ onGestureDetected, enabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const [lastGesture, setLastGesture] = useState(null);
  const [gestureStartTime, setGestureStartTime] = useState(null);
  const [gestureTriggered, setGestureTriggered] = useState(false);
  const GESTURE_HOLD_TIME = 1000; // Changed to 1 second
  const successSound = new Audio('/success.mp3'); // Load success sound from public folder

  useEffect(() => {
    if (!enabled) return;

    let camera = null;

    const initializeCamera = async () => {
      try {
        handsRef.current = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        await handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7, // Increased from 0.5 to 0.7 for better accuracy
          minTrackingConfidence: 0.5
        });

        await handsRef.current.onResults(onResults);

        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240
        });

        await camera.start();
      } catch (error) {
        console.error('Error initializing camera:', error);
      }
    };

    const detectGesture = (landmarks) => {
      // Convert landmarks to the format similar to the Python code
      const lmList = landmarks.map((lm, id) => {
        return [
          id,
          Math.floor(lm.x * canvasRef.current.width),
          Math.floor(lm.y * canvasRef.current.height)
        ];
      });

      const tipIds = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky tips
      const fingerList = [];

      if (lmList.length === 21) { // Ensure we have all landmarks
        // Thumb detection with hand flipping logic
        if (lmList[12][1] > lmList[20][1]) { // Right hand
          if (lmList[tipIds[0]][1] > lmList[tipIds[0]-1][1]) {
            fingerList.push(1);
          } else {
            fingerList.push(0);
          }
        } else { // Left hand
          if (lmList[tipIds[0]][1] < lmList[tipIds[0]-1][1]) {
            fingerList.push(1);
          } else {
            fingerList.push(0);
          }
        }

        // Other fingers
        for (let id = 1; id < 5; id++) {
          if (lmList[tipIds[id]][2] < lmList[tipIds[id]-2][2]) {
            fingerList.push(1);
          } else {
            fingerList.push(0);
          }
        }

        return fingerList.filter(Boolean).length;
      }
      return 0;
    };

    const onResults = (results) => {
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the video frame
      ctx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const gesture = detectGesture(landmarks);

        // Update gesture state
        if (gesture === lastGesture && !gestureTriggered) {
          if (!gestureStartTime) {
            setGestureStartTime(Date.now());
          } else if (Date.now() - gestureStartTime >= GESTURE_HOLD_TIME) {
            onGestureDetected(gesture);
            setGestureTriggered(true);
            setGestureStartTime(null);
            successSound.play().catch(e => console.error('Error playing sound:', e));
          }
        } else if (gesture !== lastGesture) {
          setLastGesture(gesture);
          setGestureStartTime(null);
          setGestureTriggered(false);
        }

        // Draw hand landmarks with connections
        const drawingUtils = window;
        drawingUtils.drawConnectors(
          ctx,
          landmarks,
          window.HAND_CONNECTIONS,
          { color: '#39ff14', lineWidth: 2 }
        );
        drawingUtils.drawLandmarks(
          ctx,
          landmarks,
          { color: '#000000', lineWidth: 1, radius: 3 }
        );

        // Draw gesture number and progress bar
        if (gesture !== null) {
          // Draw number (smaller and flipped)
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '40px Arial'; // Smaller font size
          ctx.scale(-1, 1); // Flip text horizontally
          ctx.fillText(
            gesture.toString(),
            -35, // Adjust x position for flipped context
            canvasRef.current.height - 20
          );
          ctx.scale(-1, 1); // Reset scale for other drawings
        }

        // Draw progress bar
        if (gestureStartTime && !gestureTriggered) {
          const progress = Math.min(
            (Date.now() - gestureStartTime) / GESTURE_HOLD_TIME,
            1
          );
          
          // Progress bar background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, canvasRef.current.width, 20);
          
          // Progress bar
          const gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width * progress, 0);
          gradient.addColorStop(0, '#00FFC8');
          gradient.addColorStop(1, '#00E6B5');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasRef.current.width * progress, 20);
          
          // Progress text
          ctx.fillStyle = '#000000';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.scale(-1, 1);
          ctx.fillText(
            `${Math.round(progress * 100)}%`,
            canvasRef.current.width / 2,
            15
          );
        }
      }
      ctx.restore();
    };

    initializeCamera();

    return () => {
      if (camera) {
        camera.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [enabled, onGestureDetected, lastGesture, gestureStartTime, gestureTriggered]);

  if (!enabled) return null;

  return (
    <div className="hand-gesture-control">
      <video
        ref={videoRef}
        style={{ transform: 'scaleX(-1)' }}
        width="320"
        height="240"
        autoPlay
        playsInline
      />
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          transform: 'scaleX(-1)', // Mirror the canvas
          zIndex: 1000
        }}
      />
    </div>
  );
}

export default HandGestureControl; 