import {
  Search,
  Tag,
  Store,
} from "lucide-react";

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Search,
      title: "Find Deals",
      description:
        "Browse local deals or search for your favorite categories.",
    },
    {
      number: "02",
      icon: Tag,
      title: "Grab the Deal",
      description:
        "Click and claim your discounted offer before it expires.",
    },
    {
      number: "03",
      icon: Store,
      title: "Enjoy & Save",
      description:
        "Visit the business and enjoy your savings!",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-[#172026] py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#ff9b7e]">
            The HitMeUp loop
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            From nearby to redeemed
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[#aab5b6]">
            Find a live offer, claim it before the clock runs out, and show
            your voucher when you arrive.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur-sm"
              >
                <div className="absolute right-6 top-5 text-5xl font-black text-white/10">
                  {step.number}
                </div>

                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ef5738] text-white">
                  <Icon size={28} />
                </div>

                <h3 className="mt-6 text-xl font-black text-white">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-[#aab5b6]">
                  {step.description}
                </p>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;