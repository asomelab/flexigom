import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationData {
  page: number;
  pageCount: number;
}

interface ProductsPaginationProps {
  pagination: PaginationData;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  if (rangeStart > 2) pages.push("ellipsis");
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

export function ProductsPagination({
  pagination,
  isLoading,
  onPageChange,
}: ProductsPaginationProps) {
  if (isLoading || !pagination) {
    return null;
  }

  const pages = getPageNumbers(pagination.page, pagination.pageCount);

  return (
    <div className="mt-8">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (pagination.page > 1) {
                  onPageChange(pagination.page - 1);
                }
              }}
              className={
                pagination.page <= 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                  isActive={pagination.page === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (pagination.page < pagination.pageCount) {
                  onPageChange(pagination.page + 1);
                }
              }}
              className={
                pagination.page >= pagination.pageCount
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
