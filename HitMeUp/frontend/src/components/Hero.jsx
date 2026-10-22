import { ArrowDown, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function Hero() {
  const revealRefs = useRef([]);

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

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <img
          src="/hero-cover.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          aria-hidden="true"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-[#1A1A1A]/65 to-[#1A1A1A]/80" />
        {/* Subtle gradient at bottom for section transition */}

      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-screen max-w-[1200px] flex-col justify-center px-6 pb-28 pt-32 lg:pb-32 lg:pt-36">

        <div
          ref={addRef}
          className="reveal mx-auto max-w-[720px] text-center"
        >
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            <Sparkles size={13} className="text-[#FFD19A]" />
            Flash deal marketplace
          </p>

          <h1 className="text-[clamp(2.65rem,6vw,5rem)] font-black leading-[1.02] tracking-[-0.055em] text-white">
            Your next great deal
            <br />
            <span className="serif text-[#FF8C73]">is closer than you think.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-[560px] text-[16px] leading-[1.75] text-white/75 sm:text-[17px]">
            Discover limited-time offers from local businesses, save more on
            what you love, and redeem your digital voucher in seconds.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#E8503A] px-7 py-3.5 text-[15px] font-bold text-white transition-all duration-200 hover:bg-[#D4402C] hover:shadow-lg hover:shadow-[#E8503A]/25"
            >
              Start exploring
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#for-business"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/15"
            >
              <MapPin size={16} />
              List your business
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div
          ref={addRef}
          className="reveal mx-auto mt-16 w-full max-w-[680px] rounded-2xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur-md sm:px-8 sm:py-6"
          style={{ transitionDelay: "0.15s" }}
        >
          <div className="grid grid-cols-3 divide-x divide-white/15">
            {[
              { value: "500+", label: "Active deals" },
              { value: "200+", label: "Businesses" },
              { value: "10K+", label: "Happy users" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-[24px] font-black tracking-[-0.02em] text-white sm:text-[28px]">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[13px] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <a
          href="#categories"
          className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 transition hover:text-white sm:flex"
        >
          Explore nearby
          <ArrowDown size={14} className="animate-bounce" />
        </a>

      </div>
    </section>
  );
}

export default Hero;