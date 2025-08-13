"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useDebounce } from "use-debounce";
import { toast } from "react-hot-toast";
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

type ApiResponse = {
  data: MenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const Header = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [debouncedSearch] = useDebounce(search, 500); // Debounce search input
  const { data: session, status } = useSession(); // Get user session

  const { data, error, isLoading } = useQuery<ApiResponse>({
    queryKey: ["menuItems", debouncedSearch, category],
    queryFn: async () => {
      const res = await fetch(
        `/api/menu?search=${encodeURIComponent(
          debouncedSearch
        )}&category=${encodeURIComponent(category)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch menu items: ${res.status}`);
      }
      return res.json();
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Handle API response: Extract data array or use empty array if undefined
  const menuItems = useMemo(() => data?.data ?? [], [data]);

  const categories: string[] = useMemo(
    () => ["all", ...new Set(menuItems.map((item) => item.category))],
    [menuItems]
  );

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(`Error fetching menu: ${(error as Error).message}`);
    }
  }, [error]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  return (
    <nav className="bg-white shadow-md">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="Home">
          <Image
            src="/Logo.png"
            alt="FastFood Logo"
            width={100}
            height={40}
            priority
          />
        </Link>

        {/* Location */}
        <div className="flex items-center space-x-2 border rounded-full mx-4 p-2">
          <FaMapMarkerAlt className="text-gray-500" aria-hidden="true" />
          <span className="text-gray-700">Location</span>
          <FaChevronDown className="text-gray-500" aria-hidden="true" />
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
              aria-label="Search menu items"
              disabled={isLoading}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]" aria-label="Select category">
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

          <Button
            className="bg-gray-500 text-white py-2 px-4 rounded-full flex items-center space-x-2"
            aria-label="Order options"
          >
            <span>Order Options</span>
            <FaChevronDown aria-hidden="true" />
          </Button>

          <Link href="/cart" aria-label="View cart">
            <FaShoppingCart className="text-gray-500" />
          </Link>

          {status === "unauthenticated" && (
            <Link
              href="/auth/signin"
              className="border border-red-500 text-red-500 py-2 px-4 rounded-full"
              aria-label="Sign in"
            >
              Sign-in
            </Link>
          )}
          {status === "authenticated" && (
            <Link
              href="/profile"
              className="border border-red-500 text-red-500 py-2 px-4 rounded-full"
              aria-label={`View profile for ${session.user?.name}`}
            >
              {session.user?.name || "Profile"}
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          className="lg:hidden text-gray-700 text-2xl"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 space-y-4">
          <Input
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search menu items"
            disabled={isLoading}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full" aria-label="Select category">
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
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-2 border rounded-full p-2"
              aria-label="Select location"
            >
              <FaMapMarkerAlt className="text-gray-500" aria-hidden="true" />
              <span className="text-gray-700">Location</span>
              <FaChevronDown className="text-gray-500" aria-hidden="true" />
            </div>
            <Button
              className="bg-gray-500 text-white py-2 px-4 rounded-full flex items-center justify-center gap-2"
              aria-label="Order options"
            >
              <span>Order Options</span>
              <FaChevronDown aria-hidden="true" />
            </Button>
            <Link
              href="/cart"
              className="flex items-center gap-2 border p-2 rounded-full"
              aria-label="View cart"
            >
              <FaShoppingCart /> Cart
            </Link>
            {status === "unauthenticated" && (
              <Link
                href="/auth/signin"
                className="border border-red-500 text-red-500 py-2 px-4 rounded-full text-center"
                aria-label="Sign in"
              >
                Sign-in
              </Link>
            )}
            {status === "authenticated" && (
              <Link
                href="/profile"
                className="border border-red-500 text-red-500 py-2 px-4 rounded-full text-center"
                aria-label={`View profile for ${session.user?.name}`}
              >
                {session.user?.name || "Profile"}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
