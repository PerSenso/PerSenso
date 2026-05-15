const Footer = () => (
  <footer
    id="nosotros"
    className="relative py-16 px-4 overflow-hidden"
    style={{ background: "var(--ps-footer-bg)", borderTop: "1px solid var(--ps-footer-border)" }}
  >
    <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: "linear-gradient(90deg, transparent, var(--ps-gold), transparent)", opacity: 0.3 }} />

    <div className="container mx-auto text-center">
      <h3 className="font-display text-3xl font-semibold mb-2 tracking-wider" style={{ color: "var(--ps-gold)" }}>
        PERSENSO
      </h3>
      <div className="mx-auto mb-6 h-[1px] w-16" style={{ background: "linear-gradient(90deg, transparent, var(--ps-gold), transparent)", opacity: 0.4 }} />

      <p className="text-sm max-w-md mx-auto mb-8 leading-relaxed" style={{ color: "var(--ps-footer-text)" }}>
        Perfumes árabes, de diseñador y de nicho, 100% originales. Tu fragancia ideal te espera.
      </p>

      <div className="flex items-center justify-center gap-4 text-[11px]" style={{ color: "var(--ps-footer-text)" }}>
        <p>© {new Date().getFullYear()} Persenso. Todos los derechos reservados.</p>
        <span style={{ color: "var(--ps-border)" }}>·</span>
        <a href="/admin-login" className="hover:opacity-80 transition-opacity" style={{ color: "var(--ps-gold)" }}>
          Admin
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
