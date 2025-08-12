"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaShoppingCart,
  FaMapMarkerAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
};

const Header = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["menuItems", search, category],
    queryFn: async () => {
      const res = await fetch(
        `/api/menu?search=${search}&category=${category}`
      );
      return res.json();
    },
  });

  const categories: string[] = [
    "all",
    ...new Set(menuItems.map((item) => item.category)),
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/Logo.png" alt="FastFood Logo" width={100} height={40} />
        </Link>

        <div className="flex items-center space-x-2 border rounded-full mx-4 p-2">
          <FaMapMarkerAlt className="text-gray-500" />
          <span className="text-gray-700">Location</span>
          <FaChevronDown className="text-gray-500" />
        </div>

        {/* Desktop Icons */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          {/* Desktop Search + Category */}
          <div className="hidden lg:flex gap-4">
            <Input
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-gray-500 text-white py-2 px-4 rounded-full flex items-center space-x-2">
            <span>Order Options</span>
            <FaChevronDown />
          </Button>


          <Link href="/cart">
            <FaShoppingCart className="text-gray-500" />
          </Link>

          <Link
            href="/auth/login"
            className="border border-red-500 text-red-500 py-2 px-4 rounded-full"
          >
            Sign-in
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          className="lg:hidden text-gray-700 text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 space-y-4">
          {/* Search */}
          <Input
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* Categories */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border rounded-full p-2">
              <FaMapMarkerAlt className="text-gray-500" />
              <span className="text-gray-700">Location</span>
              <FaChevronDown className="text-gray-500" />
            </div>
            <Button className="bg-gray-500 text-white py-2 px-4 rounded-full flex items-center justify-center gap-2">
              <span>Order Options</span>
              <FaChevronDown />
            </Button>
            <Link
              href="/cart"
              className="flex items-center gap-2 border p-2 rounded-full"
            >
              <FaShoppingCart /> Cart
            </Link>
            <Link
              href="/auth/login"
              className="border border-red-500 text-red-500 py-2 px-4 rounded-full text-center"
            >
              Sign-in
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
