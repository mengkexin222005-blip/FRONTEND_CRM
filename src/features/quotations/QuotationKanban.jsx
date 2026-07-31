import BaseKanban from "../../components/kanban/BaseKanban";
import KanbanColumnHeader from "../../components/kanban/KanbanColumnHeader";
import QuotationCard from "./QuotationCard";
import LoaderCards from "../../components/loader/CardsLazyLoader";

const STATUSES = [
  "Draft",
  "Sent",
  "Under Review",
  "Negotiation",
  "Approved",
  "Rejected",
  "Expired",
];

const STATUS_COLORS = {
  Draft: "bg-gray-100",
  Sent: "bg-blue-100",
  "Under Review": "bg-amber-100",
  Negotiation: "bg-violet-100",
  Approved: "bg-green-100",
  Rejected: "bg-red-100",
  Expired: "bg-slate-100",
};

const formatTotal = (quotations) => {
  const totals = quotations.reduce((acc, q) => {
    const currency = q.currency || "PHP";
    const amount = q.value ?? q.quotationDetails?.total ?? 0;
    acc[currency] = (acc[currency] || 0) + amount;
    return acc;
  }, {});

  const SYMBOLS = { PHP: "₱", USD: "$", EUR: "€" };
  
  return Object.entries(totals)
    .map(
      ([currency, amount]) =>
        `${SYMBOLS[currency] || currency} ${amount.toLocaleString()}`
    )
    .join(" · ");
};

export default function QuotationKanban({
  quotations = [],
  permissions = {},
  onDragEnd,
  onAddQuotation,
  onCardClick,
  isLoading = false,
}) {
  if (isLoading) {
    return <LoaderCards columns={STATUSES} />;
  }

  // Group quotations by status (with stage fallback during migration)
  const columns = STATUSES.reduce((acc, status) => {
    acc[status] = quotations.filter(
      (q) => (q.status || q.stage || "Draft") === status
    );
    return acc;
  }, {});

  return (
    <BaseKanban
      columns={columns}
      statuses={STATUSES}
      onDragEnd={onDragEnd}
      emptyMessage="No quotations"
      renderHeader={(status, columnQuotations) => (
        <KanbanColumnHeader
          label={status}
          count={columnQuotations.length}
          subtext={formatTotal(columnQuotations)}
          colorClass={STATUS_COLORS[status]}
          onAdd={permissions?.canCreate ? () => onAddQuotation?.(status) : null}
          addLabel={`Add quotation to ${status}`}
        />
      )}
      renderCard={(quotation, index, columnQuotations) => (
        <QuotationCard
          key={quotation._id || quotation.quotationDetails?.quotationNumber || quotation.title}
          quotation={quotation}
          index={index}
          isLast={index === columnQuotations.length - 1}
          onClick={() => onCardClick?.(quotation)}
        />
      )}
    />
  );
}