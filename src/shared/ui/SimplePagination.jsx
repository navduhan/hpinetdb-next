import Pagination from "react-bootstrap/Pagination";

export function SimplePagination({ page, pageCount, onPageChange }) {
  if (!pageCount || pageCount <= 1) {
    return null;
  }

  const windowStart = Math.max(0, page - 2);
  const windowEnd = Math.min(pageCount - 1, page + 2);

  const items = [];
  for (let i = windowStart; i <= windowEnd; i += 1) {
    items.push(
      <Pagination.Item key={i} active={i === page} onClick={() => onPageChange(i)}>
        {i + 1}
      </Pagination.Item>
    );
  }

  return (
    <Pagination className="mb-0 mt-2 hp-pagination">
      <Pagination.First onClick={() => onPageChange(0)} disabled={page === 0} />
      <Pagination.Prev onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} />
      {windowStart > 0 ? <Pagination.Ellipsis disabled /> : null}
      {items}
      {windowEnd < pageCount - 1 ? <Pagination.Ellipsis disabled /> : null}
      <Pagination.Next onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))} disabled={page === pageCount - 1} />
      <Pagination.Last onClick={() => onPageChange(pageCount - 1)} disabled={page === pageCount - 1} />
    </Pagination>
  );
}
