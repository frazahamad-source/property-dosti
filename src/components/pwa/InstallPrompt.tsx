"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

export function InstallPrompt() {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we are running on the client
    if (typeof window === "undefined") return;

    // Check if the app is already installed
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Register Service Worker to satisfy PWA requirements
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Listen for standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyForInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsReadyForInstall(false);
    }
    setDeferredPrompt(null);
  };

  // If dismissed or already installed, don't show
  if (isStandalone || dismissed) {
    return null;
  }

  // If not iOS and not ready for standard install, don't show yet
  if (!isReadyForInstall && !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm md:text-base">
            Install Property Dosti
          </h3>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
            Add our app to your home screen for quick and easy access.
          </p>

          {isIOS ? (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span>1. Tap</span>
                <Share className="w-4 h-4 text-blue-500" />
                <span>in your browser menu</span>
              </div>
              <div className="flex items-center gap-2">
                <span>2. Scroll down and tap</span>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded shadow-sm border border-zinc-200 dark:border-zinc-600">
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span className="font-medium text-[10px]">Add to Home Screen</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
            >
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
