import Image from "next/image";
import MenuDetails from "./MenuDetails";

async function getMenuItem(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/menu/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; 
  const menuItem = await getMenuItem(id);

  if (!menuItem) {
    return <p className="text-center p-8">Item not found</p>;
  }

  const mappedMenuItem = {
    _id: menuItem._id,
    title: menuItem.name, 
    description: menuItem.description,
    price: menuItem.price,
    oldPrice: menuItem.oldPrice,
    addOns: menuItem.addOns,
    image: menuItem.imageUrl,
  };

  return (
    <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative w-full h-[350px] md:h-[500px]">
        <Image
          src={mappedMenuItem.image || "/place.jpg"}
          alt={mappedMenuItem.title}
          fill
          className="rounded-lg object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={true}
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">{mappedMenuItem.title}</h1>
        <p className="text-gray-600 mb-4">{mappedMenuItem.description}</p>
        <MenuDetails menuItem={mappedMenuItem} />
      </div>
    </div>
  );
}
