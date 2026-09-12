'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  SwitchCamera,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealQrScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  demoSamples?: Array<{ label: string; value: string }>;
}

export function RealQrScanner({
  onScan,
  onClose,
  title = 'Real-Time Camera QR Scanner',
  description = 'Point your camera at the prescription QR code stamp or upload a QR image.',
  demoSamples = [
    { label: 'Demo Rx #1', value: 'RX-2026-DEMO01' },
    { label: 'Demo Rx #2', value: 'RX-2026-DEMO02' },
  ],
}: RealQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Play subtle confirmation beep using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, []);

  const handleDetected = useCallback(
    (code: string) => {
      if (!code || scannedResult) return;
      setScannedResult(code);
      playBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        onScan(code);
      }, 500);
    },
    [onScan, playBeep, scannedResult]
  );

  // Scan frame from video using invisible canvas
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data.trim().length > 0) {
      handleDetected(code.data.trim());
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDetected]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScannedResult(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCamera(true);
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. You can enable camera in your browser or upload a QR image below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload a QR image or click a demo token below.');
      } else {
        setCameraError('Could not start video camera. Please use file upload or demo shortcuts.');
      }
    }
  }, [facingMode, scanFrame]);

  useEffect(() => {
    startCamera();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Switch between front/back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle local image file upload scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          setIsProcessingFile(false);
          if (code && code.data) {
            handleDetected(code.data.trim());
          } else {
            alert('No readable QR code found in this image. Please try a clearer picture.');
          }
        } else {
          setIsProcessingFile(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
            <p className="text-xs text-[var(--text-muted)]">{description}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)] transition cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Video Viewport / Viewfinder */}
      <div className="relative aspect-video sm:aspect-[4/3] w-full max-h-[340px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-[var(--line)] flex items-center justify-center shadow-inner">
        {/* Hidden Canvas for Decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            hasCamera ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Camera Active Reticle Overlay */}
        {hasCamera && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Bounding Box */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 border-2 border-dashed border-emerald-400/80 rounded-2xl shadow-2xl flex items-center justify-center bg-emerald-500/5">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Laser Scanning Line */}
              {!scannedResult && (
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce" />
              )}

              {/* Scanned Confirmation Overlay */}
              {scannedResult && (
                <div className="absolute inset-0 bg-emerald-600/90 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center animate-in zoom-in-95">
                  <CheckCircle2 className="w-10 h-10 mb-1 animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-wider">QR Code Recognized!</span>
                  <span className="text-sm font-mono font-extrabold mt-1 break-all bg-black/30 px-2.5 py-1 rounded-lg">
                    {scannedResult}
                  </span>
                </div>
              )}
            </div>

            {/* Live Camera Badge */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE OPTICAL SCANNER</span>
            </div>

            {/* Switch Camera Button */}
            <button
              type="button"
              onClick={toggleFacingMode}
              className="absolute top-3 right-3 pointer-events-auto bg-black/70 hover:bg-black/90 text-white p-2 rounded-xl backdrop-blur-xs border border-white/20 transition cursor-pointer"
              title="Flip camera (front / back)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Camera Permission / Error State */}
        {hasCamera === false && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/95 text-white space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <h4 className="text-sm font-bold">Camera Unavailable</h4>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {cameraError || 'Please allow camera access or use photo upload below.'}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--teal)] hover:opacity-90 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Camera Access
            </button>
          </div>
        )}
      </div>

      {/* Alternative Input Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Upload QR Image File */}
        <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-semibold transition cursor-pointer">
          <Upload className="w-4 h-4 text-[var(--teal)]" />
          <span>{isProcessingFile ? 'Decoding Image...' : 'Upload QR Image / Photo'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isProcessingFile}
          />
        </label>

        {/* Instant Demo Fill Shortcuts */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-xl overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 shrink-0">
            Demo:
          </span>
          {demoSamples.map((sample) => (
            <button
              key={sample.value}
              type="button"
              onClick={() => handleDetected(sample.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)] text-xs font-mono font-bold transition shrink-0 cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
