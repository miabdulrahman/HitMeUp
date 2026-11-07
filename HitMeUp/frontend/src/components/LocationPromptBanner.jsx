import { Navigation, MapPin, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLocationContext } from "../context/LocationContext";

function LocationPromptBanner() {
  const location = useLocation();
  const {
    showPrompt,
    hasRealLocation,
    locationStatus,
    requestLocation,
    dismissPrompt,
  } = useLocationContext();

  // Suppress banner on administrative portal, or if already granted / dismissed
  if (location.pathname.startsWith("/admin")) return null;
  if (!showPrompt || hasRealLocation) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl sm:left-auto sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] p-4 shadow-[0_12px_36px_rgba(31,27,22,0.12)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D94832]/10 text-[#D94832]">
            <Navigation size={20} strokeWidth={1.75} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-semibold text-[#1F1B16]">
                Find deals near you
              </h4>
              <span className="rounded-full bg-[#166534]/10 px-2 py-0.5 text-[10px] font-mono font-medium text-[#166534]">
                GPS Nearby
              </span>
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#5E554A]">
              Allow location access to discover flash discounts at shops closest to your street.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={requestLocation}
            disabled={locationStatus === "requesting"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D94832] px-3.5 text-[12px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26] disabled:opacity-60 cursor-pointer shadow-xs"
          >
            <MapPin size={13} strokeWidth={1.5} />
            <span>
              {locationStatus === "requesting" ? "Detecting..." : "Allow location"}
            </span>
          </button>

          <button
            type="button"
            onClick={dismissPrompt}
            className="inline-flex h-9 items-center rounded-lg border border-[#E6E0D6] bg-white px-2.5 text-[12px] font-medium text-[#7B7266] transition-colors duration-150 hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
            title="Show all top deals without location access"
          >
            <span>Show all top deals</span>
          </button>

          <button
            type="button"
            onClick={dismissPrompt}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7B7266] hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
            aria-label="Close location banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationPromptBanner;
