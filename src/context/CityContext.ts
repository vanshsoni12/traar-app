import { createContext, useContext } from "react";

export const CityContext = createContext({ city: "Bhopal", setCity: (_city: string) => {} });
export const useSelectedCity = () => useContext(CityContext);
