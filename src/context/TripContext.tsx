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
  emoji: string;
};

type TripContextType = {
  items: TripItem[];
  addItem: (item: TripItem) => void;
  removeItem: (id: number) => void;
  clearTrip: () => void;
};

const TripContext = createContext<TripContextType | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripItem[]>(() => {
    const savedItems = localStorage.getItem("traar-trip");

    return savedItems ? JSON.parse(savedItems) : [];
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
        alert(`${item.name} is already in My Trip.`);
        return currentItems;
      }

      return [...currentItems, item];
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