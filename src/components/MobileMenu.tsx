import { useEffect, useState } from "react";

/**
 * MobileMenu — menú de navegación tipo hamburguesa para móviles.
 *
 * - Botón animado que alterna entre icono hamburguesa y "X"
 * - Overlay semitransparente que cierra el menú al hacer clic
 * - Cierra con la tecla Escape
 * - Atributos ARIA para accesibilidad
 */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="md:hidden relative z-[60] flex h-10 w-10 items-center justify-center"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={`h-6 w-6 transition-transform duration-300 ${
            open ? "text-chocolate" : "text-white"
          }`}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          {open ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div
        onClick={() => setOpen(false)}
        role="presentation"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-80 bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-8 gap-6">
          <a href="/">Inicio</a>
          <a href="/biografia">Sobre mí</a>
          <a href="/blog">Blog</a>
          <a href="/contact">Contacto</a>
          <a href="/jutbas">Jutbas</a>
          <a href="/biblioteca">Biblioteca</a>
          <a href="/donar" class="inline-block bg-oro text-chocolate font-bold px-4 py-2 rounded-lg text-sm">
            Donar
          </a>
        </nav>
      </aside>
    </>
  );
}