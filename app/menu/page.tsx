/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { FaHeart, FaPlus, FaSearch } from "react-icons/fa";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MenuItemCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const addItemsToCart = useCartStore((state) => state.addItemsToCart);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const itemToAdd = {
      id: item._id,
      name: item.name,
      price: item.price,
    };

    addItemsToCart([itemToAdd], 1);
  };

  return (
    <Link href={`/menu/${item._id}`} aria-label={`View ${item.name} details`}>
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
        <Button
          className="absolute top-2 right-2 p-2 bg-white rounded-full text-red-500 shadow-md z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Added ${item.name} to wishlist!`);
          }}
          aria-label={`Add ${item.name} to wishlist`}
        >
          <FaHeart />
        </Button>

        <div className="w-full h-48 relative">
          <Image
            src={item.imageUrl || "/place.jpg"}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-gray-500 text-sm mb-2 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-4">
            <span className="font-semibold text-lg text-red-500">
              ₦{item.price.toLocaleString()}
            </span>
            <Button
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10"
              onClick={handleAddToCart}
              aria-label={`Add ${item.name} to cart`}
            >
              <FaPlus />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("low-to-high");

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const url = `/api/menu?page=${pagination.page}&limit=${pagination.limit}&category=${selectedCategory}&search=${searchTerm}&sort=${sortOrder}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch menu items: ${res.status}`);
        }
        const { data, pagination: newPagination } = await res.json();
        setMenuItems((prev) =>
          pagination.page === 1 ? data : [...prev, ...data]
        );
        setPagination(newPagination);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, [pagination.page, pagination.limit, selectedCategory, searchTerm, sortOrder]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(menuItems.map((item) => item.category));
    return ["all", ...Array.from(uniqueCategories)];
  }, [menuItems]);

  const handleLoadMore = () => {
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  if (loading && pagination.page === 1) {
    return <div className="text-center p-8 text-xl">Loading menu...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 flex flex-col lg:flex-row">
      <div className="hidden lg:block lg:w-1/4 p-4 pr-8 border-r border-gray-200">
        <h3 className="font-bold text-xl mb-4">Categories</h3>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category}>
              <button
                className={`text-base font-medium transition-colors ${
                  selectedCategory === category
                    ? "text-red-500 font-bold"
                    : "text-gray-700 hover:text-red-500"
                }`}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search products"
              className="w-full p-3 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search menu items"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative w-full md:w-auto">
            <select
              className="w-full md:w-48 p-3 border rounded-full appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 bg-white pr-10"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              aria-label="Sort menu items"
            >
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="a-z">Name: A-Z</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <MenuItemCard key={item._id} item={item} />
          ))}
        </div>

        {pagination.page < pagination.totalPages && (
          <div className="text-center mt-8">
            <Button
              className="bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition"
              onClick={handleLoadMore}
              aria-label="Load more menu items"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
