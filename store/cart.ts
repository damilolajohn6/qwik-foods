import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

type CartState = {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    addItemsToCart: (newItems: Omit<CartItem, 'quantity'>[], quantity: number) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
};

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            addItemsToCart: (newItems, quantity) =>
                set((state) => {
                    const updatedItems = [...state.items];
                    newItems.forEach((newItem) => {
                        const existingItem = updatedItems.find((i) => i.id === newItem.id);
                        if (existingItem) {
                            existingItem.quantity += quantity;
                        } else {
                            updatedItems.push({ ...newItem, quantity });
                        }
                    });
                    return { items: updatedItems };
                }),
            addToCart: (item) =>
                set((state) => {
                    const existingItem = state.items.find((i) => i.id === item.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                            ),
                        };
                    }
                    return { items: [...state.items, { ...item, quantity: 1 }] };
                }),
            removeFromCart: (id) =>
                set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
            updateQuantity: (id, quantity) =>
                set((state) => ({
                    items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
                })),
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
