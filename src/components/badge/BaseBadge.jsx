export default function Badge({
  children,
  tone = "gray",
  size = "sm",
  shape = "soft",
  icon: Icon,
  className = "",
  title,
}) {
  const tones = {
    gray: "bg-gray-100 text-gray-600 border-gray-300",
    green: "bg-green-50 text-green-600 border-green-400",
    red: "bg-red-50 text-red-600 border-red-300",
    amber: "bg-amber-50 text-amber-700 border-amber-300",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-300",
    blue: "bg-blue-50 text-blue-600 border-blue-400",
    sky: "bg-sky-50 text-sky-700 border-sky-300",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-300",
    purple: "bg-purple-50 text-purple-700 border-purple-300",
    teal: "bg-teal-50 text-teal-700 border-teal-300",
    orange: "bg-orange-50 text-orange-700 border-orange-300",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-300",
  };

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2.5 py-0.5",
    md: "text-xs px-3 py-1",
  };

  const shapes = {
    soft: "rounded-[5px]",
    pill: "rounded-full",
  };

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 font-semibold border whitespace-nowrap ${tones[tone]} ${sizes[size]} ${shapes[shape]} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
