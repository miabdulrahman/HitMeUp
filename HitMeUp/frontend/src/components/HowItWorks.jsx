import { useEffect, useRef, useState } from "react";
import { MapPin, Ticket, QrCode, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  {
    number: "01",
    title: "Check nearby passes",
    description:
      "Browse the live pass grid or street map to see which neighborhood shops have active markdowns right now.",
    badge: "Street map and feed",
  },
  {
    number: "02",
    title: "Claim your pass",
    description:
      "Reserve a free walk in voucher pass or complete checkout online before the batch timer expires.",
    badge: "Free to reserve",
  },
  {
    number: "03",
    title: "Open your QR ticket",
    description:
      "Your pass is stored in your account with a unique HMU serial number and scannable QR code.",
    badge: "Instant serial pass",
  },
  {
    number: "04",
    title: "Redeem at the counter",
    description:
      "Show the pass to the cashier at the store. They scan or enter the code to apply your discount.",
    badge: "POS verified",
  },
];

function HowItWorks() {
  const sectionRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

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

  return (
    <section
      id="how-it-works"
      className="border-b border-[#E6E0D6] dark:border-[#272727] bg-[#F7F4EE] dark:bg-[#181818] py-20 text-[#1F1B16] dark:text-[#FDFBF7] transition-colors duration-300"
    >
      <div ref={sectionRef} className="reveal mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-[540px]">
            <span className="font-mono text-xs uppercase tracking-wider text-[#7B7266] dark:text-[#A89F91]">
              How it works
            </span>

            {/* Heading 3: text-3xl sm:text-4xl, Semibold (Rule B1) */}
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1F1B16] dark:text-[#FDFBF7] [text-wrap:balance]">
              From street map to counter redemption in four steps
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`h-8 rounded-md px-3 font-mono text-[12px] transition-colors cursor-pointer ${
                  activeStep === idx
                    ? "bg-[#D94832] font-medium text-white"
                    : "border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] text-[#5E554A] dark:text-[#A89F91] hover:text-[#1F1B16] dark:hover:text-white"
                }`}
              >
                Step {s.number}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive 4-Step Grid + Live Stage Preview */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Step Selector Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {STEPS.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-colors duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#D94832] bg-[#FDFBF7] dark:bg-[#272727] shadow-xs"
                      : "border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7]/75 dark:bg-[#1F1F1F] hover:border-[#D94832]/50 hover:bg-[#FDFBF7] dark:hover:bg-[#272727]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex rounded-[5px] px-2 py-0.5 font-mono text-[11px] tabular-nums ${
                          isSelected
                            ? "bg-[#D94832] text-white"
                            : "border border-[#E6E0D6] dark:border-[#313131] bg-[#EFE9DF] dark:bg-[#272727] text-[#5E554A] dark:text-[#A89F91]"
                        }`}
                      >
                        Step {step.number}
                      </span>
                      <span className="font-mono text-[11px] text-[#7B7266] dark:text-[#A89F91]">
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[17px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-[13px] leading-[1.6] text-[#5E554A] dark:text-[#A89F91]">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#E6E0D6] dark:border-[#313131] pt-3 text-[12px]">
                    <span
                      className={
                        isSelected
                          ? "font-medium text-[#D94832]"
                          : "text-[#7B7266] dark:text-[#A89F91]"
                      }
                    >
                      {isSelected ? "Showing preview" : "Click to preview"}
                    </span>
                    <ArrowRight
                      size={13}
                      strokeWidth={1.5}
                      className={
                        isSelected ? "text-[#D94832]" : "text-[#7B7266] dark:text-[#A89F91]"
                      }
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive Step Preview Panel */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] p-6 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between border-b border-[#E6E0D6] dark:border-[#313131] pb-3.5">
                <span className="font-mono text-[12px] text-[#D94832]">
                  Step {STEPS[activeStep].number} · {STEPS[activeStep].title}
                </span>
                <span className="font-mono text-[11px] text-[#7B7266] dark:text-[#A89F91]">
                  Live flow
                </span>
              </div>

              {activeStep === 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-[13px] text-[#5E554A] dark:text-[#A89F91]">
                    Pinned neighborhood stores with active passes near your
                    current street:
                  </p>
                  {[
                    {
                      shop: "Commons Roastery & Bakehouse",
                      area: "Bambalapitiya · 0.8 km",
                      offer: "35% off · 6 passes left",
                    },
                    {
                      shop: "Galle Road Bakehouse",
                      area: "Wellawatte · 1.4 km",
                      offer: "30% off · 11 passes left",
                    },
                    {
                      shop: "Ayur Botanica Lounge",
                      area: "Kollupitiya · 1.1 km",
                      offer: "40% off · 4 passes left",
                    },
                  ].map((pin) => (
                    <div
                      key={pin.shop}
                      className="flex items-center justify-between rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#181818] p-3.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <MapPin
                          size={15}
                          strokeWidth={1.5}
                          className="mt-0.5 shrink-0 text-[#D94832]"
                        />
                        <div>
                          <p className="text-[13px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]">
                            {pin.shop}
                          </p>
                          <p className="text-[11px] text-[#7B7266] dark:text-[#A89F91]">
                            {pin.area}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-[#D94832]/15 px-2 py-1 font-mono text-[11px] text-[#D94832]">
                        {pin.offer}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeStep === 1 && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#181818] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#7B7266] dark:text-[#A89F91]">
                        Selected deal
                      </span>
                      <span className="font-mono text-[11px] text-[#166534] dark:text-[#4ADE80]">
                        6 / 15 left in batch
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]">
                      Afternoon espresso &amp; sourdough tartlet for two
                    </p>
                    <div className="mt-3 flex items-baseline justify-between border-t border-[#E6E0D6] dark:border-[#313131] pt-3 font-mono">
                      <div>
                        <span className="text-[18px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]">
                          Rs. 1,950
                        </span>
                        <span className="ml-2 text-[12px] text-[#7B7266] dark:text-[#A89F91] line-through">
                          Rs. 3,000
                        </span>
                      </div>
                      <span className="text-[12px] text-[#D94832]">
                        Rs. 0 online reservation
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#D94832]/40 bg-[#D94832]/10 px-4 py-3 text-[13px]">
                    <span className="flex items-center gap-2 text-[#1F1B16] dark:text-[#FDFBF7]">
                      <Ticket size={15} className="text-[#D94832]" />
                      One pass reserved per account
                    </span>
                    <span className="font-mono text-[11px] text-[#D94832]">
                      Held for 2 hrs
                    </span>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="mt-5">
                  <div className="rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#181818] p-4 text-[#1F1B16] dark:text-[#FDFBF7]">
                    <div className="flex items-center justify-between border-b border-[#E6E0D6] dark:border-[#313131] pb-2.5">
                      <span className="font-mono text-[11px] text-[#7B7266] dark:text-[#A89F91]">
                        COUNTER VOUCHER PASS
                      </span>
                      <span className="rounded bg-[#F0FDF4] dark:bg-[#166534]/25 px-2 py-0.5 font-mono text-[11px] font-medium text-[#166534] dark:text-[#4ADE80]">
                        Active
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[12px] text-[#7B7266] dark:text-[#A89F91]">
                          Commons Roastery · Colombo 04
                        </p>
                        <p className="mt-0.5 font-mono text-[16px] font-semibold text-[#1F1B16] dark:text-[#FDFBF7]">
                          HMU-8420-CMB
                        </p>
                        <p className="mt-1 font-mono text-[12px] text-[#D94832]">
                          Pay Rs. 1,950 at counter (35% off)
                        </p>
                      </div>
                      <div className="keep-light-surface flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#E6E0D6] bg-white p-2 text-[#1F1B16]">
                        <QrCode size={36} strokeWidth={1.5} className="keep-dark-ink text-[#1F1B16]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#181818] p-4">
                    <p className="text-[11px] font-mono text-[#7B7266] dark:text-[#A89F91]">
                      MERCHANT COUNTER POS
                    </p>
                    <div className="mt-2 flex items-center justify-between rounded border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#272727] px-3 py-2 font-mono text-[13px]">
                      <span>HMU-8420-CMB</span>
                      <span className="text-[11px] text-[#166534] dark:text-[#4ADE80]">
                        Matched
                      </span>
                    </div>
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[#166534]/40 bg-[#F0FDF4] dark:bg-[#166534]/20 p-3 text-[12px] text-[#166534] dark:text-[#DCFCE7]">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-[#166534] dark:text-[#4ADE80]"
                      />
                      <div>
                        <p className="font-medium">
                          Pass verified &amp; marked redeemed
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] opacity-85">
                          Collect Rs. 1,950 · Customer saved Rs. 1,050
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#E6E0D6] dark:border-[#313131] pt-4">
              <span className="font-mono text-[12px] text-[#7B7266] dark:text-[#A89F91]">
                Step 0{activeStep + 1} of 04
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep((prev) => (prev + 1) % STEPS.length)
                  }
                  className="rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#272727] px-3 py-1.5 text-[12px] font-medium text-[#1F1B16] dark:text-[#FDFBF7] hover:bg-[#EFE9DF] dark:hover:bg-[#313131] cursor-pointer"
                >
                  Next step
                </button>
                <Link
                  to="/register"
                  className="rounded-lg bg-[#D94832] px-3.5 py-1.5 text-[12px] font-medium text-white hover:bg-[#C23B26]"
                >
                  Try it free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
