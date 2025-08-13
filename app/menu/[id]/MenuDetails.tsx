"use client";

import { FaPlus } from "react-icons/fa";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number; 
  addOns?: AddOn[];
}

export default function MenuDetails({ menuItem }: { menuItem: MenuItem }) {
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");

  const addItemsToCart = useCartStore((state) => state.addItemsToCart);

  const handleAddOnClick = (addOn: AddOn) => {
    setSelectedAddOns((prev) => {

        const isSelected = prev.some((item) => item.id === addOn.id);
      if (isSelected) {
        return prev.filter((item) => item.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const calculateTotalPrice = () => {
    const addOnsTotal = selectedAddOns.reduce(
      (sum, item) => sum + item.price,
      0
    );
    return (menuItem.price + addOnsTotal) * qty;
  };

  const totalPrice = calculateTotalPrice();

  const savePercentage = menuItem.oldPrice
    ? Math.round(
        ((menuItem.oldPrice - menuItem.price) / menuItem.oldPrice) * 100
      )
    : 0;

  const addToCart = () => {
    const itemsToAdd = [
      { id: menuItem._id, name: menuItem.title, price: menuItem.price },
      ...selectedAddOns.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        price: addOn.price,
      })),
    ];

    addItemsToCart(itemsToAdd, qty);

    setMessage(`${menuItem.title} with selected options added to cart!`);
    setTimeout(() => setMessage(""), 3000); 
  };

  return (
    <div>
      {message && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4 text-center">
          {message}
        </div>
      )}

      {menuItem.oldPrice && (
        <span className="text-sm text-red-500 font-medium mb-2 block">
          Save {savePercentage}%
        </span>
      )}
      <h1 className="text-3xl font-bold mb-1">{menuItem.title}</h1>
      <p className="text-gray-600 mb-4">{menuItem.description}</p>
      <div className="flex items-baseline mb-6">
        <p className="text-3xl font-semibold text-gray-800">
          ₦{menuItem.price.toLocaleString()}
        </p>
        {menuItem.oldPrice && (
          <p className="text-lg text-gray-400 line-through ml-2">
            ₦{menuItem.oldPrice.toLocaleString()}
          </p>
        )}
      </div>
      <hr className="my-6 border-gray-200" />
      <div className="flex items-center gap-4 mb-6">
        <label htmlFor="qty" className="font-medium">
          Quantity:
        </label>
        <select
          id="qty"
          className="border rounded-lg p-2"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5,6,7,8,9,10,11,12,13,14,15].map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Add Preference</h2>
        {menuItem.addOns?.map((addOn) => (
          <div
            key={addOn.id}
            className="flex justify-between items-center py-2 border-b last:border-b-0"
          >
            <p className="text-gray-700">{addOn.name}</p>
            <Button
              onClick={() => handleAddOnClick(addOn)}
              className={`p-2 rounded-full ${
                selectedAddOns.some((item) => item.id === addOn.id)
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700"
              } transition-colors`}
              aria-label={`Add ${addOn.name}`}
            >
              <FaPlus />
            </Button>
          </div>
        ))}
      </div>
      <Button
        className="w-full flex items-center justify-center bg-red-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition"
        onClick={addToCart}
      >
        Add {qty} for ₦{totalPrice.toLocaleString()}
      </Button>
    </div>
  );
}
