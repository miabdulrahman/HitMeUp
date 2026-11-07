import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Zap,
} from "lucide-react";

/**
 * Extracts a clean HitMeUp voucher code (e.g. "HMU-8420-CMB") from raw QR data.
 * Handles "HITMEUP:HMU-XXXX-XXXXXX", raw "HMU-XXXX-XXXXXX", JSON payloads, or URLs.
 */
export function extractVoucherCode(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  let cleaned = rawText.trim();

  // Strip "HITMEUP:" prefix used by backend QR generator
  if (cleaned.toUpperCase().startsWith("HITMEUP:")) {
    cleaned = cleaned.slice(8).trim();
  }

  // Try matching standard HMU-XXXX-XXXXXX pattern anywhere in the string
  const hmuMatch = cleaned.toUpperCase().match(/HMU-[A-Z0-9]{2,12}-[A-Z0-9]{2,12}/);
  if (hmuMatch) {
    return hmuMatch[0];
  }

  // Try JSON payload if applicable
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      const candidate = parsed.voucherCode || parsed.code || parsed.id;
      if (candidate) return String(candidate).toUpperCase().trim();
    } catch {
      // ignore invalid JSON
    }
  }

  return cleaned.toUpperCase();
}

export default function QrCameraScannerModal({
  isOpen,
  onClose,
  onDetected,
  autoRedeem = true,
  onToggleAutoRedeem,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const hasScannedRef = useRef(false);

  const [facingMode, setFacingMode] = useState("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("Starting camera...");

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const handleSuccessfulScan = useCallback(
    (rawValue) => {
      if (hasScannedRef.current) return;
      const code = extractVoucherCode(rawValue);
      if (!code) return;

      hasScannedRef.current = true;
      setScannedCode(code);
      setStatusMessage(`Detected pass: ${code}`);

      // Brief tactile pause so seller sees the green lock-on feedback before closing
      setTimeout(() => {
        stopCamera();
        onDetected(code);
      }, 320);
    },
    [onDetected, stopCamera]
  );

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError("");
    setScannedCode("");
    hasScannedRef.current = false;
    setStatusMessage("Requesting camera access...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Camera access is not supported in this browser or connection. Use HTTPS/localhost or upload a QR image below."
      );
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback to any available video device (e.g. desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setStatusMessage("Point camera at customer's QR voucher pass");
      }
    } catch (err) {
      console.error("QR Camera error:", err);
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in your browser address bar, or upload a photo of the QR code below."
          : "Could not access a camera on this device. You can upload a screenshot/photo of the QR pass below."
      );
    }
  }, [facingMode, stopCamera]);

  // Continuous frame scanning loop (BarcodeDetector + jsQR fallback)
  useEffect(() => {
    if (!isOpen || !cameraReady) return undefined;

    let nativeDetector = null;
    if ("BarcodeDetector" in window) {
      try {
        nativeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        nativeDetector = null;
      }
    }

    let lastScanTime = 0;

    const scanTick = async (timestamp) => {
      if (hasScannedRef.current) return;

      // Scan every ~90ms (~11 fps) for low CPU usage and instant response
      if (timestamp - lastScanTime > 90) {
        lastScanTime = timestamp;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState >= video.HAVE_ENOUGH_DATA) {
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            // 1. Try hardware-accelerated BarcodeDetector if available
            if (nativeDetector) {
              try {
                const barcodes = await nativeDetector.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleSuccessfulScan(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // Fall through to jsQR canvas decode
              }
            }

            // 2. Universal jsQR canvas decoder (works on all browsers including Safari/iOS/Firefox)
            const targetWidth = Math.min(640, width);
            const scale = targetWidth / width;
            const targetHeight = Math.floor(height * scale);

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
              const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
              const qrResult = jsQR(imageData.data, targetWidth, targetHeight, {
                inversionAttempts: "attemptBoth",
              });

              if (qrResult && qrResult.data) {
                handleSuccessfulScan(qrResult.data);
                return;
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(scanTick);
    };

    rafRef.current = requestAnimationFrame(scanTick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isOpen, cameraReady, handleSuccessfulScan]);

  // Start/stop camera when modal opens or facingMode changes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  // Handle QR image upload fallback
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        const maxDim = 1000;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const qrResult = jsQR(imageData.data, w, h, {
          inversionAttempts: "attemptBoth",
        });

        if (qrResult && qrResult.data) {
          handleSuccessfulScan(qrResult.data);
        } else {
          setCameraError(
            "No valid QR code found in that image. Please try a clearer image or use the live camera."
          );
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div
      className="ios-popup-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
      onClick={() => {
        stopCamera();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Scan Customer QR Pass"
    >
      <div
        className="ios-popup-card relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E4E4E7] dark:border-[#313131] bg-white dark:bg-[#1F1F1F] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] dark:border-[#313131] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D94832]/10 text-[#D94832]">
              <QrCode className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#171717] dark:text-[#FDFBF7]">
                Scan Customer QR Pass
              </h3>
              <p className="text-[12px] text-[#737373] dark:text-[#8E867B]">
                Hold customer&apos;s phone QR code inside the frame
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E4E7] dark:border-[#313131] text-[#525252] dark:text-[#CFC6B8] hover:bg-[#F4F4F5] dark:hover:bg-[#272727] cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#E4E4E7] dark:border-[#313131] bg-[#111318]">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
              <div
                className={`relative h-full w-full max-h-[240px] max-w-[240px] rounded-2xl transition-all duration-300 ${
                  scannedCode
                    ? "border-2 border-[#4ADE80] bg-[#4ADE80]/10 shadow-[0_0_30px_rgba(74,222,128,0.35)]"
                    : "border border-white/25"
                }`}
              >
                {/* 4 Corner Brackets */}
                <span className="absolute -top-0.5 -left-0.5 h-6 w-6 rounded-tl-xl border-t-3 border-l-3 border-[#D94832]" />
                <span className="absolute -top-0.5 -right-0.5 h-6 w-6 rounded-tr-xl border-t-3 border-r-3 border-[#D94832]" />
                <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-xl border-b-3 border-l-3 border-[#D94832]" />
                <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-xl border-b-3 border-r-3 border-[#D94832]" />

                {/* Animated Laser Line when scanning */}
                {cameraReady && !scannedCode && (
                  <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#D94832] to-transparent shadow-[0_0_12px_#D94832] animate-pulse" />
                )}
              </div>
            </div>

            {/* Top Camera Controls Overlay */}
            <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-mono text-[11px] text-white backdrop-blur-md">
                <span
                  className={`h-2 w-2 rounded-full ${
                    scannedCode
                      ? "bg-[#4ADE80]"
                      : cameraReady
                      ? "bg-[#4ADE80] animate-ping"
                      : "bg-amber-400"
                  }`}
                />
                <span>{scannedCode ? "QR Locked" : cameraReady ? "Live Scanner" : "Connecting"}</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "environment" ? "user" : "environment"
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md hover:bg-black/80 cursor-pointer"
                title="Switch front/back camera"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Flip camera</span>
              </button>
            </div>

            {/* Bottom Status Pill inside Viewport */}
            <div className="absolute right-3 bottom-3 left-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-xl bg-black/70 px-3.5 py-1.5 text-[12px] font-medium text-white backdrop-blur-md">
                {scannedCode ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                    <span className="font-mono">{scannedCode}</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5 text-[#FF8A6B]" />
                    <span>{statusMessage}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner if Camera Blocked */}
          {cameraError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-[12px] text-[#DC2626]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-1.5 font-semibold underline hover:no-underline cursor-pointer"
                >
                  Retry camera
                </button>
              </div>
            </div>
          )}

          {/* Auto-Redeem Toggle + Upload QR Image Fallback */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {typeof onToggleAutoRedeem === "function" && (
              <label className="inline-flex items-center gap-2 text-[12px] text-[#525252] dark:text-[#CFC6B8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRedeem}
                  onChange={(e) => onToggleAutoRedeem(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D4D4D8] accent-[#D94832]"
                />
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-[#D94832]" />
                  Auto-verify on scan
                </span>
              </label>
            )}

            <label className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] dark:border-[#313131] bg-[#FAFAFA] dark:bg-[#272727] px-3.5 text-[12px] font-medium text-[#171717] dark:text-[#FDFBF7] transition-colors hover:bg-[#F4F4F5] cursor-pointer">
              <Upload className="h-3.5 w-3.5 text-[#D94832]" />
              <span>Upload QR image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

