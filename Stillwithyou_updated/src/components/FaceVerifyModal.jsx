import React, { useState, useRef, useEffect, useCallback } from 'react';
import { loadModels, getFaceDescriptor, compareFaces, FACE_MATCH_THRESHOLD } from '../utils/faceApi.js';

/**
 * FaceVerifyModal
 * Props:
 *   isOpen          – boolean
 *   mode            – 'signup' | 'login'
 *   storedDescriptor – Float32 array (only needed for login mode)
 *   onCapture(descriptor) – called after successful capture (signup mode)
 *   onVerified()          – called after successful match (login mode)
 *   onFailed(msg)         – called when face doesn't match or error
 *   onClose()
 */
export default function FaceVerifyModal({
  isOpen, mode = 'login',
  storedDescriptor,
  onCapture, onVerified, onFailed, onClose
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | scanning | matched | failed | noface
  const [loadingMsg, setLoadingMsg] = useState('Loading face models…');
  const [dots, setDots] = useState('');

  // Animated dots for scanning label
  useEffect(() => {
    if (status !== 'scanning') return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, [status]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Sometimes play() is interrupted by a re-render/unmount (AbortError).
        // It's safe to catch and ignore this.
        await videoRef.current.play().catch(err => {
          if (err.name !== 'AbortError') throw err;
        });
      }
    } catch (e) {
      console.error('Camera Access Error:', e);
      setStatus('failed');
      const techMsg = e.name === 'NotAllowedError' ? 'Access denied' : (e.name === 'NotReadableError' ? 'Camera is busy' : 'Setup failed');
      onFailed?.(`Camera Error: ${techMsg}. Please check permissions.`);
    }
  }, [onFailed]);

  // Boot sequence
  useEffect(() => {
    if (!isOpen) { stopCamera(); return; }

    let cancelled = false;
    const init = async () => {
      setStatus('loading');
      setLoadingMsg('Loading face models…');
      try {
        await loadModels();
        if (cancelled) return;
        setLoadingMsg('Starting camera…');
        await startCamera();
        if (cancelled) return;
        setStatus('ready');
      } catch (e) {
        console.error('Face Auth Init Error:', e);
        if (!cancelled) { 
          setStatus('failed'); 
          // If startCamera already called onFailed, don't overwrite with generic message
          if (status !== 'failed') {
            const msg = e.message?.includes('nets') || e.message?.includes('fetch')
              ? 'Failed to load face models. Check internet connection.' 
              : `System Error: ${e.message || 'Camera initialization fail'}`;
            onFailed?.(msg);
          }
        }
      }
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  }, [isOpen, startCamera, stopCamera, onFailed]);

  const handleScan = useCallback(async () => {
    if (!videoRef.current || status !== 'ready') return;
    setStatus('scanning');

    try {
      // Give the camera a brief moment to stabilize
      await new Promise(r => setTimeout(r, 400));
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (!descriptor) {
        setStatus('noface');
        return;
      }

      if (mode === 'signup') {
        setStatus('matched');
        setTimeout(() => { stopCamera(); onCapture?.(descriptor); }, 800);
        return;
      }

      // LOGIN mode — compare
      if (!storedDescriptor || storedDescriptor.length === 0) {
        // No stored face — skip verification
        setStatus('matched');
        setTimeout(() => { stopCamera(); onVerified?.(); }, 800);
        return;
      }

      const dist = compareFaces(descriptor, storedDescriptor);
      if (dist <= FACE_MATCH_THRESHOLD) {
        setStatus('matched');
        setTimeout(() => { stopCamera(); onVerified?.(); }, 1000);
      } else {
        setStatus('failed');
        onFailed?.(`Face doesn't match. Distance: ${dist.toFixed(2)}. Make sure you're in good lighting.`);
      }
    } catch (e) {
      setStatus('failed');
      onFailed?.('Face scan error. Please try again.');
    }
  }, [status, mode, storedDescriptor, onCapture, onVerified, onFailed, stopCamera]);

  const retry = () => setStatus('ready');

  if (!isOpen) return null;

  return (
    <div className="fv-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fv-modal">
        {/* Header */}
        <div className="fv-header">
          <div className="fv-logo">Still <em>With You</em></div>
          <button className="fv-close" onClick={() => { stopCamera(); onClose(); }}>✕</button>
        </div>

        <h2 className="fv-title">
          {mode === 'signup' ? '📸 Capture Your Face' : '🔐 Face Verification'}
        </h2>
        <p className="fv-subtitle">
          {mode === 'signup'
            ? 'Look at the camera and press Capture. This will be used to verify your identity on future logins.'
            : 'Look directly at the camera to verify your identity before logging in.'}
        </p>

        {/* Camera box */}
        <div className={`fv-camera-box${status === 'matched' ? ' matched' : status === 'failed' || status === 'noface' ? ' failed' : ''}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="fv-video"
            style={{ display: status === 'loading' ? 'none' : 'block' }}
          />

          {/* Overlay states */}
          {status === 'loading' && (
            <div className="fv-overlay-msg">
              <div className="fv-spinner" />
              <span>{loadingMsg}</span>
            </div>
          )}

          {status === 'scanning' && (
            <div className="fv-scan-bar">
              <div className="fv-scan-line" />
              <span className="fv-scan-label">Scanning{dots}</span>
            </div>
          )}

          {status === 'matched' && (
            <div className="fv-result matched">
              <div className="fv-result-icon">✓</div>
              <span>{mode === 'signup' ? 'Face captured!' : 'Identity verified!'}</span>
            </div>
          )}

          {(status === 'failed' || status === 'noface') && (
            <div className="fv-result failed">
              <div className="fv-result-icon">✕</div>
              <span>{status === 'noface' ? 'No face detected' : 'Verification failed'}</span>
            </div>
          )}

          {/* Face guide oval */}
          {(status === 'ready' || status === 'scanning') && (
            <div className={`fv-face-guide${status === 'scanning' ? ' scanning' : ''}`} />
          )}
        </div>

        {/* Actions */}
        <div className="fv-actions">
          {status === 'ready' && (
            <button className="btn-go fv-btn" onClick={handleScan}>
              {mode === 'signup' ? '📸 Capture Face' : '🔍 Scan My Face'}
            </button>
          )}

          {status === 'scanning' && (
            <button className="btn-go fv-btn" disabled>Scanning…</button>
          )}

          {(status === 'failed' || status === 'noface') && (
            <>
              <p className="fv-hint">
                {status === 'noface'
                  ? '💡 Make sure your face is clearly visible and well-lit.'
                  : '💡 Ensure good lighting and look straight at the camera.'}
              </p>
              <button className="btn-go fv-btn" onClick={retry}>🔄 Try Again</button>
            </>
          )}

          {(mode === 'login') && status !== 'matched' && (
            <button className="fv-skip-btn" onClick={() => { stopCamera(); onVerified?.(); }}>
              Skip face check →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
