import { deals } from "../data/deals";
import DealCard from "./DealCard";

function FeaturedDeals() {
  return (
    <section
      id="deals"
      className="bg-[#F9F9F9] py-16"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#FF4A2F]">
              Don't Miss Out
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#141922]">
              Featured Deals
            </h2>
          </div>

          <button className="font-bold text-[#FF4A2F]">
            View All Deals →
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export default FeaturedDeals;