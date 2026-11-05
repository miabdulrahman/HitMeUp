import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Google Sign-In."));
    document.head.appendChild(script);
  });

const GoogleSignInButton = ({ onSuccess, onError, disabled = false }) => {
  const buttonRef = useRef(null);
  const [setupError, setSetupError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      setSetupError("Google Sign-In is not configured.");
      return undefined;
    }

    let active = true;
    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current) return;

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onSuccess(response.credential),
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: buttonRef.current.offsetWidth,
        });
      })
      .catch((error) => {
        if (active) {
          setSetupError(error.message);
          onError(error);
        }
      });

    return () => {
      active = false;
    };
  }, [clientId, onError, onSuccess]);

  if (setupError) {
    return (
      <p className="text-center text-[12px] text-[#B91C1C]" role="alert">
        {setupError}
      </p>
    );
  }

  return (
    <div
      ref={buttonRef}
      className={disabled ? "pointer-events-none opacity-60" : ""}
      aria-label="Continue with Google"
    />
  );
};

export default GoogleSignInButton;
