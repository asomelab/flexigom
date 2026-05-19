import { Outlet, useLocation } from "react-router";
import { Navbar } from "@/features/home/components/navbar";
import { lazy, Suspense } from "react";

const FloatingSupport = lazy(() => import("@/components/floating-support").then(m => ({ default: m.FloatingSupport })));
import { useCartStore } from "@/features/cart/store/cart-store";
import { useEffect } from "react";
import { pixel } from "@/lib/meta-pixel";

export function RootLayout() {
  const fetchCart = useCartStore((state) => state.fetchCart);
  const location = useLocation();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    pixel.pageView();
  }, [location.pathname]);

  return (
    <div className="relative bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto">
        <Outlet />
      </main>
      <Suspense fallback={null}>
        <FloatingSupport />
      </Suspense>
    </div>
  );
}
