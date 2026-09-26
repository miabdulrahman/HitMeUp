import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

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
        <div className="absolute inset-0 bg-[#1A1A1A]/70" />
        {/* Subtle gradient at bottom for section transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[1200px] px-6 pb-24 pt-36 lg:pb-32 lg:pt-44">

        <div
          ref={addRef}
          className="reveal mx-auto max-w-[720px] text-center"
        >
          <p className="mb-5 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
            Flash deal marketplace
          </p>

          <h1 className="text-[clamp(2.5rem,6vw,4.8rem)] font-black leading-[1.05] tracking-[-0.04em] text-white">
            Discover deals nearby.
            <br />
            <span className="serif text-[#E8503A]">Redeem instantly.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.7] text-white/70">
            HitMeUp connects you with limited-time offers from local businesses.
            Purchase deals, get digital vouchers, and redeem with QR — all in real time.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#signup"
              className="group flex items-center gap-2 rounded-lg bg-[#E8503A] px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#D4402C] hover:shadow-lg hover:shadow-[#E8503A]/25"
            >
              Start exploring
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>

            <a
              href="#for-business"
              className="rounded-lg border border-white/20 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/15"
            >
              List your business
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div
          ref={addRef}
          className="reveal mx-auto mt-20 max-w-[640px] rounded-2xl border border-white/10 bg-white/10 px-8 py-6 backdrop-blur-md"
          style={{ transitionDelay: "0.15s" }}
        >
          <div className="flex items-center justify-center gap-10 sm:gap-16">
            {[
              { value: "500+", label: "Active deals" },
              { value: "200+", label: "Businesses" },
              { value: "10K+", label: "Happy users" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-[26px] font-black tracking-[-0.02em] text-white">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[13px] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;