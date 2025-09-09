import React, {
  useState,
  useRef,
  useEffect,
  ReactNode,
  isValidElement,
  cloneElement,
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content: string | ReactNode;
  children: ReactNode; // we will wrap this in a span for handlers
  offset?: number;
  maxWidth?: number;
};

export default function Tooltip({
  content,
  children,
  offset = 12,
  maxWidth = 260,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [id] = useState(() => `tooltip-${Math.random().toString(36).slice(2, 9)}`);

  // Ensure portal root
  useEffect(() => {
    if (typeof document === "undefined") return;
    let node = document.getElementById("tooltip-root");
    if (!node) {
      node = document.createElement("div");
      node.setAttribute("id", "tooltip-root");
      document.body.appendChild(node);
    }
  }, []);

  // Re-position on resize/scroll when visible
  useEffect(() => {
    if (!visible) return;
    function recalc() {
      if (lastPointer.current) {
        const { x, y } = lastPointer.current;
        positionAtPointer(x, y);
      } else if (triggerRef.current) {
        positionAtElement(triggerRef.current);
      }
    }
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true); // capture scrolling in any container
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function positionAtPointer(clientX: number, clientY: number) {
    const el = tooltipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padding = 8;
    // default below pointer
    let left = clientX - rect.width / 2;
    let top = clientY + offset;

    // horizontal clamp
    if (left < padding) left = padding;
    if (left + rect.width > window.innerWidth - padding)
      left = Math.max(padding, window.innerWidth - rect.width - padding);

    // if not enough space below, put above pointer
    if (top + rect.height > window.innerHeight - padding) {
      top = clientY - rect.height - offset;
      if (top < padding) top = padding;
    }

    setPos({ left, top });
  }

  function positionAtElement(el: HTMLElement) {
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;
    const elRect = el.getBoundingClientRect();
    const rect = tooltipEl.getBoundingClientRect();
    const padding = 8;

    // prefer below element, centered
    let left = elRect.left + elRect.width / 2 - rect.width / 2;
    let top = elRect.bottom + offset;

    // horizontal clamp
    if (left < padding) left = padding;
    if (left + rect.width > window.innerWidth - padding)
      left = Math.max(padding, window.innerWidth - rect.width - padding);

    // if not enough space below, place above element
    if (top + rect.height > window.innerHeight - padding) {
      top = elRect.top - rect.height - offset;
      if (top < padding) top = padding;
    }

    setPos({ left, top });
  }

  function handlePointerMove(e: React.PointerEvent) {
    lastPointer.current = { x: e.clientX, y: e.clientY };
    positionAtPointer(e.clientX, e.clientY);
  }

  function handleMouseEnter(e: React.MouseEvent) {
    const tgt = e.currentTarget as HTMLElement;
    triggerRef.current = tgt;
    setVisible(true);
    lastPointer.current = { x: (e as any).clientX ?? window.innerWidth / 2, y: (e as any).clientY ?? window.innerHeight / 2 };
    requestAnimationFrame(() => {
      if (lastPointer.current) positionAtPointer(lastPointer.current.x, lastPointer.current.y);
    });
  }

  function handleMouseLeave() {
    setVisible(false);
    lastPointer.current = null;
    triggerRef.current = null;
  }

  function handleFocus(e: React.FocusEvent) {
    const el = e.currentTarget as HTMLElement;
    triggerRef.current = el;
    setVisible(true);
    requestAnimationFrame(() => {
      if (triggerRef.current) positionAtElement(triggerRef.current);
    });
  }

  function handleBlur() {
    setVisible(false);
    triggerRef.current = null;
  }

  // We'll wrap the child in a span and attach handlers to the wrapper.
  // For accessibility, if child is a valid element we clone it to add aria-describedby id.
  let childWithAria: ReactNode = children;
  if (isValidElement(children)) {
    try {
      childWithAria = cloneElement(children as any, {
        "aria-describedby": visible ? id : undefined,
      });
    } catch {
      // if for some reason cloneElement fails, fall back to original child
      childWithAria = children;
    }
  }

  const portalRoot = typeof document !== "undefined" ? document.getElementById("tooltip-root") : null;

  const tooltipNode = (
    <div
      ref={tooltipRef}
      id={id}
      role="tooltip"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 2147483647, // very high to avoid clipping by other contexts
        maxWidth,
        pointerEvents: "none", // don't capture pointer
        transition: "opacity 120ms ease",
        opacity: visible ? 1 : 0,
      }}
      className="rounded bg-slate-800 text-white text-xs px-2 py-1 shadow-lg"
    >
      {content}
    </div>
  );

  // wrapper uses inline-flex so it doesn't break layout; it will forward pointer/focus events to handlers.
  return (
    <>
      <span
        ref={(el) => {
          // keep a ref to wrapper as triggerRef for focus-based positioning if needed
          if (el) triggerRef.current = el;
        }}
        className="inline-flex"
        onPointerMove={handlePointerMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {childWithAria}
      </span>

      {portalRoot && visible ? createPortal(tooltipNode, portalRoot) : null}
    </>
  );
}
