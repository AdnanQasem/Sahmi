import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = decodeURIComponent(hash.slice(1));
      const scrollToTarget = () => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      const frame = requestAnimationFrame(scrollToTarget);
      const timeout = window.setTimeout(scrollToTarget, 100);

      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
      };
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
