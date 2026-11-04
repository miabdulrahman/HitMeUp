import {
  ArrowRight,
  MapPin,
  Search,
  Navigation,
  Store,
  QrCode,
  Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const HERO_SCENES = [
  {
    id: "street-market",
    image: "/hero-cover.jpg",
    label: "Evening Street Market · Walk-in Deals",
  },
  {
    id: "artisan-cafe",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=85",
    label: "Cafes & Bakeries · Colombo 04",
  },
  {
    id: "local-dining",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=85",
    label: "Neighborhood Dining & Retail · Galle Road",
  },
];

const NEIGHBORHOODS = [
  "Bambalapitiya",
  "Wellawatte",
  "Kollupitiya",
  "Nugegoda",
  "Mount Lavinia",
];

function Hero() {
  const revealRefs = useRef([]);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [activeScene, setActiveScene] = useState(0);

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

  // Auto-advance background scene every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % HERO_SCENES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

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

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden border-b border-[#E6E0D6] bg-[#14110E] pt-24 pb-12 lg:pt-28 lg:pb-14"
    >
      {/* Full-Screen Animated Image Background Slideshow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {HERO_SCENES.map((scene, index) => {
          const isCurrent = index === activeScene;
          return (
            <div
              key={scene.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                isCurrent ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                key={isCurrent ? `${scene.id}-active` : scene.id}
                src={scene.image}
                alt=""
                aria-hidden="true"
                loading={index === 0 ? "eager" : "lazy"}
                className={`h-full w-full object-cover object-center ${
                  isCurrent ? "hero-bg-zoom" : ""
                }`}
              />
            </div>
          );
        })}

        {/* Multi-layer warm charcoal scrim for sharp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#14110E]/85 via-[#14110E]/65 to-[#14110E]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,17,14,0.25)_0%,rgba(20,17,14,0.78)_100%)]" />
      </div>

      {/* Main Centered Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
        <div ref={addRef} className="reveal mx-auto max-w-[820px] text-center">
          {/* Location Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12px] font-medium text-[#FDFBF7] backdrop-blur-md">
            <MapPin size={13} strokeWidth={1.5} className="text-[#FF7A59]" />
            <span>Neighborhood flash deals across Sri Lanka</span>
          </div>

          {/* Display Headline */}
          <h1 className="text-[clamp(2.5rem,5.6vw,4.6rem)] font-medium leading-[1.05] tracking-[-0.035em] text-[#FDFBF7] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            Flash deals from the shops{" "}
            <span className="serif font-normal text-[#FF8A6B]">
              around the corner
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-[620px] text-[16px] leading-[1.7] text-[#E6E0D6] sm:text-[17px]">
            Cafes, bakeries, salons, and retail counters post short-window
            discounts when tables or shelves are quiet. Claim a free voucher pass
            online and scan your QR code at the shop counter.
          </p>

          {/* Interactive Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mx-auto mt-8 flex max-w-[600px] flex-col gap-2 rounded-2xl border border-white/20 bg-[#FDFBF7] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center"
          >
            <label className="relative flex flex-1 items-center">
              <span className="sr-only">Search deals</span>
              <Search
                size={18}
                strokeWidth={1.5}
                className="pointer-events-none ml-3.5 text-[#7B7266]"
              />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search coffee, bakery, salon, or street..."
                className="h-12 w-full bg-transparent px-3 text-[15px] text-[#1F1B16] placeholder-[#7B7266] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D94832] px-6 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26] active:scale-[0.98] cursor-pointer"
            >
              <span>Find passes</span>
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </form>

          {/* Quick Neighborhood Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12px] text-[#CFC6B8]">Popular areas:</span>
            {NEIGHBORHOODS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => handleSelectNeighborhood(area)}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-[12px] text-[#FDFBF7] backdrop-blur-sm transition-colors duration-150 hover:border-white/35 hover:bg-white/20 cursor-pointer"
              >
                {area}
              </button>
            ))}
          </div>

          {/* Secondary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 text-[14px]">
            <Link
              to="/deals?view=map"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 font-medium text-[#FDFBF7] backdrop-blur-md transition-colors duration-150 hover:border-white/40 hover:bg-white/20"
            >
              <Navigation
                size={15}
                strokeWidth={1.5}
                className="text-[#FF8A6B]"
              />
              <span>Explore street map</span>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#1F1B16]/60 px-5 py-2.5 font-medium text-[#E6E0D6] backdrop-blur-md transition-colors duration-150 hover:border-white/30 hover:bg-[#1F1B16]/85 hover:text-white"
            >
              <Store size={15} strokeWidth={1.5} />
              <span>Own a shop? List your storefront</span>
            </Link>
          </div>

          {/* Product Pillars */}
          <div className="mx-auto mt-9 grid max-w-[780px] grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-[#1F1B16]/70 p-3.5 text-center backdrop-blur-md">
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[#FF8A6B]">
                <Tag size={14} strokeWidth={1.5} />
              </div>
              <p className="font-mono text-[14px] font-medium text-[#FDFBF7]">
                Rs. 0 to claim
              </p>
              <p className="mt-1 text-[12px] text-[#CFC6B8]">
                Reserve a pass online and pay at the counter
              </p>
            </div>

            <Link
              to="/deals?view=map"
              className="group block rounded-xl border border-white/15 bg-[#1F1B16]/70 p-3.5 text-center backdrop-blur-md transition-colors hover:border-[#FF8A6B]/50 hover:bg-[#1F1B16]/85"
            >
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[#FF8A6B]">
                <MapPin size={14} strokeWidth={1.5} />
              </div>
              <p className="font-mono text-[14px] font-medium text-[#FDFBF7] group-hover:text-[#FF8A6B] transition-colors">
                Live street pins →
              </p>
              <p className="mt-1 text-[12px] text-[#CFC6B8]">
                Filter active offers by street distance
              </p>
            </Link>

            <div className="rounded-xl border border-white/15 bg-[#1F1B16]/70 p-3.5 text-center backdrop-blur-md">
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[#FF8A6B]">
                <QrCode size={14} strokeWidth={1.5} />
              </div>
              <p className="font-mono text-[14px] font-medium text-[#FDFBF7]">
                QR counter pass
              </p>
              <p className="mt-1 text-[12px] text-[#CFC6B8]">
                Instant verification with serial code
              </p>
            </div>
          </div>

          {/* Scene Switcher Controls */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#14110E]/65 px-4 py-1.5 backdrop-blur-md">
            <span className="font-mono text-[11px] text-[#CFC6B8]">
              {HERO_SCENES[activeScene].label}
            </span>
            <div className="flex items-center gap-1.5">
              {HERO_SCENES.map((scene, idx) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveScene(idx)}
                  aria-label={`Show ${scene.label}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeScene
                      ? "w-5 bg-[#FF7A59]"
                      : "w-1.5 bg-white/35 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
