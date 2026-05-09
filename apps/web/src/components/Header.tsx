"use client";
import { ShoppingBag, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CartDrawer from "@/components/CartDrawer";
import Image from "next/image";

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
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative h-14 w-40"
          >
            <Image
              src={scrolled ? (theme === "dark" ? "/logo-persenso-white.png" : "/logo-persenso-black.png") : "/logo-persenso-white.png"}
              alt="Persenso"
              fill
              className="object-contain transition-all duration-300"
              sizes="160px"
              priority
            />
          </motion.div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
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
