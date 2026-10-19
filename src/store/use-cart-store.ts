import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addItem: (product: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      isCheckoutOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openCheckout: () => set({ isCartOpen: false, isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === product.productId);

        if (product.stock <= 0) {
          return false;
        }

        if (existing) {
          const newQuantity = existing.quantity + quantity;
          const clampedQuantity = Math.min(newQuantity, product.stock);

          set({
            items: items.map((i) =>
              i.productId === product.productId
                ? { ...i, quantity: clampedQuantity, stock: product.stock }
                : i
            ),
            isCartOpen: true,
          });
          return true;
        }

        const initialQuantity = Math.min(quantity, product.stock);
        set({
          items: [
            ...items,
            {
              ...product,
              quantity: initialQuantity,
            },
          ],
          isCartOpen: true,
        });
        return true;
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId === productId) {
              const clamped = Math.min(quantity, i.stock);
              return { ...i, quantity: clamped };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: "ecommerce_cart_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
