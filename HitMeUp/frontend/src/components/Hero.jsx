import {
  Search,
  MapPin,
  Clock3,
  ShieldCheck,
} from "lucide-react";

function Hero() {
  return (
    <section
      id="home"
      className="overflow-hidden bg-[#F9F9F9]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">

        {/* Left */}
        <div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-[#FF4A2F]">
            <span>🔥</span>
            Great Deals, Right Now!
          </div>

          <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight text-[#141922] sm:text-6xl lg:text-7xl">
            Big Savings,
            <br />
            <span className="text-[#FF4A2F]">
              Local Deals!
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Discover amazing deals from your favorite local
            businesses. Save more, do more!
          </p>

          {/* Search */}
          <div className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-gray-100 sm:flex-row">

            <div className="flex flex-1 items-center gap-3 px-4">
              <Search
                size={21}
                className="text-gray-400"
              />

              <input
                type="text"
                placeholder="Search deals, restaurants, shops..."
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>

            <button className="rounded-xl bg-[#FF4A2F] px-7 py-3 font-bold text-white transition hover:bg-[#C72814]">
              Search
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-[#1FA061]">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#141922]">
                  Save Money
                </p>
                <p className="text-xs text-gray-500">
                  Get the best deals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#FF4A2F]">
                <MapPin size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#141922]">
                  Support Local
                </p>
                <p className="text-xs text-gray-500">
                  Shop local, grow local
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-[#F5A719]">
                <Clock3 size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#141922]">
                  Limited Time
                </p>
                <p className="text-xs text-gray-500">
                  Don't miss out
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right */}
        <div className="relative hidden lg:block">

          <div className="absolute right-5 top-5 z-10 rotate-6 rounded-full bg-[#FF4A2F] px-7 py-5 text-center font-black text-white shadow-xl">
            <div className="text-sm">UP TO</div>
            <div className="text-3xl leading-none">50%</div>
            <div className="text-sm">OFF</div>
          </div>

          <div className="relative overflow-hidden rounded-[40px]">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85"
              alt="Delicious burger deal"
              className="h-[500px] w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white p-5 shadow-2xl">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF4A2F]">
                    Food & Beverage
                  </span>

                  <h3 className="mt-3 text-xl font-black text-[#141922]">
                    Chicken Burger
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Burger House
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-[#FF4A2F]">
                    $4.99
                  </p>

                  <p className="text-sm text-gray-400 line-through">
                    $8.00
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-xl bg-[#FF4A2F] py-3 font-bold text-white hover:bg-[#C72814]">
                Grab Deal
              </button>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;