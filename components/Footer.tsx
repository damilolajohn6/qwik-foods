import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-black text-white p-8 md:p-16">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/Logo.png"
              alt="FastFood Logo"
              width={150}
              height={50}
            />
          </Link>
          <div className="mt-4">
            <h3 className="font-bold text-lg mb-2">About</h3>
            <p className="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet consectetur. Augue dictumst cras socios
              nulla diam est purus. Mised due et lectus a eget mauris euismod.
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-2">
          <h3 className="font-bold text-lg mb-2">Contact</h3>
          <Link href="/contact" className="text-gray-400 hover:text-white">
            Contact Us
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          <h3 className="font-bold text-lg mb-2">FAQs</h3>
          <Link href="/faqs" className="text-gray-400 hover:text-white">
            General FAQs
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          <h3 className="font-bold text-lg mb-2">Policies</h3>
          <Link
            href="/privacy-policy"
            className="text-gray-400 hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-gray-400 hover:text-white"
          >
            Terms of Service
          </Link>
          {/* Add more policy links if needed */}
        </div>

        <div className="flex flex-col space-y-2">
          <h3 className="font-bold text-lg mb-2">Social Media</h3>

          <Link href="#" className="text-gray-400 hover:text-white">
            Facebook
          </Link>
          <Link href="#" className="text-gray-400 hover:text-white">
            Instagram
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
