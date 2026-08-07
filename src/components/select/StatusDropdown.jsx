import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import BaseBadge from "../badge/BaseBadge";

export default function StatusDropdown({
  status,
  statuses,
  toneMap,
  onSelect,
  onBeforeSelect,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on any scroll (capture phase catches table scroll too)
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        minWidth: 160,
        zIndex: 9999,
      });
    }
    setOpen((p) => !p);
  };

  const handleSelect = (e, newStatus) => {
    e.stopPropagation();
    setOpen(false);
    if (newStatus === status) return;
    if (onBeforeSelect) {
      onBeforeSelect(newStatus);
      return;
    }
    onSelect(newStatus);
  };

  if (disabled) {
    return (
      <BaseBadge tone={toneMap[status] ?? "gray"} className="w-[105px] justify-center">
        {status}
      </BaseBadge>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-1 cursor-pointer focus:outline-none"
      >
        <BaseBadge
          tone={toneMap[status] ?? "gray"}
          className="w-[105px] justify-center flex items-center gap-1"
        >
          <span>{status}</span>
          <ChevronDown
            size={11}
            className={`transition-transform duration-150 shrink-0 ${
              open ? "rotate-180" : ""
            }`}
          />
        </BaseBadge>
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="py-1.5 bg-white border border-gray-100 rounded-md shadow-lg"
          >
            {statuses.map((s) => (
              <button
                key={s}
                onClick={(e) => handleSelect(e, s)}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2.5 transition-colors duration-100 border-l-3 ${
                  s === status
                    ? "bg-gray-200 border-[#E7000B]"
                    : "border-transparent hover:bg-gray-100"
                }`}
              >
                <BaseBadge
                  tone={toneMap[s] ?? "gray"}
                  className="w-[105px] justify-center"
                >
                  {s}
                </BaseBadge>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}