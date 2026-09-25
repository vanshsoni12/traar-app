import { normalizeSavedTariff } from '../utils/pricing';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type TripItem = {
  id: number;
  category: string;
  name: string;
  detail: string;
  price: number;
  priceKnown?: boolean;
  emoji: string;
  image?: string;
  location?: string;
  unit?: string;
  quantity?: number;
};

type TripContextType = {
  items: TripItem[];
  addItem: (item: TripItem) => void;
  removeItem: (id: number) => void;
  clearTrip: () => void;
  replaceTrip: (items: TripItem[]) => void;
  setQuantity: (id: number, quantity: number) => void;
};

const TripContext = createContext<TripContextType | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripItem[]>(() => {
    const savedItems = localStorage.getItem("traar-trip");

    return savedItems ? (JSON.parse(savedItems) as TripItem[]).map(normalizeSavedTariff) : [];
  });

  useEffect(() => {
    localStorage.setItem("traar-trip", JSON.stringify(items));
  }, [items]);

  function addItem(item: TripItem) {
    setItems((currentItems) => {
      const alreadyAdded = currentItems.some(
        (currentItem) => currentItem.id === item.id
      );

      if (alreadyAdded) {
        return currentItems;
      }

      return [...currentItems, normalizeSavedTariff(item)];
    });
  }

  function removeItem(id: number) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  function clearTrip() {
    setItems([]);
  }

  return (
    <TripContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearTrip,
        replaceTrip: (nextItems) => setItems(nextItems.map(normalizeSavedTariff)),
        setQuantity: (id, quantity) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item)),
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);

  if (!context) {
    throw new Error("useTrip must be used inside TripProvider");
  }

  return context;
}