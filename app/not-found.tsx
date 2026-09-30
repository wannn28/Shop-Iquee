import { CartDrawer } from "@/components/layout/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotFoundState } from "@/components/layout/NotFoundState";
import { Providers } from "@/components/layout/Providers";

export default function NotFound() {
  return (
    <Providers>
      <Header />
      <main id="main" className="flex-1">
        <NotFoundState />
      </main>
      <Footer />
      <CartDrawer />
    </Providers>
  );
}
