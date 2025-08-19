/* eslint-disable react/no-unescaped-entities */
"use client";
import Image from "next/image";
import {
  FaPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaSync,
} from "react-icons/fa";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart";
import { Button } from "./ui/button";
import { toast } from "react-hot-toast";
import { useState, useCallback } from "react";

interface ComboItem {
  _id: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
}

interface SpecialComboItem {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  totalPrice: number;
  items: ComboItem[];
  available?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data: SpecialComboItem[];
  meta?: {
    total: number;
    count: number;
    skip: number;
    limit: number;
    hasMore: boolean;
  };
  message: string;
  error?: string;
}

// Enhanced fetch function with retry logic and better error handling
const fetchSpecialCombos = async (
  featured: boolean = true,
  retryCount: number = 0
): Promise<ApiResponse> => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  try {
    console.log(
      `🔄 Attempting to fetch combos (attempt ${retryCount + 1}/${
        maxRetries + 1
      })`
    );

    const params = new URLSearchParams({
      featured: featured.toString(),
      available: "true",
      limit: "10",
    });

    const response = await fetch(`/api/special-combo?${params}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store", // Disable caching for debugging
    });

    console.log(`📡 API Response:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response (${response.status}):`, errorText);

      // Try to parse as JSON, fallback to text
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }

      throw new Error(
        errorData.message ||
          `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    const data: ApiResponse = await response.json();
    console.log(`✅ Successfully fetched combos:`, {
      success: data.success,
      count: data.data?.length || 0,
      total: data.meta?.total,
    });

    return data;
  } catch (error) {
    console.error(`❌ Fetch attempt ${retryCount + 1} failed:`, error);

    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`⏳ Retrying in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchSpecialCombos(featured, retryCount + 1);
    }

    // Final attempt: try fetching all combos if featured failed
    if (featured && retryCount >= maxRetries) {
      console.log(`🔄 Final attempt: trying to fetch all available combos`);
      try {
        return await fetchSpecialCombos(false, 0);
      } catch (fallbackError) {
        console.error(`❌ Fallback also failed:`, fallbackError);
      }
    }

    throw error;
  }
};

// Enhanced loading skeleton component
const ComboCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row flex-none w-[350px] md:w-[600px] mr-4 animate-pulse">
    <div className="flex-shrink-0 w-full md:w-1/2 h-64 md:h-auto bg-gray-300 rounded-lg"></div>
    <div className="p-4 md:w-1/2 flex flex-col justify-between">
      <div>
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
          <div className="h-3 bg-gray-300 rounded w-3/6"></div>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        <div className="h-10 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// Enhanced combo card with better error handling and accessibility
const SpecialComboCard = ({ combo }: { combo: SpecialComboItem }) => {
  const addItemsToCart = useCartStore((state) => state.addItemsToCart);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const cartItem = {
        id: combo._id,
        name: combo.name,
        price: combo.totalPrice,
        items: combo.items,
        isCombo: true,
      };

      addItemsToCart([cartItem], 1);

      toast.success(
        <div className="flex flex-col">
          <strong>{combo.name}</strong>
          <span className="text-sm">Added to cart!</span>
        </div>,
        {
          duration: 3000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [combo, addItemsToCart, isLoading]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <article
      className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row flex-none w-[350px] md:w-[600px] mr-4 snap-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus-within:ring-2 focus-within:ring-red-500"
      role="article"
      aria-labelledby={`combo-${combo._id}-title`}
    >
      <div className="flex-shrink-0 relative w-full md:w-1/2 h-64 md:h-auto">
        {imageError ? (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FaExclamationTriangle className="mx-auto mb-2 text-2xl" />
              <p className="text-sm">Image unavailable</p>
            </div>
          </div>
        ) : (
          <Image
            src={combo.imageUrl}
            alt={`${combo.name} - Special combo featuring ${combo.items
              .map((item) => item.name)
              .join(", ")}`}
            fill
            sizes="(max-width: 768px) 350px, 300px"
            className="rounded-lg object-cover"
            onError={handleImageError}
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        )}
      </div>

      <div className="p-4 md:w-1/2 flex flex-col justify-between">
        <div>
          <h3
            id={`combo-${combo._id}-title`}
            className="font-bold text-2xl text-gray-800 mb-2 line-clamp-2"
          >
            {combo.name}
          </h3>

          <p className="text-gray-600 text-sm mt-1 mb-4 line-clamp-3">
            {combo.description}
          </p>

          {combo.items && combo.items.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Includes:
              </h4>
              <ul className="space-y-1 max-h-24 overflow-y-auto">
                {combo.items.map((item, index) => (
                  <li
                    key={`${item._id}-${index}`}
                    className="text-sm text-gray-700 flex items-center justify-between bg-gray-50 px-2 py-1 rounded"
                  >
                    <span className="truncate">
                      {item.quantity}x {item.name}
                    </span>
                    {item.price && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        ₦{item.price.toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <p className="font-bold text-xl text-gray-800">
              ₦{combo.totalPrice.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">Total Price</p>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isLoading || !combo.available}
            className={`
              flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-300 min-w-[80px]
              ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : combo.available
                  ? "bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  : "bg-gray-400 cursor-not-allowed"
              }
              text-white font-medium
            `}
            aria-label={`Add ${
              combo.name
            } to cart for ₦${combo.totalPrice.toLocaleString()}`}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <>
                <FaPlus className="mr-2" aria-hidden="true" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

// Main component with enhanced error handling and retry functionality
const SpecialComboSection = () => {
  const [showAllCombos, setShowAllCombos] = useState(false);
  const queryClient = useQueryClient();

  const { data, error, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["specialCombos", showAllCombos],
    queryFn: () => fetchSpecialCombos(!showAllCombos),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: false, // We handle retries manually
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["specialCombos"] });
    refetch();
  }, [queryClient, refetch]);

  const handleToggleView = useCallback(() => {
    setShowAllCombos((prev) => !prev);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section
        className="p-8"
        role="region"
        aria-label="Today's Special Combos"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Today's Special Combo
          </h2>
          <div className="flex items-center text-gray-500">
            <FaSpinner className="animate-spin mr-2" />
            Loading...
          </div>
        </div>
        <div className="flex overflow-x-auto scroll-smooth snap-x gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ComboCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  // Error state with retry functionality
  if (isError) {
    return (
      <section
        className="p-8"
        role="region"
        aria-label="Today's Special Combos"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Today's Special Combo
          </h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FaExclamationTriangle className="mx-auto text-red-500 text-3xl mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Unable to Load Special Combos
          </h3>
          <p className="text-red-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the combos. Please try again."}
          </p>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleRetry}
              disabled={isFetching}
              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-300"
            >
              {isFetching ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSync className="mr-2" />
              )}
              {isFetching ? "Retrying..." : "Try Again"}
            </Button>

            <Button
              onClick={handleToggleView}
              variant="outline"
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-300"
            >
              {showAllCombos ? "Show Featured Only" : "Show All Combos"}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // No data state
  if (!data?.data || data.data.length === 0) {
    return (
      <section
        className="p-8"
        role="region"
        aria-label="Today's Special Combos"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Today's Special Combo
          </h2>
          <Button
            onClick={handleToggleView}
            variant="outline"
            className="text-sm px-3 py-1 border-gray-300 text-gray-600 hover:bg-gray-50 rounded transition-colors duration-300"
          >
            {showAllCombos ? "Show Featured Only" : "Show All Combos"}
          </Button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Special Combos Available
          </h3>
          <p className="text-gray-600 mb-4">
            {showAllCombos
              ? "We don't have any combos available right now."
              : "No featured combos today, but check back soon!"}
          </p>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleToggleView}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-300"
            >
              {showAllCombos ? "Show Featured Only" : "Show All Combos"}
            </Button>

            <Button
              onClick={handleRetry}
              variant="outline"
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-300"
            >
              <FaSync className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Success state with data
  return (
    <section className="p-8" role="region" aria-label="Today's Special Combos">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {showAllCombos ? "All Special Combos" : "Today's Special Combo"}
          </h2>
          {data.meta && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {data.meta.count} of {data.meta.total} combos
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isFetching && (
            <FaSpinner
              className="animate-spin text-gray-400"
              aria-label="Updating..."
            />
          )}

          <Button
            onClick={handleToggleView}
            variant="outline"
            className="text-sm px-3 py-1 border-gray-300 text-gray-600 hover:bg-gray-50 rounded transition-colors duration-300"
          >
            {showAllCombos ? "Show Featured Only" : "Show All Combos"}
          </Button>

          <Button
            onClick={handleRetry}
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-300"
            aria-label="Refresh combos"
          >
            <FaSync className={isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Horizontal scrollable container */}
      <div
        className="flex overflow-x-auto scroll-smooth snap-x scrollbar-hide gap-4 pb-4"
        role="list"
        aria-label="Available special combos"
      >
        {data.data.map((combo) => (
          <div key={combo._id} role="listitem">
            <SpecialComboCard combo={combo} />
          </div>
        ))}
      </div>

      {/* Pagination or load more functionality */}
      {data.meta?.hasMore && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => {
              // Implement load more functionality here if needed
              console.log("Load more combos...");
            }}
            variant="outline"
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-300"
          >
            Load More Combos
          </Button>
        </div>
      )}

      {/* Success message for debugging */}
      {process.env.NODE_ENV === "development" && data.success && (
        <div className="mt-4 text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
          ✅ {data.message}
        </div>
      )}
    </section>
  );
};

export default SpecialComboSection;
