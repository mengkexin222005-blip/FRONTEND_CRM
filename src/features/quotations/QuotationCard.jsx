import { FiCalendar } from "react-icons/fi";

import BaseDraggableCard from "../../components/kanban/BaseDraggableCard";
import BaseBadge from "../../components/badge/BaseBadge";
import UserDisplayName from "../../components/UserDisplayName";

import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatCurrencyCompact } from "../../utils/currency";
import { formatDate } from "../../utils/date";
// import { getProbabilityTone } from "./utils/quotationPresentation";

export default function QuotationCard({ quotation, index, isLast, onClick }) {
  const clientName = quotation.client
    ? getDisplayName(quotation.client, { includeSuffix: true })
    : "—";

  const assignedName = quotation.assignedTo ? (
    <UserDisplayName user={quotation.assignedTo} showIcon={false}>
      {getDisplayName(quotation.assignedTo, { includeSuffix: true })}
    </UserDisplayName>
  ) : (
    "Unassigned"
  );

  const expectedClose = quotation.expectedCloseDate
    ? formatDate(quotation.expectedCloseDate)
    : null;

  return (
    <BaseDraggableCard
      id={quotation._id}
      index={index}
      isLast={isLast}
      onClick={() => onClick(quotation)}
    >
      
      {/* Value */}
      <div className="flex items-center gap-1.5 text-lg font-bold text-gray-600 mb-2.5">
        {formatCurrencyCompact(quotation.value, quotation.currency)}
      </div>

      {/* Client */}
      <div className="text-xs text-gray-500 mb-1.5 truncate">
        <span className="font-medium text-gray-600">{clientName} · </span>
        {quotation.client?.company && <span>{quotation.client.company}</span>}
      </div>

      {/* Footer: Assigned user + Expected close */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1 truncate">
          <img
            src={getProfileImage(quotation.assignedTo)}
            alt="assignee avatar"
            className="w-5 h-5 rounded-full border"
          />
          {assignedName}
        </span>
        {expectedClose && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <FiCalendar size={11} />
            {expectedClose}
          </span>
        )}
      </div>
    </BaseDraggableCard>
  );
}
