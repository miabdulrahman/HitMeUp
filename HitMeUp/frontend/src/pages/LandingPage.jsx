import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import FeaturedDeals from "../components/FeaturedDeals";
import WhyHitMeUp from "../components/WhyHitMeUp";
import ForBusiness from "../components/ForBusiness";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CategorySection />
        <FeaturedDeals />
        <WhyHitMeUp />
        <ForBusiness />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;