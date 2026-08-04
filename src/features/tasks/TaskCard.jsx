import BaseDraggableCard from "../../components/kanban/BaseDraggableCard";
import BaseBadge from "../../components/badge/BaseBadge";
import UserDisplayName from "../../components/UserDisplayName";

import {
  Calendar,
  AlertCircle,
  User,
  Magnet,
  UserCheck,
  Phone,
  Mail,
  MessageCircle,
  CalendarDays,
  Bell,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatDate, isDueToday, isOverdue } from "../../utils/date";

const PRIORITY_DOT = {
  Low: "bg-blue-400",
  Medium: "bg-yellow-400",
  High: "bg-red-400",
};

const TASK_TYPE_ICON = {
  Call: Phone,
  Email: Mail,
  Message: MessageCircle,
  Meeting: CalendarDays,
  Reminder: Bell,
  Other: FileText,
};

const RELATED_ICON = {
  Lead: Magnet,
  Client: UserCheck,
  Quotation: FileText,
};

const getRelatedName = (task) => {
  if (!task.relatedToType || !task.relatedTo) return null;
  const ref = task.relatedTo;
  const type = task.relatedToType;
  if (type === "Lead" || type === "Client") {
    return [ref.firstName, ref.lastName].filter(Boolean).join(" ") || "Unknown";
  }
  if (type === "Quotation") return ref.title || "Unknown";
  return null;
};

const getCardFooterUserName = (task, currentUserId) => {
  const assigned = task.assignedTo;
  const createdBy = task.createdBy;

  if (task.scope === "Personal") {
    const isOwn = createdBy?._id === currentUserId;
    return {
      label: isOwn ? (
        "You"
      ) : createdBy ? (
        <UserDisplayName user={createdBy} showIcon={false}>
          {getDisplayName(createdBy, {
            includeMiddleInitial: true,
            includeSuffix: true,
          })}
        </UserDisplayName>
      ) : (
        "Unknown"
      ),
      type: "personal",
      user: createdBy || null,
    };
  }

  if (!assigned) {
    return { label: "Unassigned", type: "unassigned", user: null };
  }

  const isOwn = assigned?._id === currentUserId;
  return {
    label: isOwn ? (
      "You"
    ) : (
      <UserDisplayName user={assigned} showIcon={false}>
        {getDisplayName(assigned, {
          includeMiddleInitial: true,
          includeSuffix: true,
        })}
      </UserDisplayName>
    ),
    type: "assigned",
    user: assigned,
  };
};

export default function TaskCard({ task, index, isLast, onClick }) {
  const { user: currentUser } = useAuth();
  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isDueToday(task.dueDate, task.status);
  const priorityDot = PRIORITY_DOT[task.priority] || PRIORITY_DOT.Medium;
  const relatedName = getRelatedName(task);
  const RelatedIcon = RELATED_ICON[task.relatedToType];
  const TypeIcon = TASK_TYPE_ICON[task.taskType];
  const cardFooterUserName = getCardFooterUserName(task, currentUser?.id);

  const cardFooterUserPhoto = getProfileImage(cardFooterUserName.user);

  const dueDateTitle = overdue
    ? `Overdue — was due on ${formatDate(task.dueDate)}`
    : dueToday
      ? `Due today — ${formatDate(task.dueDate)}`
      : task.dueDate
        ? `Due on ${formatDate(task.dueDate)}`
        : undefined;

  return (
    <BaseDraggableCard
      id={task._id}
      index={index}
      isLast={isLast}
      onClick={onClick}
    >
      {/* Top row: task type icon + scope badge + priority dot */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-gray-400">
          {TypeIcon && <TypeIcon size={13} strokeWidth={2} />}
          {task.taskType && (
            <span className="text-[11px]">{task.taskType}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <BaseBadge
            title={
              task.scope === "Personal" ? "Personal task" : "Assigned task"
            }
            shape="pill"
            size="xs"
            tone={task.scope === "Personal" ? "indigo" : "teal"}
          >
            {task.scope === "Personal" ? "Personal" : "Assigned"}
          </BaseBadge>
          <div
            className={`w-2 h-2 rounded-full ${priorityDot}`}
            title={`${task.priority} priority`}
          />
        </div>
      </div>

      {/* Subject */}
      <h4 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-1.5">
        {task.subject}
      </h4>

      {/* Related record */}
      {relatedName && RelatedIcon && (
        <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
          <RelatedIcon size={12} strokeWidth={2} />
          <span className="text-[11px] text-gray-500 truncate">
            {relatedName}
          </span>
        </div>
      )}

      {/* Footer: name + due date */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
        <span
          className="flex items-center gap-1.5 truncate"
          title={
            cardFooterUserName.type === "unassigned"
              ? "Unassigned"
              : cardFooterUserName.type === "personal"
                ? "Personal task"
                : "Assigned to"
          }
        >
          {cardFooterUserName.user ? (
            <img
              src={cardFooterUserPhoto}
              alt="assignee avatar"
              className="w-4.5 h-4.5 rounded-full object-cover border"
            />
          ) : (
            <User size={11} />
          )}
          <span className="truncate">{cardFooterUserName.label}</span>
        </span>
        {task.dueDate && (
          <span
            title={dueDateTitle}
            className={`flex items-center gap-1 whitespace-nowrap ${
              overdue
                ? "text-red-500 font-medium"
                : dueToday
                  ? "text-amber-500 font-medium"
                  : ""
            }`}
          >
            <Calendar size={10} />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </BaseDraggableCard>
  );
}