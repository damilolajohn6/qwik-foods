import Image from "next/image";
import { FaPlus } from "react-icons/fa";

interface MenuItem {
  _id: string;
  image: string;
  title: string;
  description: string;
  price: number;
  category?: string;
}

async function getMenuItem(id: string): Promise<MenuItem | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/menu/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function MenuItemPage({
  params,
}: {
  params: { id: string };
}) {
  const menuItem = await getMenuItem(params.id);

  if (!menuItem) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Item not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left: Image */}
      <div className="relative w-full h-[350px] md:h-[500px]">
        <Image
          src={menuItem.image}
          alt={menuItem.title}
          fill
          className="rounded-lg object-cover"
        />
      </div>

      {/* Right: Details */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{menuItem.title}</h1>
        <p className="text-gray-600 mb-4">{menuItem.description}</p>
        <p className="text-2xl font-semibold mb-6">
          ₦{menuItem.price.toLocaleString()}
        </p>

        {/* Quantity Selector */}
        <div className="flex items-center gap-4 mb-6">
          <label htmlFor="qty" className="font-medium">
            Quantity:
          </label>
          <select id="qty" className="border rounded-lg p-2" defaultValue={1}>
            {[1, 2, 3, 4, 5].map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Add to Cart */}
        <button
          className="flex items-center justify-center bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition"
          onClick={() => {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            cart.push({ ...menuItem, quantity: 1 });
            localStorage.setItem("cart", JSON.stringify(cart));
            alert(`${menuItem.title} added to cart!`);
          }}
        >
          <FaPlus className="mr-2" /> Add to Cart
        </button>
      </div>
    </div>
  );
}
