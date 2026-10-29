import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "../data/categories";

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

          <button
            onClick={() => navigate("/categories")}
            className="hidden text-[14px] font-semibold text-[#4A4A4A] transition-colors hover:text-[#E8503A] sm:block cursor-pointer"
          >
            View all →
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category, i) => {
            const Icon = category.icon;

            return (
              <button
                key={category.name}
                onClick={() => navigate(`/category/${category.slug || category.name.toLowerCase()}`)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-[#F0F0F0] bg-white p-5 transition-all duration-200 hover:border-[#E8E8E8] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F5F2] text-[#4A4A4A] transition-colors duration-200 group-hover:text-white"
                  style={{
                    "--hover-bg": category.color || "#1A1A1A",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = category.color || "#1A1A1A")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <div className="text-center">
                  <p className="text-[13px] font-bold text-[#4A4A4A] group-hover:text-[#1A1A1A]">
                    {category.name}
                  </p>
                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-[#E8503A]">
                    Explore &rarr;
                  </span>
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