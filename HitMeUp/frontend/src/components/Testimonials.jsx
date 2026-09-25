import { Star } from "lucide-react";

function Testimonials() {
  const testimonials = [
    {
      name: "Sarah M.",
      role: "Happy Customer",
      text: "HitMeUp helps me find amazing deals near my area. I save money and discover new places!",
      image:
        "https://i.pravatar.cc/100?img=47",
    },
    {
      name: "John D.",
      role: "Happy Customer",
      text: "The best platform for local deals! The interface is simple and easy to use.",
      image:
        "https://i.pravatar.cc/100?img=12",
    },
    {
      name: "Emily R.",
      role: "Happy Customer",
      text: "I love the flash deals! I've saved a lot while supporting local businesses.",
      image:
        "https://i.pravatar.cc/100?img=32",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-wider text-[#FF4A2F]">
            Testimonials
          </p>

          <h2 className="mt-3 text-4xl font-black text-[#141922]">
            What Our Users Say
          </h2>

          <p className="mt-3 text-gray-600">
            Real people. Real savings. See what our community has to say.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">

          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-2xl border border-gray-100 bg-[#F9F9F9] p-7"
            >
              <div className="flex gap-1 text-[#F5A719]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={17}
                    fill="currentColor"
                  />
                ))}
              </div>

              <p className="mt-5 leading-7 text-gray-600">
                "{testimonial.text}"
              </p>

              <div className="mt-6 flex items-center gap-3">

                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="h-11 w-11 rounded-full object-cover"
                />

                <div>
                  <p className="font-bold text-[#141922]">
                    {testimonial.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {testimonial.role}
                  </p>
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