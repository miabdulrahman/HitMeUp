import { useEffect, useRef } from "react";

function WhyHitMeUp() {
  const sectionRef = useRef(null);

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

  const features = [
    {
      title: "Street level map browsing",
      description:
        "See which shops on your street have active passes right now and filter by walking distance.",
    },
    {
      title: "Serial QR voucher passes",
      description:
        "Every claimed deal issues a unique HMU serial code and QR pass you can present at the counter.",
    },
    {
      title: "Personalized suggestions",
      description:
        "Surface lunch, afternoon coffee, or retail markdowns matched to your saved categories and time of day.",
    },
    {
      title: "Pay online or at the register",
      description:
        "Reserve free counter passes online or complete card checkout before you arrive.",
    },
    {
      title: "Guaranteed stock counts",
      description:
        "Merchants cap the exact number of passes per batch so offers stay honored when you walk in.",
    },
    {
      title: "Saved shops and verified reviews",
      description:
        "Bookmark neighborhood merchants and read feedback from shoppers who redeemed passes in person.",
    },
  ];

  return (
    <section
      id="about"
      className="border-b border-[#E6E0D6] bg-[#FDFBF7] py-20"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* Left: sticky heading */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="font-mono text-xs uppercase tracking-wider text-[#7B7266]">
              Why HitMeUp
            </span>

            {/* Heading 4: text-3xl / 36, Semibold (Rule B1) */}
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-[#1F1B16] [text-wrap:balance]">
              Built for how people
              <br />
              actually shop locally
            </h2>

            {/* Body 3: text-base / 24, Regular (Rule B1) */}
            <p className="mt-4 max-w-[38ch] text-base font-normal leading-relaxed text-[#5E554A] [text-wrap:pretty]">
              Instead of expired coupon codes or cluttered leaflets, HitMeUp
              issues live counter passes tied to real inventory at nearby stores.
            </p>
          </div>

          {/* Right: Hairline ledger grid with B3 nested radii */}
          <div className="grid gap-px overflow-hidden rounded-xl border border-[#E6E0D6] bg-[#E6E0D6] sm:grid-cols-2">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="bg-[#FDFBF7] p-6 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#F7F4EE]"
              >
                <span className="font-mono text-xs text-[#7B7266] tabular-nums">
                  0{idx + 1}
                </span>
                {/* Title 3: text-base, Medium (Rule B1) */}
                <h3 className="mt-2 text-base font-medium text-[#1F1B16]">
                  {feature.title}
                </h3>
                {/* Body 6: text-sm, Regular (Rule B1) */}
                <p className="mt-2 text-sm font-normal leading-relaxed text-[#5E554A] [text-wrap:pretty]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyHitMeUp;
