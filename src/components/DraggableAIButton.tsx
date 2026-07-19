import { useState, useEffect, useRef, useCallback } from "react";
import { Rocket } from "lucide-react";

const STORAGE_KEY = "nishira_ai_position";
const HINT_KEY = "nishira_ai_hint_seen";
const BUTTON_SIZE = 56;
const MARGIN = 16;

export type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export const getCornerPosition = (corner: Corner) => {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bottomOffset = w < 768 ? 80 : MARGIN;
  switch (corner) {
    case "bottom-right":
      return { x: w - BUTTON_SIZE - MARGIN, y: h - BUTTON_SIZE - bottomOffset };
    case "bottom-left":
      return { x: MARGIN, y: h - BUTTON_SIZE - bottomOffset };
    case "top-right":
      return { x: w - BUTTON_SIZE - MARGIN, y: MARGIN + 70 };
    case "top-left":
      return { x: MARGIN, y: MARGIN + 70 };
  }
};

const getNearestCorner = (x: number, y: number): Corner => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  if (x >= cx && y >= cy) return "bottom-right";
  if (x < cx && y >= cy) return "bottom-left";
  if (x >= cx && y < cy) return "top-right";
  return "top-left";
};

export const getSavedCorner = (): Corner => {
  if (typeof window === "undefined") return "bottom-right";
  return (localStorage.getItem(STORAGE_KEY) as Corner) || "bottom-right";
};

type Props = {
  onClick: () => void;
  hasUnread?: boolean;
  onCornerChange?: (corner: Corner) => void;
};

export function DraggableAIButton({ onClick, hasUnread, onCornerChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hasMovedRef = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, btnX: 0, btnY: 0 });

  // Mount + initial position
  useEffect(() => {
    setMounted(true);
    setPos(getCornerPosition(getSavedCorner()));
    if (!localStorage.getItem(HINT_KEY)) {
      setShowHint(true);
      localStorage.setItem(HINT_KEY, "1");
      setTimeout(() => setShowHint(false), 3000);
    }
    const onResize = () => setPos(getCornerPosition(getSavedCorner()));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const snapToCorner = useCallback(
    (x: number, y: number) => {
      const corner = getNearestCorner(x, y);
      setPos(getCornerPosition(corner));
      localStorage.setItem(STORAGE_KEY, corner);
      onCornerChange?.(corner);
    },
    [onCornerChange],
  );

  const beginDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStart.current = { mouseX: clientX, mouseY: clientY, btnX: pos.x, btnY: pos.y };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    beginDrag(e.clientX, e.clientY);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    beginDrag(t.clientX, t.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const move = (clientX: number, clientY: number) => {
      const dx = clientX - dragStart.current.mouseX;
      const dy = clientY - dragStart.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMovedRef.current = true;
      const newX = Math.max(0, Math.min(window.innerWidth - BUTTON_SIZE, dragStart.current.btnX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - BUTTON_SIZE, dragStart.current.btnY + dy));
      setPos({ x: newX, y: newY });
    };

    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    };
    const finish = (x: number, y: number) => {
      setIsDragging(false);
      if (hasMovedRef.current) snapToCorner(x, y);
    };
    const onMouseUp = (e: MouseEvent) => finish(e.clientX, e.clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      finish(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, snapToCorner]);

  const handleClick = () => {
    if (!hasMovedRef.current) onClick();
  };

  if (!mounted) return null;

  const corner = getSavedCorner();
  const hintOnLeft = corner.endsWith("left");

  return (
    <>
      <button
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={handleClick}
        title="NISHIRA.AI — Drag to move"
        aria-label="Open NISHIRA.AI"
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          zIndex: 9999,
          cursor: isDragging ? "grabbing" : "grab",
          transition: isDragging ? "none" : "left 0.3s ease, top 0.3s ease, transform 0.2s ease",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #00d4ff)",
          border: "none",
          boxShadow: isDragging
            ? "0 8px 32px rgba(124,58,237,0.6)"
            : "0 4px 20px rgba(124,58,237,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
          transform: isDragging ? "scale(1.1)" : "scale(1)",
        }}
      >
        <Rocket className="h-6 w-6" />
        {hasUnread && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #0d0d1a",
            }}
          />
        )}
      </button>
      {showHint && (
        <div
          style={{
            position: "fixed",
            left: hintOnLeft ? pos.x + BUTTON_SIZE + 8 : undefined,
            right: hintOnLeft ? undefined : window.innerWidth - pos.x + 8,
            top: pos.y + BUTTON_SIZE / 2 - 14,
            zIndex: 9998,
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(13,13,26,0.95)",
            border: "1px solid #2a2a4e",
            color: "#fff",
            fontSize: 12,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        >
          Drag me anywhere!
        </div>
      )}
    </>
  );
}
