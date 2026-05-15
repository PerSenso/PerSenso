"use client";
import { ShoppingBag, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CartDrawer from "@/components/CartDrawer";
import Image from "next/image";
import { WHATSAPP_URL, INSTAGRAM_URL } from "@/lib/social";

const Header = () => {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isPulsing, setIsPulsing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleCartPulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 300);
    };
    window.addEventListener("cart-pulse", handleCartPulse);
    return () => window.removeEventListener("cart-pulse", handleCartPulse);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-2 shadow-lg" : "py-3"}`}
      style={{
        background: scrolled ? "var(--ps-header-bg)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        borderBottom: scrolled ? `1px solid var(--ps-header-border)` : "1px solid transparent",
      }}
    >
      <div className="container mx-auto flex items-center justify-between px-4 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative h-24 w-80"
          >
            <Image
              src={scrolled ? (theme === "dark" ? "/logo-persenso-white.png" : "/logo-persenso-black.png") : "/logo-persenso-white.png"}
              alt="Persenso"
              fill
              className="object-contain transition-all duration-300"
              sizes="320px"
              priority
            />
          </motion.div>
        </Link>

        {/* Nav — absolutamente centrado respecto al contenedor */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
          {[
            { label: "Catálogo", id: "catalogo" },
            { label: "Nosotros", id: "nosotros" },
          ].map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => handleSmoothScroll(e, id)}
              className="relative text-xs uppercase tracking-[0.25em] font-medium transition-colors duration-300 group"
              style={{ color: scrolled ? "var(--ps-text-muted)" : "rgba(255,255,255,0.7)" }}
            >
              {label}
              <span
                className="absolute -bottom-1 left-0 h-[1.5px] w-0 group-hover:w-full transition-all duration-300"
                style={{ background: "var(--ps-gold)" }}
              />
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* WhatsApp */}
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: scrolled ? "#25D366" : "rgba(37,211,102,0.15)",
              border: `1px solid ${scrolled ? "#25D366" : "rgba(37,211,102,0.3)"}`,
              color: scrolled ? "#fff" : "#25D366",
            }}
            title="WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </motion.a>

          {/* Instagram */}
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: scrolled ? "linear-gradient(135deg,#833AB4,#E1306C,#F77737)" : "rgba(225,48,108,0.12)",
              border: `1px solid ${scrolled ? "transparent" : "rgba(225,48,108,0.3)"}`,
              color: scrolled ? "#fff" : "#E1306C",
            }}
            title="Instagram"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </motion.a>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: scrolled ? "var(--ps-surface)" : "rgba(255,255,255,0.1)",
              border: `1px solid ${scrolled ? "var(--ps-border)" : "rgba(255,255,255,0.15)"}`,
              color: scrolled ? "var(--ps-gold)" : "#e8c97a",
            }}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCartOpen(true)}
            id="cart-icon"
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: scrolled ? "var(--ps-surface)" : "rgba(255,255,255,0.1)",
              border: `1px solid ${scrolled ? "var(--ps-border)" : "rgba(255,255,255,0.15)"}`,
              color: scrolled ? "var(--ps-text)" : "#fff",
            }}
          >
            <motion.div animate={{ scale: isPulsing ? 1.2 : 1 }} transition={{ duration: 0.2 }}>
              <ShoppingBag className="w-4 h-4" />
            </motion.div>
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold"
                  style={{ background: "var(--ps-gold)", color: "#0d0d0f" }}
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      </div>
    </motion.header>
  );
};

export default Header;
