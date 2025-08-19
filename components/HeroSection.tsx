import Image from "next/image";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-between px-4 bg-white md:px-8 lg:px-16 py-12 gap-8 lg:gap-16">
      {/* Left Content */}
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-snug">
          What Are you Eating Today?
        </h1>
        <Button className="bg-red-500 text-white px-6 py-3 rounded-md text-lg hover:bg-red-600 transition duration-300">
          Order Now
        </Button>
      </div>

      {/* Right Images */}
      <div className="flex-1 relative flex justify-center lg:justify-end w-full">
        {/* Main Image */}
        <div className="relative w-full max-w-md lg:max-w-lg aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
          <Image
            src="/mainhero.jpg" 
            alt="Grilled skewers with vegetables"
            fill
            sizes="(max-width: 768px) 100vw,
                   (max-width: 1200px) 50vw,
                   500px"
            className="object-cover rounded-lg"
            priority
          />
        </div>

        {/* Overlay Image */}
        <div className="absolute -bottom-8 -right-8 sm:-bottom-10 sm:-right-10 w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/overlay.jpg" 
            alt="Noodle soup with shrimp"
            fill
            sizes="(max-width: 768px) 120px,
                   (max-width: 1200px) 160px,
                   200px"
            className="object-cover rounded-lg"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
