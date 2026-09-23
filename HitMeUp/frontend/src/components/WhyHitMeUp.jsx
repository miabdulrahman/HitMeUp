import {
  Zap,
  MapPin,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

function WhyHitMeUp() {
  const features = [
    {
      icon: Zap,
      title: "Exclusive Deals",
      description: "Get access to limited-time offers and flash deals.",
    },
    {
      icon: MapPin,
      title: "Local Businesses",
      description: "Support your community and shop local.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      description: "Your transactions are safe and protected.",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Find and redeem deals on the go.",
    },
  ];

  return (
    <section
      id="about"
      className="bg-white py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#FF4A2F]">
              Why Choose HitMeUp
            </p>

            <h2 className="mt-3 text-4xl font-black text-[#141922]">
              More Than Just Deals
            </h2>

            <p className="mt-5 max-w-md leading-7 text-gray-600">
              We make it easy to find the best local offers,
              so you can save time and money while supporting
              businesses around you.
            </p>

            <button className="mt-7 rounded-xl bg-[#FF4A2F] px-6 py-3 font-bold text-white hover:bg-[#C72814]">
              Explore Deals →
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-100 p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#FF4A2F]">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-[#141922]">
                    {feature.title}
                  </h3>

                  <p className="mt-2 leading-6 text-gray-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

export default WhyHitMeUp;