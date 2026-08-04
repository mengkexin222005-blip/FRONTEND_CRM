export default function TableRow({
  children,
  onClick,
  title = "Click to view details",
  className = "",
}) {
  return (
    <tr
      onClick={onClick}
      title={title}
      className={`cursor-pointer hover:bg-red-50 transition-colors group ${className}`}
    >
      {children}
    </tr>
  );
}