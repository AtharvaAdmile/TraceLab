import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import MarqueeStrip from './components/MarqueeStrip';
import ProblemSection from './components/ProblemSection';
import FeaturesSection from './components/FeaturesSection';
import ComplianceBadges from './components/ComplianceBadges';
import HowItWorks from './components/HowItWorks';
import FAQSection from './components/FAQSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <HeroSection />
      <MarqueeStrip />
      <ProblemSection />
      <FeaturesSection />
      <ComplianceBadges />
      <HowItWorks />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
