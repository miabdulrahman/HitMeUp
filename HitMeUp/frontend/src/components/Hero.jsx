import {
  ArrowRight,
  MapPin,
  Clock3,
  QrCode,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SAMPLE_PASSES = [
  {
    id: "pass-1",
    discount: "35% off",
    category: "Food & drink",
    merchant: "Commons Roastery & Bakehouse",
    neighborhood: "Bambalapitiya, Colombo 04 · 0.8 km",
    title: "Afternoon espresso & sourdough tartlet for two",
    price: 1950,
    oldPrice: 3000,
    remaining: 6,
    serial: "HMU-8420-CMB",
    windowText: "Show QR at checkout before 6:00 PM",
    image: "/hero-cover.jpg",
    initialSeconds: 8078, // 02h 14m 38s
  },
  {
    id: "pass-2",
    discount: "30% off",
    category: "Bakery & cafe",
    merchant: "Galle Road Bakehouse",
    neighborhood: "Wellawatte, Colombo 06 · 1.4 km",
    title: "Artisan sourdough loaf & two iced cinnamon lattes",
    price: 1260,
    oldPrice: 1800,
    remaining: 11,
    serial: "HMU-3091-WEL",
    windowText: "Valid for walk-in pickup until 7:30 PM",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    initialSeconds: 5620, // 01h 33m 40s
  },
  {
    id: "pass-3",
    discount: "40% off",
    category: "Wellness & spa",
    merchant: "Ayur Botanica Lounge",
    neighborhood: "Kollupitiya, Colombo 03 · 1.1 km",
    title: "45-minute weekday head, neck & shoulder therapy",
    price: 2700,
    oldPrice: 4500,
    remaining: 4,
    serial: "HMU-6104-KLP",
    windowText: "Walk-in slot reserved for 2 hours after claim",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
    initialSeconds: 11415, // 03h 10m 15s
  },
];

const NEIGHBORHOODS = [
  "Bambalapitiya",
  "Wellawatte",
  "Kollupitiya",
  "Nugegoda",
  "Mount Lavinia",
];

function formatDuration(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const hrs = String(Math.floor(safe / 3600)).padStart(2, "0");
  const mins = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${hrs}h ${mins}m ${secs}s`;
}

function Hero() {
  const revealRefs = useRef([]);
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [activePassIndex, setActivePassIndex] = useState(0);
  const [timers, setTimers] = useState(() =>
    SAMPLE_PASSES.map((p) => p.initialSeconds)
  );
  const [scanSimulated, setScanSimulated] = useState(false);

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

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Live ticking countdown for the hero voucher preview
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((seconds) => (seconds > 60 ? seconds - 1 : seconds))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const activePass = SAMPLE_PASSES[activePassIndex];
  const savings = activePass.oldPrice - activePass.price;

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (trimmed) {
      navigate(`/deals?q=${encodeURIComponent(trimmed)}`);
    } else {
      const dealsSection = document.getElementById("deals");
      if (dealsSection) {
        dealsSection.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/deals");
      }
    }
  };

  const handleSelectNeighborhood = (area) => {
    navigate(`/deals?q=${encodeURIComponent(area)}`);
  };

  const handleSwitchPass = (nextIdx) => {
    setScanSimulated(false);
    setActivePassIndex(nextIdx);
  };

  return (
    <section
      id="home"
      className="relative border-b border-[#E6E0D6] bg-[#F7F4EE] pt-28 pb-20 lg:pt-36 lg:pb-24"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left column: Asymmetric direct copy + interactive search */}
          <div ref={addRef} className="reveal lg:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#E6E0D6] bg-[#FDFBF7] px-3 py-1 text-[12px] font-medium text-[#5E554A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D94832]" />
              <span>Neighborhood flash deals across Sri Lanka</span>
            </div>

            <h1 className="text-[clamp(2.4rem,4.8vw,4.1rem)] font-medium leading-[1.06] tracking-[-0.03em] text-[#1F1B16]">
              Local markdowns you can{" "}
              <span className="serif font-normal text-[#D94832]">
                walk in and redeem
              </span>{" "}
              today
            </h1>

            <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.65] text-[#5E554A]">
              Cafes, bakeries, salons, and retail counters post short-window
              discounts when tables or shelves are quiet. Claim a free voucher
              pass online and scan your QR code at the shop counter.
            </p>

            {/* Interactive Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-7 flex max-w-[560px] flex-col gap-2 rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-2 shadow-[0_2px_10px_rgba(31,27,22,0.04)] sm:flex-row sm:items-center"
            >
              <div className="relative flex flex-1 items-center">
                <Search
                  size={16}
                  strokeWidth={1.5}
                  className="pointer-events-none ml-3 text-[#7B7266]"
                />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search coffee, bakery, salon, or street..."
                  className="h-10 w-full bg-transparent px-3 text-[14px] text-[#1F1B16] placeholder-[#7B7266] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#D94832] px-5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26] cursor-pointer"
              >
                <span>Find passes</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </button>
            </form>

            {/* Quick Neighborhood Chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-[12px] text-[#7B7266]">
                <MapPin size={12} strokeWidth={1.5} className="text-[#D94832]" />
                Nearby areas:
              </span>
              {NEIGHBORHOODS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleSelectNeighborhood(area)}
                  className="rounded-md border border-[#E6E0D6] bg-[#FDFBF7] px-2.5 py-1 text-[12px] text-[#5E554A] transition-colors duration-150 hover:border-[#1F1B16]/30 hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Secondary Action Links */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#deals"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-4 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF]"
              >
                <span>Browse live pass feed</span>
              </a>

              <Link
                to="/register"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E6E0D6] bg-transparent px-4 text-[13px] font-medium text-[#5E554A] transition-colors duration-150 hover:bg-[#EFE9DF] hover:text-[#1F1B16]"
              >
                <span>List your storefront</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>

            {/* Honest product facts */}
            <div className="mt-10 grid grid-cols-1 gap-4 border-t border-[#E6E0D6] pt-6 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[13px] font-medium text-[#1F1B16]">
                  Rs. 0 to claim
                </p>
                <p className="mt-0.5 text-[13px] text-[#7B7266]">
                  Reserve a pass online and pay at the counter
                </p>
              </div>
              <Link to="/deals?view=map" className="group block cursor-pointer">
                <p className="font-mono text-[13px] font-medium text-[#1F1B16] group-hover:text-[#D94832] transition-colors">
                  Live map pins →
                </p>
                <p className="mt-0.5 text-[13px] text-[#7B7266]">
                  Filter active offers by street distance
                </p>
              </Link>
              <div>
                <p className="font-mono text-[13px] font-medium text-[#1F1B16]">
                  QR counter pass
                </p>
                <p className="mt-0.5 text-[13px] text-[#7B7266]">
                  Instant verification with serial code
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Interactive Live Voucher Ticket Switcher */}
          <div
            ref={addRef}
            className="reveal lg:col-span-5"
            style={{ transitionDelay: "80ms" }}
          >
            <div className="mx-auto max-w-[440px]">
              {/* Pass Switcher Control Bar */}
              <div className="mb-2.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  {SAMPLE_PASSES.map((pass, idx) => (
                    <button
                      key={pass.id}
                      type="button"
                      onClick={() => handleSwitchPass(idx)}
                      className={`h-7 rounded-md px-2.5 font-mono text-[11px] transition-colors duration-150 cursor-pointer ${
                        idx === activePassIndex
                          ? "bg-[#1F1B16] font-medium text-[#FDFBF7]"
                          : "border border-[#E6E0D6] bg-[#FDFBF7] text-[#7B7266] hover:text-[#1F1B16]"
                      }`}
                    >
                      0{idx + 1} · {pass.discount}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleSwitchPass(
                        (activePassIndex - 1 + SAMPLE_PASSES.length) %
                          SAMPLE_PASSES.length
                      )
                    }
                    aria-label="Previous sample pass"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E0D6] bg-[#FDFBF7] text-[#5E554A] transition-colors hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
                  >
                    <ChevronLeft size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSwitchPass(
                        (activePassIndex + 1) % SAMPLE_PASSES.length
                      )
                    }
                    aria-label="Next sample pass"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E0D6] bg-[#FDFBF7] text-[#5E554A] transition-colors hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
                  >
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Voucher Ticket Card */}
              <div className="rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-5 shadow-[0_4px_20px_rgba(31,27,22,0.06)]">
                {/* Top receipt header */}
                <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-[5px] bg-[#D94832] px-2 py-0.5 font-mono text-[11px] font-medium text-white">
                      {activePass.discount}
                    </span>
                    <span className="text-[12px] font-medium text-[#5E554A]">
                      {activePass.category}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#5E554A] tabular-nums">
                    <Clock3
                      size={13}
                      strokeWidth={1.5}
                      className="text-[#D94832]"
                    />
                    {formatDuration(timers[activePassIndex])}
                  </span>
                </div>

                {/* Deal preview image & merchant details */}
                <div className="mt-4 overflow-hidden rounded-lg border border-[#E6E0D6] bg-[#EFE9DF]">
                  <div className="relative h-44 w-full">
                    <img
                      src={activePass.image}
                      alt={activePass.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#1F1B16]/85 px-2.5 py-1 text-[11px] font-medium text-[#FDFBF7] backdrop-blur-sm">
                      <MapPin
                        size={12}
                        strokeWidth={1.5}
                        className="text-[#D94832]"
                      />
                      <span>{activePass.neighborhood}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[12px] font-medium text-[#7B7266]">
                    {activePass.merchant}
                  </p>
                  <h2 className="mt-1 text-[18px] font-medium leading-snug text-[#1F1B16]">
                    {activePass.title}
                  </h2>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-[22px] font-medium text-[#1F1B16]">
                        Rs. {activePass.price.toLocaleString()}
                      </span>
                      <span className="text-[13px] text-[#7B7266] line-through">
                        Rs. {activePass.oldPrice.toLocaleString()}
                      </span>
                    </div>
                    <span className="font-mono text-[12px] text-[#166534] tabular-nums">
                      {activePass.remaining} passes left
                    </span>
                  </div>
                </div>

                {/* Signature perforated voucher divider */}
                <div className="ticket-divider my-5" />

                {/* Interactive Bottom Voucher Stub */}
                {scanSimulated ? (
                  <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={18}
                          strokeWidth={1.75}
                          className="mt-0.5 shrink-0 text-[#166534]"
                        />
                        <div>
                          <p className="text-[13px] font-medium text-[#166534]">
                            Counter pass verified · Saved Rs.{" "}
                            {savings.toLocaleString()}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#166534]/80">
                            Serial {activePass.serial} marked redeemed at POS
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setScanSimulated(false)}
                        className="inline-flex items-center gap-1 rounded border border-[#BBF7D0] bg-white px-2 py-1 text-[11px] font-medium text-[#166534] hover:bg-[#DCFCE7] cursor-pointer"
                      >
                        <RotateCcw size={11} strokeWidth={1.5} />
                        Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-[#7B7266]">
                          Counter voucher serial
                        </p>
                        <button
                          type="button"
                          onClick={() => setScanSimulated(true)}
                          className="rounded border border-[#E6E0D6] bg-[#F7F4EE] px-2 py-0.5 text-[11px] font-medium text-[#D94832] transition-colors hover:border-[#D94832]/40 hover:bg-[#EFE9DF] cursor-pointer"
                        >
                          Simulate counter scan
                        </button>
                      </div>
                      <p className="mt-0.5 font-mono text-[14px] font-medium tracking-tight text-[#1F1B16]">
                        {activePass.serial}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-[#5E554A]">
                        <Check
                          size={13}
                          strokeWidth={1.5}
                          className="text-[#166534]"
                        />
                        <span>{activePass.windowText}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setScanSimulated(true)}
                      title="Click to simulate cashier QR scan"
                      className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#E6E0D6] bg-white p-2 text-[#1F1B16] transition-colors hover:border-[#D94832] cursor-pointer"
                    >
                      <QrCode
                        size={36}
                        strokeWidth={1.5}
                        className="transition-colors group-hover:text-[#D94832]"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
