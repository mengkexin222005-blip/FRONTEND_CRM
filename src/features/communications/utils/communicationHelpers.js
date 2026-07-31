export function filterConversations(threads = [], activeFilter = "all", searchTerm = "") {
  if (!Array.isArray(threads)) return [];

  return threads.filter((thread) => {
    const match =
      (thread?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (thread?.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase());

    switch (activeFilter?.toLowerCase()) {
      case "unread":
        return match && thread?.unread > 0;
      case "archived":
        return match && thread?.isArchived;
      default:
        return match && !thread?.isArchived;
    }
  });
}

export function getRoleBadgeStyles(role) {
  switch (role?.toLowerCase()) {
    case "client":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "lead":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "prospect":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}