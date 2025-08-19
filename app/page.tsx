import Category from "@/components/category";
import HeroSection from "@/components/HeroSection";
import SpecialComboSection from "@/components/SpecialCombo";

export default function Home() {
  return (
    <div className=" mx-auto p-4 bg-[#F8F8F8]">
      <HeroSection />
      <div className="bg-gray-100">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Our Restaurant</h1>
          <p className="text-gray-700 mb-6">
            Discover our delicious menu and special combos available today!
          </p>
        </div>
        <Category />
        <SpecialComboSection />
      </div>
    </div>
  );
}
