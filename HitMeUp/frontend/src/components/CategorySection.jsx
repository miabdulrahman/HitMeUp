import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { categories } from "../data/categories";

const CATEGORY_SUBTITLES = {
  food: "Cafes & bakeries",
  fashion: "Apparel & footwear",
  electronics: "Audio & accessories",
  home: "Decor & cleaning",
  health: "Spas & clinics",
  sports: "Gyms & courts",
  services: "Salons & detailing",
  games: "Arcades & lounges",
};

function CategorySection() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();

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
      className="border-b border-[#E6E0D6] bg-[#F7F4EE] py-20"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-[#7B7266]">
              Browse by category
            </p>
            <h2 className="mt-1.5 text-[28px] font-medium tracking-[-0.025em] text-[#1F1B16]">
              What are you looking for today?
            </h2>
          </div>

          <button
            onClick={() => navigate("/categories")}
            className="hidden items-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-3.5 py-2 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF] sm:inline-flex cursor-pointer"
          >
            <span>All categories</span>
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const subtitle =
              CATEGORY_SUBTITLES[category.slug] || "Local passes";

            return (
              <button
                key={category.name}
                onClick={() =>
                  navigate(`/category/${category.slug || category.name.toLowerCase()}`)
                }
                className="group flex flex-col items-start justify-between gap-5 rounded-xl border border-[#E6E0D6] bg-[#FDFBF7] p-4 text-left transition-colors duration-150 hover:border-[#1F1B16]/35 hover:bg-[#EFE9DF]/65 cursor-pointer"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] text-[#5E554A] transition-colors duration-150 group-hover:border-[#1F1B16] group-hover:bg-[#1F1B16] group-hover:text-[#FDFBF7]">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                    className="text-[#7B7266] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  />
                </div>

                <div>
                  <p className="text-[14px] font-medium text-[#1F1B16]">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7B7266]">
                    {subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
