import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import ServicesSection from "@/components/services-section";
import DentistsSection from "@/components/dentists-section";
import BookingSection from "@/components/booking-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="company-profile">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <DentistsSection />
        <BookingSection />
      </main>
      <Footer />
    </div>
  );
}
