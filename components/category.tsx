"use client";

import Image from "next/image";
import { FaHeart, FaPlus } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";

interface MenuItem {
  _id: string;
  image: string;
  title: string;
  description: string;
  price: number;
}

interface PopularItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

const PopularItem: React.FC<PopularItemProps> = ({ item, onAddToCart }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex-none w-64 mr-4 transition-transform transform hover:scale-105">
    <div className="relative">
      <Link href={`/menu/${item._id}`} className="block">
        <Image
          src={item.image}
          alt={item.title}
          width={256}
          height={160}
          style={{ objectFit: "cover" }}
          className="rounded-lg"
        />
      </Link>
      <Button className="absolute top-2 right-2 bg-white rounded-full p-2 text-red-500 shadow-md">
        <FaHeart />
      </Button>
    </div>
    <h3 className="font-bold text-lg mt-2">{item.title}</h3>
    <p className="text-gray-500 text-sm">{item.description}</p>
    <p className="text-gray-800 font-semibold mt-1">
      ₦{item.price.toLocaleString()}
    </p>
    <Button
      onClick={() => onAddToCart(item)}
      className="mt-4 flex items-center justify-center w-full py-2 px-4 bg-white text-red-500 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-300"
    >
      <FaPlus className="mr-2" />
      Add Item
    </Button>
  </div>
);

const Category = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Example add-to-cart function (replace with context or state management)
  const handleAddToCart = (item: MenuItem) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ ...item, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${item.title} added to cart!`);
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error("Failed to fetch menu items");
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  if (loading) {
    return <p className="p-8 text-gray-500">Loading menu...</p>;
  }

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Popular Items</h2>
        <span className="text-gray-500 cursor-pointer">{">"}</span>
      </div>
      <div className="flex overflow-x-auto scroll-smooth snap-x">
        {items.map((item) => (
          <PopularItem
            key={item._id}
            item={item}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </section>
  );
};

export default Category;
