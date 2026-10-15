import { useEffect, useRef } from "react";

function HowItWorks() {
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

  const steps = [
    {
      number: "01",
      title: "Discover",
      description: "Browse deals nearby, search by category, or get AI-powered recommendations based on your preferences.",
    },
    {
      number: "02",
      title: "Purchase",
      description: "Grab the deal before time runs out. Pay securely through our verified payment gateway.",
    },
    {
      number: "03",
      title: "Get your voucher",
      description: "Receive a digital voucher with a unique QR code instantly after your purchase is confirmed.",
    },
    {
      number: "04",
      title: "Redeem",
      description: "Walk into the business, show your QR code, and enjoy your deal. It's that simple.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-[#1A1A1A] py-24"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="mx-auto max-w-[500px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#E8503A]">
            How it works
          </p>

          <h2 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-white">
            Four steps to savings
          </h2>

          <p className="mt-3 text-[15px] leading-[1.7] text-[#8A8A8A]">
            From finding a deal to redeeming it at the door.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative bg-[#1A1A1A] p-8 transition-colors duration-300 hover:bg-[#222]"
            >
              <span className="text-[48px] font-black leading-none text-white/[0.04]">
                {step.number}
              </span>

              <h3 className="mt-2 text-[18px] font-bold text-white">
                {step.title}
              </h3>

              <p className="mt-3 text-[14px] leading-[1.7] text-[#6A6A6A]">
                {step.description}
              </p>

              <div className="mt-6 h-[2px] w-8 bg-[#E8503A] transition-all duration-300 group-hover:w-12" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;