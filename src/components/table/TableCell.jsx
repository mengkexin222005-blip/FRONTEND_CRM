export default function TableCell({
  children,
  align = "text-left",
  className = "",
}) {
  return (
    <td
      className={`p-2 text-sm text-gray-700 group-hover:text-[#ef4444] ${align} ${className}`}
    >
      {children}
    </td>
  );
}