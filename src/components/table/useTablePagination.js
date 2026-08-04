import { useMemo, useState } from "react";

const getPageWindow = (currentPage, totalPages) => {
  const windowSize = Math.min(5, totalPages);
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export default function useTablePagination(
  items = [],
  initialRowsPerPage = 10,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalRows = items.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, rowsPerPage]);

  const pageWindow = useMemo(
    () => getPageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const goTo = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const changeRowsPerPage = (value) => {
    const newRows = Number(value);
    const newTotalPages = Math.max(1, Math.ceil(items.length / newRows));

    setRowsPerPage(newRows);
    setCurrentPage((prev) => Math.min(prev, newTotalPages));
  };

  const from = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const to = Math.min(currentPage * rowsPerPage, totalRows);

  return {
    currentPage,
    rowsPerPage,
    totalRows,
    totalPages,
    paginatedItems,
    pageWindow,
    from,
    to,
    goTo,
    setCurrentPage,
    setRowsPerPage: changeRowsPerPage,
  };
}