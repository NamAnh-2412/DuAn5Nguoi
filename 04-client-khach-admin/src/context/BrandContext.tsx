import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "../api/catalogApi";

type Brand = {
  name: string;
  logoUrl?: string | null;
  imageUrl?: string | null;
};

const BrandContext = createContext<Brand>({ name: "CineVe" });

export function BrandProvider({ children }: { children: ReactNode }) {
  const q = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const brand: Brand = {
    name: q.data?.name?.trim() || "CineVe",
    logoUrl: q.data?.logoUrl,
    imageUrl: q.data?.imageUrl,
  };

  useEffect(() => {
    document.title = `${brand.name} — Đặt vé xem phim`;
  }, [brand.name]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
