import { useEffect, useRef } from "react";

function Testimonials() {
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

  const notes = [
    {
      text: "Claimed an afternoon coffee and pastry pass two streets away from my office on Duplication Road. Showed the QR code at the register and paid the discounted LKR rate directly.",
      name: "Nadeesha K.",
      role: "Shopper · Kollupitiya",
      initials: "NK",
      serial: "HMU-4108",
    },
    {
      text: "Instead of discounting our full menu all week, we release 15 counter passes between 3 PM and 6 PM when tables are quiet. The POS lookup verifies each serial in seconds.",
      name: "M. Rizwan",
      role: "Cafe owner · Wellawatte",
      initials: "MR",
      serial: "HMU-7824",
    },
    {
      text: "The map view makes it easy to see which bakeries and salons actually have passes left before walking over, rather than guessing if a promotion is still valid.",
      name: "Dilshan S.",
      role: "Shopper · Nugegoda",
      initials: "DS",
      serial: "HMU-5931",
    },
  ];

  return (
    <section className="border-b border-[#E6E0D6] bg-[#FDFBF7] py-20">
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <p className="text-[13px] font-medium text-[#7B7266]">
          In the neighborhood
        </p>

        <h2 className="mt-1.5 text-[28px] sm:text-[32px] font-medium tracking-[-0.025em] text-[#1F1B16]">
          How shoppers and counters use HitMeUp
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {notes.map((item) => (
            <div
              key={item.name}
              className="flex flex-col justify-between rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-6"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#7B7266]">
                  <span>Verified redemption</span>
                  <span>{item.serial}</span>
                </div>
                <p className="mt-4 text-[14px] leading-[1.65] text-[#1F1B16]">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-[#E6E0D6] pt-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] font-mono text-[12px] font-medium text-[#1F1B16]">
                  {item.initials}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#1F1B16]">
                    {item.name}
                  </p>
                  <p className="text-[12px] text-[#7B7266]">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
