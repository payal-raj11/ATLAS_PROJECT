import { useEffect, useRef, useState } from "react";


// Triggers once an element first scrolls into the viewport, then
// stops watching — used to defer a chart's entrance animation until
// the user actually scrolls to it, instead of firing (and finishing)
// at page load while the chart is still off-screen further down a
// long dashboard.
export function useInViewOnce({ threshold = 0.25, rootMargin = "0px 0px -40px 0px" } = {}) {

  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {

    if (inView) return;

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      // no IntersectionObserver support — just show it animated
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();

  }, [inView, threshold, rootMargin]);

  return [ref, inView];

}


export default useInViewOnce;
