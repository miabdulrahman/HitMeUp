import { useState, useRef, useEffect } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How do I claim and use a counter pass?",
    a: "Browse the live map or feed, select an active deal from a nearby shop, and tap claim pass. You receive an instant digital voucher with a verified serial code and scannable QR code stored in your account. When you walk in to the shop, show the code at the cashier counter to receive your discount."
  },
  {
    q: "Is reserving a voucher pass completely free?",
    a: "Yes. Claiming a standard walk in pass costs zero Sri Lankan rupees online. You only pay for your items at the merchant counter with the agreed markdown applied."
  },
  {
    q: "What happens if a store runs out of stock before I arrive?",
    a: "Merchants on HitMeUp set strict quantity caps on every active batch. When you reserve a pass, your portion is held from that capped inventory until the reservation timer expires, preventing awkward walk in surprises."
  },
  {
    q: "Can I pay online or do I pay at the shop register?",
    a: "Both options are supported. You can reserve passes with zero upfront cost and settle at the counter, or complete secure card checkout online through HitMeUp Pay to guarantee a prepaid voucher before walking over."
  },
  {
    q: "How long does a claimed voucher pass stay active?",
    a: "Every flash batch has a clearly marked countdown timer, usually ranging between two and six hours during quiet store windows. Make sure to visit and redeem before the batch countdown closes."
  },
  {
    q: "I own a neighborhood store. How do I publish timed passes?",
    a: "Click register storefront in the header, complete your free business profile, and you can publish your first batch in under three minutes. You choose the discount percentage, available pass quantity, and active hours."
  },
  {
    q: "Do merchants need special hardware or expensive scanners?",
    a: "No special hardware is required. Cashiers simply open the HitMeUp merchant dashboard on any smartphone or counter browser and enter the six character serial code or scan the customer QR code."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
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

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <section id="faq" className="border-b border-[#E6E0D6] bg-[#F7F4EE] py-20">
      <div ref={sectionRef} className="reveal mx-auto max-w-[820px] px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E6E0D6] bg-[#FDFBF7] px-3 py-1 text-xs font-medium text-[#7B7266]">
            <HelpCircle size={14} className="text-[#D94832]" />
            <span>Questions and answers</span>
          </div>

          {/* Heading 4: text-3xl, Semibold (Rule B1) */}
          <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1F1B16] [text-wrap:balance]">
            Everything you need to know about HitMeUp
          </h2>

          {/* Body 3: text-base, Regular (Rule B1) */}
          <p className="mt-3 text-base font-normal leading-relaxed text-[#5E554A] [text-wrap:pretty]">
            Clear answers for neighborhood shoppers and local store owners.
          </p>
        </div>

        {/* FAQ Accordion List (Rule B3 nested radius: outer rounded-2xl, inner items rounded-xl) */}
        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  {/* Title 3: text-base, Medium (Rule B1) */}
                  <span className="text-base font-medium text-[#1F1B16] pr-4 [text-wrap:pretty]">
                    {item.q}
                  </span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? "rotate-180 text-[#D94832]" : ""
                    }`}
                  >
                    <ChevronDown size={15} strokeWidth={1.75} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#E6E0D6]/70 px-5 pt-3 pb-5 text-sm font-normal leading-relaxed text-[#5E554A] [text-wrap:pretty]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

