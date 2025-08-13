"use client";

import Image from "next/image";
import { FaHeart, FaPlus } from "react-icons/fa";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart";
import { Button } from "./ui/button";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface MenuItem {
  _id: string;
  image: string;
  title: string;
  description: string;
  price: number;
}

interface ApiMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface ApiResponse {
  data: ApiMenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PopularItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

const PopularItem: React.FC<PopularItemProps> = ({ item, onAddToCart }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex-none w-64 mr-4 transition-transform transform hover:scale-105">
    <div className="relative">
      <Link
        href={`/menu/${item._id}`}
        className="block"
        aria-label={`View ${item.title} details`}
      >
        <Image
          src={item.image || "/place.jpg"}
          alt={item.title}
          width={256}
          height={160}
          style={{ objectFit: "cover" }}
          className="rounded-lg"
          sizes="(max-width: 768px) 100vw, 256px"
          priority={true}
        />
      </Link>
      <Button
        className="absolute top-2 right-2 bg-white rounded-full p-2 text-red-500 shadow-md"
        aria-label={`Add ${item.title} to wishlist`}
        onClick={() => toast.success(`${item.title} added to wishlist!`)}
      >
        <FaHeart />
      </Button>
    </div>
    <h3 className="font-bold text-lg mt-2">{item.title}</h3>
    <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
    <p className="text-gray-800 font-semibold mt-1">
      ₦{item.price.toLocaleString()}
    </p>
    <Button
      onClick={() => onAddToCart(item)}
      className="mt-4 flex items-center justify-center w-full py-2 px-4 bg-white text-red-500 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-300"
      aria-label={`Add ${item.title} to cart`}
    >
      <FaPlus className="mr-2" />
      Add Item
    </Button>
  </div>
);

const Category = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const addItemsToCart = useCartStore((state) => state.addItemsToCart);

  const { data, error, isLoading } = useQuery<ApiResponse>({
    queryKey: ["popularItems", page],
    queryFn: async () => {
      const res = await fetch(`/api/menu?page=${page}&limit=${limit}`, {
        cache: "no-store",
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`Failed to fetch menu items: ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const items: MenuItem[] =
    data?.data.map((item) => ({
      _id: item._id,
      title: item.name,
      image: item.imageUrl || "/place.jpg",
      description: item.description,
      price: item.price,
    })) ?? [];

  const handleAddToCart = (item: MenuItem) => {
    const cartItem = {
      id: item._id,
      name: item.title,
      price: item.price,
    };
    addItemsToCart([cartItem], 1);
    toast.success(`${item.title} added to cart!`);
  };

  const handleLoadMore = () => {
    const currentPage = data?.pagination.page ?? 1;
    const totalPages = data?.pagination.totalPages ?? 1;
    if (currentPage < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  if (isLoading && page === 1) {
    return (
      <p className="p-8 text-gray-500" role="status">
        Loading menu...
      </p>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">Error: {(error as Error).message}</div>
    );
  }

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Popular Items</h2>
        <Link
          href="/menu"
          className="text-gray-500 cursor-pointer"
          aria-label="View all menu items"
        >
          {">"}
        </Link>
      </div>
      <div
        className="flex overflow-x-auto scroll-smooth snap-x"
        role="region"
        aria-label="Popular items carousel"
      >
        {items.length === 0 ? (
          <p className="p-8 text-gray-500">No popular items available.</p>
        ) : (
          items.map((item) => (
            <PopularItem
              key={item._id}
              item={item}
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>
      {data?.pagination &&
        data.pagination.page < data.pagination.totalPages && (
          <div className="text-center mt-8">
            <Button
              className="bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition"
              onClick={handleLoadMore}
              aria-label="Load more popular items"
            >
              Load More
            </Button>
          </div>
        )}
    </section>
  );
};

export default Category;
