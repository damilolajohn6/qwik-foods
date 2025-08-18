import Category from "@/components/category";
import HeroSection from "@/components/HeroSection";
import SpecialComboSection from "@/components/SpecialCombo";


export default function Home() {
  

  return (
    <div className="container mx-auto p-4">
    <HeroSection />
    <Category />
    <SpecialComboSection />
    </div>
  );
}
