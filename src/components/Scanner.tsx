import {BrowserMultiFormatReader} from '@zxing/browser';
import {useEffect, useRef} from 'react';
import {normalizeISBN} from '../utils/scannerUtils';

interface ScannerProps {
  scanning: boolean;
  onScanned: (isbn: string) => void;
  onStatusChange: (status: string) => void;
  onCameraPermissionChange: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
  onCameraChange: (cameraId: string) => void;
  onCamerasDetected: (cameras: MediaDeviceInfo[]) => void;
}

export default function Scanner({
  scanning,
  onScanned,
  onStatusChange,
  onCameraPermissionChange,
  availableCameras,
  selectedCameraId,
  onCameraChange,
  onCamerasDetected,
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<any>(null);

  // Check camera permissions on load
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Debug information
        console.log('Environment check:', {
          protocol: location.protocol,
          hostname: location.hostname,
          userAgent: navigator.userAgent,
          hasMediaDevices: !!navigator.mediaDevices,
          hasPermissions: !!navigator.permissions,
        });

        if (navigator.permissions) {
          const permission = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          console.log('Camera permission state:', permission.state);
          onCameraPermissionChange(permission.state);

          permission.onchange = () => {
            console.log('Camera permission changed to:', permission.state);
            onCameraPermissionChange(permission.state);
          };
        } else {
          console.log('Permissions API not available');
          onCameraPermissionChange('unknown');
        }
      } catch (e) {
        console.warn('Could not check camera permission:', e);
        onCameraPermissionChange('unknown');
      }
    };

    checkCameraPermission();
  }, [onCameraPermissionChange]);

  // Start/stop camera scanner
  useEffect(() => {
    if (!scanning) return;
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    const start = async () => {
      try {
        // Check if we're on HTTPS or localhost
        if (
          location.protocol !== 'https:' &&
          location.hostname !== 'localhost' &&
          location.hostname !== '127.0.0.1'
        ) {
          onStatusChange('Camera requires HTTPS. Please use https:// or localhost');
          return;
        }

        // Request camera permission first
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          return;
        }

        // Use the standard MediaDevices API to enumerate cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        console.log('Available cameras:', videoDevices);
        onCamerasDetected(videoDevices);

        let deviceId = selectedCameraId;

        // If no camera selected, use the second camera (back camera) if available, otherwise first
        if (!deviceId && videoDevices.length > 0) {
          deviceId = videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0].deviceId;
        }

        if (!deviceId) {
          onStatusChange('No camera found. Please check permissions.');
          return;
        }

        const selectedCamera = videoDevices.find((d) => d.deviceId === deviceId);
        console.log('Selected camera:', selectedCamera?.label || `Camera ${deviceId.slice(0, 8)}`);

        onStatusChange('Starting camera...');
        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              const text = result.getText();
              if (text) {
                handleScanned(text);
              }
            }
          }
        );
        scannerControlsRef.current = controls;
        onStatusChange('Scanner active - Point camera at barcode');
      } catch (e: any) {
        console.error('Camera error:', e);
        if (e.name === 'NotAllowedError') {
          onCameraPermissionChange('denied');
          onStatusChange('Camera permission denied. Please allow camera access and try again.');
        } else if (e.name === 'NotFoundError') {
          onStatusChange('No camera found. Please connect a camera and try again.');
        } else if (e.name === 'NotSupportedError') {
          onStatusChange('Camera not supported. Please use HTTPS or localhost.');
        } else {
          onStatusChange('Camera error: ' + (e?.message || e));
        }
      }
    };

    start();
    return () => {
      try {
        if (scannerControlsRef.current) {
          scannerControlsRef.current.stop();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, selectedCameraId]);

  async function requestCameraPermission() {
    try {
      onStatusChange('Requesting camera permission...');
      console.log('Requesting camera permission...');

      // Request basic camera permission (device selection happens later)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      console.log('Camera stream obtained:', stream);
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach((track) => {
        console.log('Stopping track:', track.label);
        track.stop();
      });

      onCameraPermissionChange('granted');
      onStatusChange('Camera permission granted!');
      return true;
    } catch (e: any) {
      console.error('Camera permission error:', e);
      console.error('Error details:', {
        name: e.name,
        message: e.message,
        constraint: e.constraint,
      });

      if (e.name === 'NotAllowedError') {
        onCameraPermissionChange('denied');
        onStatusChange(
          'Camera permission denied. Please allow camera access in your browser settings and refresh the page.'
        );
      } else if (e.name === 'NotFoundError') {
        onStatusChange('No camera found. Please connect a camera and try again.');
      } else if (e.name === 'NotSupportedError') {
        onStatusChange('Camera not supported. Please use HTTPS or localhost.');
      } else if (e.name === 'OverconstrainedError') {
        onStatusChange('Camera constraints not supported. Trying with basic settings...');
        // Try with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          basicStream.getTracks().forEach((track) => track.stop());
          onCameraPermissionChange('granted');
          onStatusChange('Camera permission granted!');
          return true;
        } catch (basicError: any) {
          console.error('Basic camera request also failed:', basicError);
          onStatusChange('Camera error: ' + (basicError?.message || String(basicError)));
        }
      } else {
        onStatusChange('Camera error: ' + (e?.message || e));
      }
      return false;
    }
  }

  async function handleScanned(raw: string) {
    const isbn = normalizeISBN(raw);
    if (!isbn) return;
    onScanned(isbn);
  }

  return (
    <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
      <h2 className="font-semibold mb-2">Scan ISBN</h2>
      <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline></video>
      </div>

      {/* Camera Selection */}
      {availableCameras.length > 1 && (
        <div className="mt-2">
          <div className="flex gap-2 items-center">
            <label className="block text-sm font-medium text-gray-700">Camera:</label>
            <button
              onClick={() => {
                const currentIndex = availableCameras.findIndex(
                  (c) => c.deviceId === selectedCameraId
                );
                const nextIndex = (currentIndex + 1) % availableCameras.length;
                const nextCamera = availableCameras[nextIndex];
                onCameraChange(nextCamera.deviceId);
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded border"
            >
              Switch Camera
            </button>
          </div>
          <select
            value={selectedCameraId}
            onChange={(e) => onCameraChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
          >
            {availableCameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Click "Switch Camera" or use dropdown to try different cameras
          </p>
        </div>
      )}
    </div>
  );
}
