export const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const calculateQuotationTotals = (
  items = [],
  taxRate = 0,
  discount = 0,
) => {
  // Always work with an array
  const safeItems = Array.isArray(items) ? items : [];

  const subtotal = safeItems.reduce((sum, item = {}) => {
    return (
      sum +
      toNumber(item.quantity) *
        toNumber(item.unitPrice)
    );
  }, 0);

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, toNumber(discount))
  );

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount
  );

  const taxAmount =
    taxableAmount *
    (Math.max(0, toNumber(taxRate)) / 100);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total: taxableAmount + taxAmount,
  };
};

export const createQuotationNumber = () => {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-4);

  return `QUO-${year}-${suffix}`;
};

export const toDateInput = (date) => {
  if (!date) return "";

  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

export const addDays = (date, days) => {
  const baseDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(baseDate.getTime())) {
    return new Date();
  }

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};