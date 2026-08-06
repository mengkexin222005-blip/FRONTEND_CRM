import {
  BarChart3,
  CalendarCheck2,
  Check,
  FileText,
  Headphones,
  LayoutDashboard,
  ListTodo,
  Magnet,
  MessageSquare,
  Phone,
  Settings,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";

const ICONS = {
  Dashboard: LayoutDashboard,
  // Teams: UsersRound,
  Prospects: UserPlus,
  Leads: Magnet,
  Clients: UserRound,
  Quotations: FileText,
  Tasks: ListTodo,
  Meetings: CalendarCheck2,
  Calls: Phone,
  Messages: MessageSquare,
  Support: Headphones,
  Settings,
  Reports: BarChart3,
};

export default function AccessCard({
  title,
  items = [],
  selected = false,
  onClick,
}) {
  const disabled = typeof onClick !== "function";

  return (
    <section className="bg-white p-3">
      <h3
        className={`mb-2 text-sm font-semibold ${
          selected ? "text-red-600" : "text-slate-700"
        }`}
      >
        {title} ({items.length})
      </h3>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => {
            const Icon = ICONS[item] || LayoutDashboard;

            return (
              <button
                key={item}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={
                  selected
                    ? `Remove ${item} access`
                    : `Add ${item} access`
                }
                title={
                  selected
                    ? `Remove ${item} access`
                    : `Add ${item} access`
                }
                onClick={() => onClick?.(item)}
                className={`relative flex h-17 min-w-0 flex-col items-center justify-center rounded-md border px-1 pb-1 pt-2.5 text-center transition ${
                  selected
                    ? "border-red-200 bg-red-50/25 hover:border-red-400"
                    : "border-slate-200 bg-slate-50/20 hover:border-red-300 hover:bg-red-50/20"
                } ${
                  disabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <span
                  className={`absolute left-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded ${
                    selected
                      ? "border border-red-600 bg-red-600 text-white"
                      : "border border-slate-400 bg-white text-transparent"
                  }`}
                >
                  <Check size={9} strokeWidth={3} />
                </span>

                <span className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-900">
                  <Icon size={15} strokeWidth={1.7} />
                </span>

                <span className="max-w-full truncate text-[10px] font-semibold leading-tight text-slate-800">
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-gray-300 text-xs text-gray-400">
          No access available.
        </div>
      )}
    </section>
  );
}
