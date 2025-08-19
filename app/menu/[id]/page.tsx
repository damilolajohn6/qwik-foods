import Image from "next/image";
import MenuDetails from "./MenuDetails";

// Function to fetch menu item data
async function getMenuItem(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/menu/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

// Props interface for the page component
interface MenuItemPageProps {
  params: Promise<{ id: string }>;
}

// Main page component
export default async function MenuItemPage({ params }: MenuItemPageProps) {
  const { id } = await params;
  const menuItem = await getMenuItem(id);

  if (!menuItem) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Item not found
          </h1>
          <p className="text-gray-600">
            The menu item you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  // Map the menu item data to match the expected format
  const mappedMenuItem = {
    _id: menuItem._id,
    title: menuItem.name,
    description: menuItem.description,
    price: menuItem.price,
    oldPrice: menuItem.oldPrice,
    addOns: menuItem.addOns || [],
    image: menuItem.imageUrl || menuItem.primaryImage?.url,
    // Additional fields that might be useful
    category: menuItem.category,
    subcategory: menuItem.subcategory,
    popular: menuItem.popular,
    featured: menuItem.featured,
    vegetarian: menuItem.vegetarian,
    vegan: menuItem.vegan,
    glutenFree: menuItem.glutenFree,
    spicy: menuItem.spicy,
    nutrition: menuItem.nutrition,
    allergens: menuItem.allergens,
    prepTime: menuItem.prepTime,
    rating: menuItem.rating,
    available: menuItem.available,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="relative h-[300px] md:h-[400px] lg:h-[600px]">
              <Image
                src={mappedMenuItem.image || "/place.jpg"}
                alt={mappedMenuItem.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 50vw"
                priority={true}
              />

              {/* Overlay badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {mappedMenuItem.popular && (
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Popular
                  </span>
                )}
                {mappedMenuItem.featured && (
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                )}
                {mappedMenuItem.vegetarian && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Vegetarian
                  </span>
                )}
                {mappedMenuItem.vegan && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Vegan
                  </span>
                )}
                {mappedMenuItem.spicy && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🌶️ Spicy
                  </span>
                )}
              </div>

              {/* Rating badge */}
              {mappedMenuItem.rating && mappedMenuItem.rating.average > 0 && (
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-medium text-gray-800">
                    {mappedMenuItem.rating.average.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({mappedMenuItem.rating.count})
                  </span>
                </div>
              )}

              {/* Availability indicator */}
              {!mappedMenuItem.available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">
                    Currently Unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="p-6 md:p-8 flex flex-col">
              {/* Category breadcrumb */}
              {mappedMenuItem.category && (
                <div className="text-sm text-gray-500 mb-2 capitalize">
                  {mappedMenuItem.category}
                  {mappedMenuItem.subcategory && (
                    <span> • {mappedMenuItem.subcategory}</span>
                  )}
                </div>
              )}

              {/* Prep time */}
              {mappedMenuItem.prepTime && (
                <div className="text-sm text-gray-500 mb-4 flex items-center">
                  <span className="mr-2">🕒</span>
                  Ready in {mappedMenuItem.prepTime} minutes
                </div>
              )}

              {/* Menu Details Component */}
              <div className="flex-1">
                <MenuDetails menuItem={mappedMenuItem} />
              </div>

              {/* Additional Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {/* Allergens */}
                {mappedMenuItem.allergens &&
                  mappedMenuItem.allergens.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Allergens:
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {mappedMenuItem.allergens.map((allergen: string, index: number) => (
                          <span
                          key={index}
                          className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded capitalize"
                          >
                          {allergen.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Nutritional Information */}
                {mappedMenuItem.nutrition && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Nutrition (per serving):
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      {mappedMenuItem.nutrition.calories && (
                        <div>Calories: {mappedMenuItem.nutrition.calories}</div>
                      )}
                      {mappedMenuItem.nutrition.protein && (
                        <div>Protein: {mappedMenuItem.nutrition.protein}g</div>
                      )}
                      {mappedMenuItem.nutrition.carbs && (
                        <div>Carbs: {mappedMenuItem.nutrition.carbs}g</div>
                      )}
                      {mappedMenuItem.nutrition.fat && (
                        <div>Fat: {mappedMenuItem.nutrition.fat}g</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dietary badges */}
                <div className="flex flex-wrap gap-2">
                  {mappedMenuItem.glutenFree && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Gluten-Free
                    </span>
                  )}
                  {mappedMenuItem.vegetarian && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Vegetarian
                    </span>
                  )}
                  {mappedMenuItem.vegan && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Vegan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
