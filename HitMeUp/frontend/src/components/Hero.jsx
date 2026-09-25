import {
  ArrowRight,
  Clock3,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Ticket,
  Zap,
} from "lucide-react";

function Hero() {
  return (
    <section
      id="home"
      className="overflow-hidden bg-[#f5f2ea]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">

        {/* Left */}
        <div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ffcfb9] bg-white/70 px-4 py-2 text-sm font-bold text-[#d9462b] shadow-sm">
            <Zap size={15} fill="currentColor" />
            Real-time deals, right around you
          </div>

          <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-[#172026] sm:text-6xl lg:text-7xl">
            Your city is
            <br />
            <span className="editorial-display text-[#ef5738]">
              full of good finds.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#596267]">
            HitMeUp connects you with limited-time offers from local businesses
            while they are still fresh, close, and ready to redeem.
          </p>

          {/* Search */}
          <div className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_18px_50px_rgba(63,48,34,0.12)] ring-1 ring-black/5 sm:flex-row">

            <div className="flex flex-1 items-center gap-3 px-4">
              <Search
                size={21}
                className="text-[#ef5738]"
              />

              <input
                type="text"
                placeholder="Search pizza, coffee, salons..."
                className="w-full bg-transparent py-3 text-sm text-[#172026] outline-none placeholder:text-[#9aa1a2]"
              />
            </div>

            <button className="flex items-center justify-center gap-2 rounded-xl bg-[#ef5738] px-7 py-3 font-bold text-white transition hover:bg-[#c93e27]">
              Search
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dceee4] text-[#218052]">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172026]">
                  Better value
                </p>
                <p className="text-xs text-[#7b8587]">
                  Spend less nearby
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffe4d8] text-[#ef5738]">
                <MapPin size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172026]">
                  Stay local
                </p>
                <p className="text-xs text-[#7b8587]">
                  Discover your city
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0c9] text-[#b77a16]">
                <Clock3 size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172026]">
                  Act in time
                </p>
                <p className="text-xs text-[#7b8587]">
                  Flash deals move fast
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right */}
        <div className="relative hidden min-h-[560px] lg:block">

          <div className="absolute right-0 top-0 z-20 rotate-3 rounded-2xl bg-[#172026] px-6 py-4 text-white shadow-xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffb49d]">Live nearby</div>
            <div className="mt-1 text-3xl font-black leading-none">18 deals</div>
            <div className="mt-1 text-xs text-white/60">within 2 km of you</div>
          </div>

          <div className="relative mt-8 overflow-hidden rounded-[32px] bg-[#172026] p-3 shadow-[0_26px_70px_rgba(63,48,34,0.18)]">
            <img
              src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85"
              alt="A local restaurant ready for customers"
              className="h-[510px] w-full rounded-[24px] object-cover"
            />

            <div className="absolute inset-3 rounded-[24px] bg-gradient-to-t from-[#172026]/90 via-[#172026]/5 to-transparent" />

            <div className="absolute left-8 top-8 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-[#172026] shadow-lg">
              <Navigation size={14} className="text-[#ef5738]" fill="currentColor" />
              Around you now
            </div>

            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-[#172026]/95 p-5 text-white shadow-2xl backdrop-blur">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-[#ffe4d8] px-3 py-1 text-xs font-bold text-[#d9462b]">
                    2 min away · Food & Beverage
                  </span>

                  <h3 className="mt-3 text-xl font-black text-white">
                    40% off dinner for two
                  </h3>

                  <p className="mt-1 flex items-center gap-1 text-sm text-white/60">
                    <MapPin size={14} />
                    The Garden Table
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-[#ff9b7e]">
                    Rs. 1,200
                  </p>

                  <p className="text-sm text-white/40 line-through">
                    Rs. 2,000
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                  <Clock3 size={15} className="text-[#ff9b7e]" />
                  42 minutes left
                </div>

                <button className="flex items-center gap-2 rounded-xl bg-[#ef5738] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#c93e27]">
                  Grab deal
                  <Ticket size={16} />
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;