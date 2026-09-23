import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import FeaturedDeals from "../components/FeaturedDeals";
import WhyHitMeUp from "../components/WhyHitMeUp";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">

      <Navbar />

      <main>
        <Hero />
        <CategorySection />
        <FeaturedDeals />
        <WhyHitMeUp />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>

      <Footer />

    </div>
  );
}

export default LandingPage;