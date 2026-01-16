"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  isLoading?: boolean
  className?: string
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  isLoading,
  className
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  const renderPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          disabled={isLoading}
          className={cn(
            "w-9 h-9 rounded-lg text-xs font-bold transition-all duration-200 border",
            currentPage === i
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
              : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
          )}
        >
          {i}
        </button>
      )
    }
    return pages
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between px-4 py-2 gap-2 border-t bg-muted/5", className)}>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-muted-foreground font-medium">
          Showing <span className="text-foreground">Page {currentPage}</span> of {totalPages || 1}
        </p>
        {totalItems !== undefined && (
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
                Total {totalItems.toLocaleString()} records
            </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-primary/10 hover:text-primary border-muted-foreground/20"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" />
          Prev
        </Button>
        
        <div className="hidden sm:flex items-center gap-1.5 mx-1">
          {renderPageNumbers()}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-primary/10 hover:text-primary border-muted-foreground/20"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || isLoading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
