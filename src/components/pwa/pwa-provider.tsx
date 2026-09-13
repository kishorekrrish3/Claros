"use client";

import * as React from "react";
import { Download, X, Smartphone } from "lucide-react";
import { triggerHaptic } from "@/lib/native/platform";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
}

const PWAContext = React.createContext<PWAContextType>({
  isInstallable: false,
  isStandalone: false,
  installApp: async () => {},
});

export function usePWA() {
  return React.useContext(PWAContext);
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for sw updates periodically
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("New Claros update available.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("ServiceWorker registration failed:", err);
        });
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if previously dismissed in this session
      const dismissed = sessionStorage.getItem("claros-pwa-dismissed");
      if (!dismissed && !isStandaloneMode) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsStandalone(true);
      console.log("Claros installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    triggerHaptic("medium");
    if (!deferredPrompt) {
      // Fallback instruction for Android Chrome if prompt isn't directly triggerable
      alert(
        "To install Claros:\n1. Tap the three dots (⋮) in Chrome\n2. Select 'Install app' or 'Add to Home screen'"
      );
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } catch (err) {
      console.error("Installation prompt error:", err);
    }
  };

  const dismissBanner = () => {
    triggerHaptic("light");
    setShowBanner(false);
    sessionStorage.setItem("claros-pwa-dismissed", "true");
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isStandalone,
        installApp,
      }}
    >
      {children}

      {/* Floating Install Prompt for Mobile Devices */}
      {showBanner && !isStandalone && (
        <div className="fixed bottom-20 inset-x-3 md:inset-x-auto md:right-6 md:bottom-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-primary/20 shadow-2xl shadow-primary/10 max-w-md mx-auto">
            {/* App Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
              C
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground tracking-tight leading-tight">
                Install Claros App
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Fast, full-screen offline-ready personal finance.
              </p>
            </div>

            {/* Install Button */}
            <button
              type="button"
              onClick={installApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss banner"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
