import { categories } from "../data/categories";
import { useEffect, useRef } from "react";

function CategorySection() {
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

  return (
    <section
      id="categories"
      className="border-t border-[#F0F0F0] bg-white py-20"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#E8503A]">
              Browse by category
            </p>
            <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-[#1A1A1A]">
              What are you looking for?
            </h2>
          </div>

          <button className="hidden text-[14px] font-semibold text-[#4A4A4A] transition-colors hover:text-[#1A1A1A] sm:block">
            View all →
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category, i) => {
            const Icon = category.icon;

            return (
              <button
                key={category.name}
                className="group flex flex-col items-center gap-3 rounded-xl border border-[#F0F0F0] bg-white p-5 transition-all duration-200 hover:border-[#E8E8E8] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F5F2] text-[#4A4A4A] transition-colors duration-200 group-hover:bg-[#1A1A1A] group-hover:text-white">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <p className="text-[12px] font-semibold text-[#4A4A4A] group-hover:text-[#1A1A1A]">
                  {category.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;