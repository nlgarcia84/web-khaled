import gsap from "gsap";

type Direction = "bottom" | "center" | "side";
type Style = "alternate" | "in" | "out";

export interface RevealOptions {
  stagger?: number;
  from?: Direction;
  distance?: number;
  style?: Style;
}

export function revealOnScroll(selector: string, opts: RevealOptions = {}) {
  const { stagger = 0.1, from = "bottom", distance = 40, style = "alternate" } =
    opts;
  const els = document.querySelectorAll<HTMLElement>(selector);
  if (!els.length) return;

  // Precarga: elementos quedarán ocultos hasta entrar en el viewport.
  gsap.set(els, { autoAlpha: 0 });

  const isIntersecting = (e: IntersectionObserverEntry) => e.isIntersecting;

  const animate = (target: HTMLElement, index: number, delay = 0) => {
    const base = {
      duration: 0.5,
      ease: "power2.out",
      overwrite: "auto",
      clearProps: "transform",
    };

    const dir =
      style === "in" ? 1 : style === "out" ? -1 : index % 2 === 0 ? -1 : 1;

    const fromVars: gsap.TweenVars = { autoAlpha: 0 };
    const toVars: gsap.TweenVars = { autoAlpha: 1, delay, ...base };

    if (from === "center") {
      gsap.set(target, { transformOrigin: "center center" });
      fromVars.scale = 0.92;
      fromVars.y = 16;
      toVars.scale = 1;
      toVars.y = 0;
    } else if (from === "side") {
      fromVars.x = dir * distance;
      toVars.x = 0;
    } else {
      fromVars.y = distance;
      toVars.y = 0;
    }

    gsap.fromTo(target, fromVars, toVars);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(isIntersecting);
      if (!visible.length) return;

      // Respetamos el stagger entre los que entran en esta ronda.
      const targets = visible.map((e) => e.target as HTMLElement);
      targets.forEach((t, i) => animate(t, i, i * stagger));
      targets.forEach((t) => observer.unobserve(t));
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );

  els.forEach((el) => observer.observe(el));
}