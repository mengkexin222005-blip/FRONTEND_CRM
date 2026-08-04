import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function HeaderFilterDropdown({
  icon: Icon,
  ariaLabel,
  value,
  options,
  onChange,
  minimumWidth = 145,
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!options.length) return;

    const valueStillExists = options.some((option) => option.value === value);
    if (!valueStillExists) {
      onChange(options[0].value);
    }
  }, [onChange, options, value]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={!options.length}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-red-500/50 text-red-600"
            : "border-black/10 text-black/65 hover:border-red-500/30"
        }`}
        style={{ minWidth: `${minimumWidth}px` }}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon size={14} className="shrink-0 text-red-600" />
          <span className="truncate">{selectedOption?.label}</span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-lg">
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium text-black/40">
            Select option
          </p>
          <div className="max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                    selected
                      ? "bg-red-50 font-semibold text-red-600"
                      : "text-black/65 hover:bg-black/5"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && (
                    <Check size={14} className="shrink-0 text-red-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}