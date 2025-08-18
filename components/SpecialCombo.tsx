"use client";

import Image from "next/image";
import { FaPlus } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart";
import { Button } from "./ui/button";
import { toast } from "react-hot-toast";

interface ComboItem {
  name: string;
  quantity: number;
}

interface SpecialComboItem {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  totalPrice: number;
  items: ComboItem[];
}

const fetchSpecialCombos = async (): Promise<{ data: SpecialComboItem[] }> => {
  const res = await fetch("/api/special-combos");
  if (!res.ok) throw new Error("Failed to fetch special combos");
  return res.json();
};

const SpecialComboCard = ({ combo }: { combo: SpecialComboItem }) => {
  const addItemsToCart = useCartStore((state) => state.addItemsToCart);

  const handleAddToCart = () => {
    // Assuming you have a way to handle combos in your cart store
    const cartItem = {
      id: combo._id,
      name: combo.name,
      price: combo.totalPrice,
      items: combo.items,
      isCombo: true,
    };
    addItemsToCart([cartItem], 1);
    toast.success(`${combo.name} added to cart!`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row flex-none w-[350px] md:w-[600px] mr-4 snap-center transition-transform transform hover:scale-105">
      <div className="flex-shrink-0 relative w-full md:w-1/2 h-64 md:h-auto">
        <Image
          src={combo.imageUrl}
          alt={combo.name}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
      </div>
      <div className="p-4 md:w-1/2 flex flex-col justify-between">
        <div>
         <h3 className="font-bold text-2xl">{combo.name}</h3>
          <p className="text-gray-500 text-sm mt-1">{combo.description}</p>
          <ul className="list-disc list-inside mt-4 text-gray-700 space-y-1">
            {combo.items.map((item, index) => (
              <li key={index} className="text-sm">
               {item.quantity} x {item.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex justify-between items-center">
         
          <p className="font-bold text-xl text-gray-800">
          Total: ₦{combo.totalPrice.toLocaleString()}
          </p>
          <Button
            onClick={handleAddToCart}
            className="flex items-center justify-center py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
          >
             <FaPlus className="mr-2" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
};

const SpecialComboSection = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["specialCombos"],
    queryFn: fetchSpecialCombos,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <p className="p-8 text-gray-500">Loading today&lsquo;s combos...</p>;
  }

  if (error || !data?.data || data.data.length === 0) {
    return (
      <div className="p-8 text-gray-500">
        No special combos available today.
      </div>
    );
  }

  return (
    <section className="p-8">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-2xl font-bold">Today&apos;s Special Combo</h2>
        <div className="text-gray-500 cursor-pointer">
        </div>
      </div>
      <div className="flex overflow-x-auto scroll-smooth snap-x">
        {data.data.map((combo) => (
          <SpecialComboCard key={combo._id} combo={combo} />
        ))}
      </div>
    </section>
  );
};

export default SpecialComboSection;
