"use client";
import Image from "next/image";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background with subtle zoom */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: "easeOut" }}
      >
        <Image
          src="/hero-perfume.jpg"
          alt="Colección de perfumes de lujo Persenso"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
      </motion.div>

      {/* Floating gold particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + (i * 1.5) % 4,
              height: 3 + (i * 1.5) % 4,
              background: `rgba(201, 168, 76, ${0.15 + (i * 0.04) % 0.2})`,
              left: `${10 + i * 14}%`,
              top: `${20 + (i * 7) % 60}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mb-8 h-[1px] w-24"
          style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }}
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-[11px] md:text-xs uppercase tracking-[0.5em] text-white/60 mb-6 font-medium"
        >
          ✦ Perfumes 100% Originales ✦
        </motion.p>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-48 md:h-72 mx-auto mb-6 drop-shadow-2xl"
        >
          <Image
            src="/logo-persenso-white.png"
            alt="Persenso"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 300px, 500px"
            priority
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-base md:text-lg text-white/70 max-w-lg mx-auto mb-10 leading-relaxed font-light"
        >
          Fragancias exclusivas de diseñador, árabes y de nicho.
          <br />
          <span className="text-white/90 font-normal">Eleva tu presencia con aromas que dejan huella.</span>
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(201, 168, 76, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          href="#catalogo"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-300 shadow-xl"
          style={{
            background: "linear-gradient(135deg, #8a6c28, #c9a84c, #e8c97a)",
            color: "#0d0d0f",
          }}
        >
          <span>Explorar Colección</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l9.2-9.2M17 17V7H7"/>
          </svg>
        </motion.a>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
          className="mx-auto mt-10 h-[1px] w-16"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.4), transparent)" }}
        />
      </div>

      <div
        className="absolute bottom-0 left-0 w-full h-40"
        style={{ background: `linear-gradient(to top, var(--ps-bg), transparent)` }}
      />

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white/50"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
