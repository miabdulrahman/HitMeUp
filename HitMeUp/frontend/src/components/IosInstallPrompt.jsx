import { useState, useEffect } from "react";
import { Share, PlusSquare, X, Download, Smartphone, Check } from "lucide-react";

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      return; // Already running as installed PWA app
    }

    // 2. Check if user dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem("hitmeup_pwa_dismissed");
    if (dismissedTime) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);

    setIsIosDevice(isIos);

    // 4. On Android / Chromium browsers, listen for beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleCustomTrigger = () => {
      setShowGuideModal(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("show-hitmeup-install-prompt", handleCustomTrigger);

    // If iOS, delay prompt display by 2 seconds so page loads smoothly first
    if (isIos) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("show-hitmeup-install-prompt", handleCustomTrigger);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("show-hitmeup-install-prompt", handleCustomTrigger);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowGuideModal(false);
    localStorage.setItem("hitmeup_pwa_dismissed", Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS doesn't support beforeinstallprompt; show 3-step visual instruction modal
      setShowGuideModal(true);
    }
  };

  if (!showPrompt && !showGuideModal) return null;

  return (
    <>
      {/* Floating Bottom Pill / Banner on Mobile */}
      {showPrompt && !showGuideModal && (
        <aside
          role="region"
          aria-label="Install app"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md animate-fade-in sm:bottom-6 sm:left-auto sm:right-6"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7]/95 p-3.5 shadow-[0_12px_28px_rgba(31,27,22,0.16)] backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D94832] text-white shadow-xs">
                <Smartphone size={20} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#1F1B16] truncate">
                  Install HitMeUp App
                </p>
                <p className="text-[11px] text-[#5E554A] truncate">
                  {isIosDevice
                    ? "Add to your iPhone Home Screen"
                    : "Fast 1-tap launch & offline QR passes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#D94832] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#C23B26] cursor-pointer"
              >
                <Download size={13} strokeWidth={1.75} />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B7266] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                aria-label="Dismiss install prompt"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Step-by-Step Installation Modal */}
      {showGuideModal && (
        <div
          className="ios-popup-backdrop fixed inset-0 z-[70] flex items-end sm:items-center justify-center overflow-y-auto bg-[#1F1B16]/60 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="ios-popup-card relative my-0 sm:my-6 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[26px] rounded-b-none sm:rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] p-6 shadow-[0_16px_40px_rgba(31,27,22,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#7B7266] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
              aria-label="Close guide"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <img
                src="/apple-touch-icon.png"
                alt="HitMeUp"
                className="h-12 w-12 rounded-xl border border-[#E6E0D6] object-cover shadow-xs"
              />
              <div>
                <h3 className="text-[17px] font-medium text-[#1F1B16]">
                  Install on iPhone
                </h3>
                <p className="text-[12px] text-[#5E554A]">
                  Get full-screen access without Safari browser bars
                </p>
              </div>
            </div>

            {/* 3 Steps */}
            <div className="mt-5 space-y-3.5 border-t border-[#E6E0D6] pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F1B16] text-[12px] font-medium text-white">
                  1
                </div>
                <div className="text-[13px] text-[#1F1B16]">
                  <span>Tap the </span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#D94832] bg-[#D94832]/10 px-1.5 py-0.5 rounded">
                    <Share size={13} strokeWidth={1.75} />
                    Share button
                  </span>
                  <span> at the bottom of Safari toolbar.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F1B16] text-[12px] font-medium text-white">
                  2
                </div>
                <div className="text-[13px] text-[#1F1B16]">
                  <span>Scroll down the menu and tap </span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#1F1B16] bg-[#EFE9DF] px-1.5 py-0.5 rounded">
                    <PlusSquare size={13} strokeWidth={1.75} />
                    Add to Home Screen
                  </span>
                  <span>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F1B16] text-[12px] font-medium text-white">
                  3
                </div>
                <div className="text-[13px] text-[#1F1B16]">
                  <span>Tap </span>
                  <strong className="font-semibold text-[#1F1B16]">"Add"</strong>
                  <span> in the top-right corner. HitMeUp is now on your home screen!</span>
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#D94832] text-[13px] font-medium text-white transition-colors hover:bg-[#C23B26] cursor-pointer"
              >
                <Check size={15} strokeWidth={2} />
                <span>Got it!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
