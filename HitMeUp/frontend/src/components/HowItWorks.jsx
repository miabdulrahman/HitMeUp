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
      className="bg-[#F9F9F9] py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-[#FF4A2F]">
            Simple Process
          </p>

          <h2 className="mt-3 text-4xl font-black text-[#141922]">
            How It Works
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Getting amazing deals is easy. Just follow these
            simple steps and start saving today.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative rounded-2xl bg-white p-8 text-center shadow-sm"
              >
                <div className="absolute right-6 top-5 text-5xl font-black text-orange-100">
                  {step.number}
                </div>

                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF4A2F] text-white">
                  <Icon size={28} />
                </div>

                <h3 className="mt-6 text-xl font-black text-[#141922]">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-gray-500">
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