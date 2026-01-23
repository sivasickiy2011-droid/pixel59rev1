import Hero from '@/components/Hero';
import News from '@/components/News';
import AboutUs from '@/components/AboutUs';
import Development from '@/components/Development';
import Promotion from '@/components/Promotion';
import Services from '@/components/Services';
// import LeadGeneration from '@/components/LeadGeneration';
import Portfolio from '@/components/Portfolio';
import PartnersCarousel from '@/components/PartnersCarousel';
import FAQ from '@/components/FAQ';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import PartnerLogin from '@/components/services/PartnerLogin';
import HowItWorks from '@/components/HowItWorks';
import FloatingChat from '@/components/FloatingChat';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <PartnerLogin />
      <Hero />
      
      <main>
        <HowItWorks />
        <AboutUs />
        <Development />
        <Promotion />
        <Services />
        <News />
        <Portfolio />
        <PartnersCarousel />
        <FAQ />
        <Contacts />
      </main>

      <Footer />
      <CookieConsent />
      <FloatingChat />
    </div>
  );
};

export default Index;