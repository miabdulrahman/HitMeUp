import { categories } from "../data/categories";

function CategorySection() {
  return (
    <section
      id="categories"
      className="bg-white py-16"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#FF4A2F]">
              Explore
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#141922]">
              Shop by Category
            </h2>
          </div>

          <button className="hidden font-bold text-[#FF4A2F] sm:block">
            View All →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <button
                key={category.name}
                className="group rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${category.color}`}
                >
                  <Icon
                    size={28}
                    className="text-[#FF4A2F]"
                  />
                </div>

                <p className="mt-4 text-sm font-bold text-[#141922]">
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