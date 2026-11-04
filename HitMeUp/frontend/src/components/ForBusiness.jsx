import { ArrowRight, Store, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const MERCHANT_PRESETS = [
  {
    id: "bakery",
    label: "Cafe & bakery",
    storefront: "Galle Road Bakehouse · Wellawatte",
    item: "Afternoon bakehouse combo: Sourdough loaf & iced latte",
    regularPrice: 1800,
    defaultDiscount: 30,
    defaultCap: 15,
    window: "3:00 PM – 6:00 PM",
    serial: "HMU-3091",
  },
  {
    id: "spa",
    label: "Salon & wellness",
    storefront: "Ayur Botanica Lounge · Kollupitiya",
    item: "45-minute weekday head, neck & shoulder therapy",
    regularPrice: 4500,
    defaultDiscount: 35,
    defaultCap: 8,
    window: "1:00 PM – 4:30 PM",
    serial: "HMU-6104",
  },
  {
    id: "service",
    label: "Auto & retail",
    storefront: "Park Street Auto Detailers · Union Place",
    item: "Express snow-foam exterior wash & cabin vacuum",
    regularPrice: 3500,
    defaultDiscount: 30,
    defaultCap: 12,
    window: "11:00 AM – 3:00 PM",
    serial: "HMU-4920",
  },
];

function ForBusiness() {
  const sectionRef = useRef(null);
  const [presetIdx, setPresetIdx] = useState(0);
  const [discountPct, setDiscountPct] = useState(
    MERCHANT_PRESETS[0].defaultDiscount
  );
  const [batchCap, setBatchCap] = useState(MERCHANT_PRESETS[0].defaultCap);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const activePreset = MERCHANT_PRESETS[presetIdx];
  const flashPrice = Math.round(
    activePreset.regularPrice * (1 - discountPct / 100)
  );
  const shopperSavings = activePreset.regularPrice - flashPrice;
  const projectedBatchRevenue = flashPrice * batchCap;

  const handleSelectPreset = (idx) => {
    setPresetIdx(idx);
    setDiscountPct(MERCHANT_PRESETS[idx].defaultDiscount);
    setBatchCap(MERCHANT_PRESETS[idx].defaultCap);
  };

  return (
    <section
      id="for-business"
      className="border-b border-[#E6E0D6] bg-[#F7F4EE] py-20"
    >
      <div ref={sectionRef} className="reveal mx-auto max-w-[1200px] px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left — content */}
          <div className="lg:col-span-6">
            <p className="text-[13px] font-medium text-[#7B7266]">
              For merchants
            </p>

            <h2 className="mt-2 text-[28px] sm:text-[32px] font-medium leading-[1.12] tracking-[-0.025em] text-[#1F1B16]">
              Turn quiet afternoon hours into{" "}
              <span className="serif font-normal text-[#D94832]">
                steady walk-in traffic
              </span>
            </h2>

            <p className="mt-4 max-w-[48ch] text-[15px] leading-[1.65] text-[#5E554A]">
              Publish a timed batch of passes when tables are open or fresh
              stock needs to move before closing. Pin your shop on the map and
              verify redemptions from one counter screen.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Set exact voucher quantities and expiration windows",
                "Draft clear offer titles and pricing from your item list",
                "Pin your exact storefront coordinates on the discovery map",
                "Verify customer QR codes and serials at the register",
                "Track claimed vs. redeemed passes for your own store",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#D94832]/15 text-[#D94832]">
                    <Check size={11} strokeWidth={2} />
                  </span>
                  <p className="text-[14px] leading-[1.55] text-[#1F1B16]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1F1B16] px-5 text-[14px] font-medium text-[#FDFBF7] transition-colors duration-150 hover:bg-[#D94832]"
              >
                <span>Register a merchant account</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-4 text-[13px] font-medium text-[#5E554A] transition-colors duration-150 hover:bg-[#EFE9DF] hover:text-[#1F1B16]"
              >
                Merchant sign in
              </Link>
            </div>
          </div>

          {/* Right — Interactive Merchant Deal Simulator & Revenue Calculator */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-6 shadow-[0_4px_20px_rgba(31,27,22,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E0D6] pb-3.5">
                <div className="flex items-center gap-2">
                  <Store
                    size={16}
                    strokeWidth={1.5}
                    className="text-[#D94832]"
                  />
                  <p className="text-[13px] font-medium text-[#1F1B16]">
                    Interactive deal composer
                  </p>
                </div>

                {/* Preset Switcher */}
                <div className="flex items-center gap-1">
                  {MERCHANT_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(idx)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        presetIdx === idx
                          ? "bg-[#1F1B16] text-[#FDFBF7]"
                          : "border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A] hover:text-[#1F1B16]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Sliders */}
              <div className="mt-5 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] p-4 space-y-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#7B7266]">Storefront</span>
                  <span className="font-medium text-[#1F1B16]">
                    {activePreset.storefront}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#7B7266]">Regular counter price</span>
                  <span className="font-mono font-medium text-[#1F1B16] tabular-nums">
                    Rs. {activePreset.regularPrice.toLocaleString()}
                  </span>
                </div>

                {/* Discount Slider */}
                <div className="border-t border-[#E6E0D6] pt-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <label
                      htmlFor="sim-discount"
                      className="font-medium text-[#1F1B16]"
                    >
                      Flash discount rate
                    </label>
                    <span className="font-mono font-medium text-[#D94832] tabular-nums">
                      {discountPct}% off (Saves Rs.{" "}
                      {shopperSavings.toLocaleString()})
                    </span>
                  </div>
                  <input
                    id="sim-discount"
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value))}
                    className="mt-2 w-full accent-[#D94832] cursor-pointer"
                  />
                </div>

                {/* Batch Cap Slider */}
                <div className="border-t border-[#E6E0D6] pt-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <label
                      htmlFor="sim-cap"
                      className="font-medium text-[#1F1B16]"
                    >
                      Voucher batch cap ({activePreset.window})
                    </label>
                    <span className="font-mono font-medium text-[#1F1B16] tabular-nums">
                      {batchCap} passes
                    </span>
                  </div>
                  <input
                    id="sim-cap"
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={batchCap}
                    onChange={(e) => setBatchCap(Number(e.target.value))}
                    className="mt-2 w-full accent-[#1F1B16] cursor-pointer"
                  />
                </div>
              </div>

              <div className="ticket-divider my-4" />

              {/* Live Published Pass Output + Batch Revenue */}
              <div className="rounded-lg border border-[#E6E0D6] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#D94832]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D94832]" />
                    Published pass preview
                  </span>
                  <span className="font-mono text-[11px] text-[#7B7266]">
                    {activePreset.serial}
                  </span>
                </div>

                <p className="mt-1.5 text-[15px] font-medium text-[#1F1B16]">
                  {activePreset.item}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] p-3">
                  <div>
                    <p className="text-[11px] text-[#7B7266]">
                      Customer pays per pass
                    </p>
                    <p className="mt-0.5 font-mono text-[16px] font-medium text-[#1F1B16] tabular-nums">
                      Rs. {flashPrice.toLocaleString()}{" "}
                      <span className="text-[12px] text-[#7B7266] line-through">
                        Rs. {activePreset.regularPrice.toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <div className="border-l border-[#E6E0D6] pl-3">
                    <p className="text-[11px] text-[#7B7266]">
                      Full batch counter intake
                    </p>
                    <p className="mt-0.5 font-mono text-[16px] font-medium text-[#166534] tabular-nums">
                      Rs. {projectedBatchRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForBusiness;
