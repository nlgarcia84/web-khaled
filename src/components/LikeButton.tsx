import { useEffect, useState } from "react";

interface LikeButtonProps {
  slug: string;
  initialLikes: number;
}

// Devuelve true si este navegador ya dio like a este post (mira la cookie).
function hasLiked(slug: string): boolean {
  return document.cookie
    .split("; ") // separamos todas las cookies del navegador
    .some((trozo) => trozo.split("=")[0] === `liked_${slug}`); // ¿existe la nuestra?
}

export const LikeButton = ({ slug, initialLikes }: LikeButtonProps) => {
  // Contador visible en el botón (empieza con el valor que viene del servidor).
  const [likes, setLikes] = useState(initialLikes);
  // Empieza en false: seguro para render en servidor (allí no existe `document`).
  const [liked, setLiked] = useState(false);

  // useEffect solo corre en el navegador: aquí sí es seguro leer la cookie.
  useEffect(() => {
    setLiked(hasLiked(slug));
  }, [slug]);

  // Al hacer clic: incrementa el like en el servidor y bloquea el doble voto.
  const handleClick = async () => {
    if (liked) return; // ya votó, no hacemos nada

    try {
      // Pide al endpoint que sume 1 en Sanity. Content-Type: application/json
      // es clave: iOS Safari no envía el header `Origin` en fetch same-origin, y
      // sin él la protección CSRF de Astro bloquea el POST. Con JSON, la petición
      // no se trata como "form submission" y pasa la protección.
      const res = await fetch(`/api/likes/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return; // si algo falla, salimos sin tocar nada

      // El servidor responde { likes: númeroNuevo } → actualizamos el contador.
      const data = await res.json();
      setLikes(data.likes);
      setLiked(true); // bloqueamos el botón
      document.cookie = `liked_${slug}=1`; // y lo recordamos en la cookie
    } catch (err) {
      console.error("Error al registrar el like:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={liked} // si ya votó, el botón queda desactivado
      aria-label="Me gusta este artículo"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-oro/40 text-marron hover:border-oro hover:text-oro hover:bg-oro/5 transition-colors cursor-pointer font-medium text-sm mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      {likes === 0 ? "Like" : `Like (${likes})`}
    </button>
  );
};
