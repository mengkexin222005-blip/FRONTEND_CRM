import { memo } from "react";
import { FiCalendar } from "react-icons/fi";
import BaseDraggableCard from "../../components/kanban/BaseDraggableCard";
import BaseBadge from "../../components/badge/BaseBadge";
import UserDisplayName from "../../components/UserDisplayName";

import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";
import { formatCurrencyCompact } from "../../utils/currency";
import { formatDate } from "../../utils/date";

const STATUS_CONFIG = {
  Draft: { tone: "gray" },
  Sent: { tone: "blue" },
  "Under Review": { tone: "amber" },
  Negotiation: { tone: "purple" },
  Approved: { tone: "green" },
  Rejected: { tone: "red" },
  Expired: { tone: "slate" },
};

function getQuotationDisplayData(quotation) {
  const title =
    quotation.quotationDetails?.quotationTitle ||
    quotation.title ||
    "Untitled Quotation";

  const quotationNumber =
    quotation.quotationDetails?.quotationNumber || quotation.number || null;

  const clientName =
    quotation.quotationDetails?.clientName ||
    quotation.clientName ||
    (quotation.client
      ? getDisplayName(quotation.client, {
          includeMiddleInitial: true,
          includeSuffix: true,
        })
      : "—");

  const quotationDate =
    quotation.quotationDetails?.quotationDate ||
    quotation.quotationDate ||
    quotation.expectedCloseDate;

  const status = quotation.status || quotation.stage || "Draft";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

  const total =
    quotation.value ?? quotation.quotationDetails?.total ?? 0;

  const currency = quotation.currency || "PHP";

  return {
    title,
    quotationNumber,
    clientName,
    quotationDate,
    status,
    statusConfig,
    total,
    currency,
  };
}

const QuotationCard = memo(function QuotationCard({
  quotation,
  index,
  isLast,
  onClick,
}) {
  const {
    title,
    quotationNumber,
    clientName,
    quotationDate,
    status,
    statusConfig,
    total,
    currency,
  } = getQuotationDisplayData(quotation);

  const assignedName = quotation.assignedTo ? (
    <UserDisplayName user={quotation.assignedTo} showIcon={false}>
      {getDisplayName(quotation.assignedTo, { includeSuffix: true })}
    </UserDisplayName>
  ) : (
    "Unassigned"
  );

  return (
    <BaseDraggableCard
      id={quotation._id || quotationNumber || title}
      index={index}
      isLast={isLast}
      onClick={() => onClick?.(quotation)}
    >
      {/* Title & Badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate" title={title}>
            {title}
          </p>
          {quotationNumber && (
            <p className="text-xs text-gray-400 mt-0.5">{quotationNumber}</p>
          )}
        </div>
        <BaseBadge tone={statusConfig.tone} shape="soft" className="shrink-0">
          {status}
        </BaseBadge>
      </div>

      {/* Total Amount */}
      <div className="text-base font-bold text-gray-700 mb-2">
        {formatCurrencyCompact(total, currency)}
      </div>

      {/* Client Name */}
      <div className="text-xs text-gray-500 mb-2 truncate">
        <span className="font-medium text-gray-600">{clientName}</span>
        {quotation.client?.company && (
          <span className="text-gray-400"> · {quotation.client.company}</span>
        )}
      </div>

      {/* Footer: Assignee & Quotation Date */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1.5 truncate max-w-[55%]">
          <img
            src={getProfileImage(quotation.assignedTo)}
            alt="assignee avatar"
            className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
          />
          <span className="truncate">{assignedName}</span>
        </span>
        {quotationDate && (
          <span className="flex items-center gap-1 whitespace-nowrap text-gray-500">
            <FiCalendar size={11} />
            {formatDate(quotationDate)}
          </span>
        )}
      </div>
    </BaseDraggableCard>
  );
});

export default QuotationCard;