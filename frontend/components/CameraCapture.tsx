'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-webcam to avoid SSR hydration issues
const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

type WebcamInstance = typeof import('react-webcam')['default'];

interface CameraCaptureProps {
  onCapture: (imageSrc: string, imageBlob: Blob) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function CameraCapture({ onCapture, onError, className = '' }: CameraCaptureProps) {
  const webcamRef = useRef<InstanceType<WebcamInstance> | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // After mount, if permission hasn't been resolved within a short timeout,
  // show a manual "Enable Camera" button to trigger getUserMedia via user gesture.
  useEffect(() => {
    if (!isClient) return;
    const t = setTimeout(() => {
      if (hasPermission === null) setShowManualPrompt(true);
    }, 2000);
    return () => clearTimeout(t);
  }, [isClient, hasPermission]);

  const videoConstraints: MediaStreamConstraints['video'] = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
  };

  const requestPermissionManually = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      // Immediately stop tracks; react-webcam will request its own stream
      stream.getTracks().forEach((t) => t.stop());
      setHasPermission(true);
      setShowManualPrompt(false);
    } catch (error: any) {
      setHasPermission(false);
      let msg = 'Camera access denied. Please allow camera permissions to continue.';
      if (error?.name === 'NotAllowedError') {
        msg = "Camera access was blocked. Click the camera icon in your browser's address bar and allow access.";
      } else if (error?.name === 'NotFoundError') {
        msg = 'No camera found. Please connect a camera and try again.';
      }
      onError?.(msg);
    }
  };

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
  }, []);

  const handleUserMediaError = useCallback((error: any) => {
    console.error('Camera access error:', error);
    setHasPermission(false);
    
    // Provide more specific error messages based on the error
    let errorMessage = 'Camera access denied. Please allow camera permissions to continue.';
    if (error.name === 'NotAllowedError') {
      errorMessage = "Camera access was blocked. Please click the camera icon in your browser's address bar and allow camera access.";
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and try again.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is being used by another application. Please close other apps using the camera.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera constraints not supported. Please try with a different camera.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Camera not supported in this browser. Please try Chrome, Firefox, or Safari.';
    }
    
    onError?.(errorMessage);
  }, [onError]);

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) {
      onError?.('Camera not ready. Please try again.');
      return;
    }

    setIsCapturing(true);
    
    try {
      // Capture the image as base64
      // @ts-expect-error react-webcam instance typing
      const imageSrc = webcamRef.current.getScreenshot?.();
      
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Convert base64 to blob for API upload
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      onCapture(imageSrc, blob);
    } catch (error) {
      console.error('Error capturing photo:', error);
      onError?.('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, onError]);

  // Guard against SSR/hydration glitches by only rendering on the client
  if (!isClient) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border-2 border-gray-300 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Initializing...</h3>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border-2 border-red-300 bg-red-50 rounded-lg ${className}`}>
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
        <div className="text-red-600 text-center space-y-3 mb-4">
          <p className="font-medium">To enable camera access:</p>
          <div className="text-sm space-y-2 bg-white/50 p-4 rounded border">
            <p><strong>Chrome/Edge:</strong> Click the camera icon 📷 in the address bar</p>
            <p><strong>Firefox:</strong> Click the shield icon and allow camera</p>
            <p><strong>Safari:</strong> Go to Safari → Settings → Websites → Camera</p>
          </div>
          <p className="text-xs">If accessing over HTTP (not HTTPS), camera may not work in some browsers.</p>
        </div>
        <div className="space-y-2">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Try Again
          </button>
          <button 
            onClick={requestPermissionManually}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📷 Request Permission
          </button>
        </div>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border-2 border-gray-300 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Initializing Camera...</h3>
        <div className="text-gray-600 text-center space-y-3">
          <p>Please allow camera access when prompted by your browser.</p>
          <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-800">💡 Tip:</p>
            <p className="text-blue-700">Look for a camera permission popup, usually at the top of your browser window.</p>
          </div>
          <p className="text-xs text-gray-500">
            Having issues? Make sure you're using Chrome, Firefox, or Safari with camera permissions enabled.
          </p>
        </div>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
        {showManualPrompt && (
          <div className="mt-4">
            <button
              onClick={requestPermissionManually}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📷 Enable Camera
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Camera Preview */}
      <div className="relative rounded-lg overflow-hidden border-4 border-blue-200 bg-black">
        <Webcam
          // @ts-expect-error dynamic webcam typing
          ref={webcamRef}
          audio={false}
          width={640}
          height={480}
          videoConstraints={videoConstraints}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.8}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="block"
          mirrored
          playsInline
        />
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-96 border-4 border-white/50 rounded-full flex items-center justify-center">
            <div className="text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
              Position your face here
            </div>
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <button
        onClick={capturePhoto}
        disabled={isCapturing || hasPermission !== true}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
      >
        {isCapturing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span>Capturing...</span>
          </>
        ) : (
          <>
            <span>📸</span>
            <span>Capture Photo</span>
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 max-w-md">
        <p className="mb-2">
          <strong>Tips for best results:</strong>
        </p>
        <ul className="text-left space-y-1">
          <li>• Look directly at the camera</li>
          <li>• Ensure good lighting on your face</li>
          <li>• Remove glasses if possible</li>
          <li>• Keep a neutral expression</li>
        </ul>
      </div>
    </div>
  );
}
