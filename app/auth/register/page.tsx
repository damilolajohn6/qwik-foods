"use client";

import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import RegisterForm from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
        {/* Logo / Branding */}
        <div className="flex justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-8 sm:size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4 sm:size-3" />
            </div>
            <span className="text-lg sm:text-base">QwikFoods</span>
          </Link>
        </div>

        {/* Form Centered */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm sm:max-w-md">
            <RegisterForm />
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block relative bg-muted">
        <Image
          src="/pizza.jpg"
          alt="Delicious Pizza"
          fill
          className="object-cover dark:brightness-[0.4] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
