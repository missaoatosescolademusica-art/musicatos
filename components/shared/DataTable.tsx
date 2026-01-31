"use client"
import React from "react"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

/**
 * Generic column configuration for DataTable.
 * @template T Row/item type
 */
export type Column<T> = {
  /** Header label */
  header: string
  /** Optional class name for the header cell */
  headerClassName?: string
  /** Render function for the cell. Receives the row item. */
  render: (item: T) => React.ReactNode
  /** Optional class name for the body cell */
  cellClassName?: string
}

/**
 * Props for the reusable DataTable with pagination.
 * @template T Row/item type
 */
export type DataTableProps<T> = {
  /** Dataset to render */
  data: T[]
  /** Column configuration */
  columns: Column<T>[]
  /** Loading flag to show skeleton/placeholder */
  loading?: boolean
  /** Message shown when there are no records */
  emptyMessage?: string
  /** Current page index (1-based) */
  currentPage: number
  /** Total pages available */
  totalPages: number
  /** Page size (items per page), used for display; actual slicing is external */
  pageSize?: number
  /** Called when the page changes */
  onPageChange: (page: number) => void
  /** Optional row click handler */
  onRowClick?: (item: T) => void
  /** Class name overrides */
  containerClassName?: string
  tableClassName?: string
  headerRowClassName?: string
  bodyRowClassName?: string
  /** Right-side area above the table (e.g., actions) */
  extraTopRight?: React.ReactNode
}

/**
 * Reusable DataTable with pagination, fully typed and responsive.
 *
 * - Accepts any dataset and column renderers
 * - Displays loading & empty states
 * - Provides pager controls consistent with the design system
 */
export default function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onRowClick,
  containerClassName = "bg-card border-border overflow-hidden shadow-xl",
  tableClassName,
  headerRowClassName = "bg-muted/50",
  bodyRowClassName = "border-border hover:bg-muted/50 transition",
  extraTopRight,
}: DataTableProps<T>) {
  return (
    <Card className={containerClassName}>
      <div className="overflow-x-auto">
        <Table className={tableClassName}>
          <TableHeader className={headerRowClassName}>
            <TableRow className="border-border hover:bg-muted/50">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={
                    col.headerClassName ??
                    "text-muted-foreground font-semibold"
                  }
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => (
                <TableRow
                  key={i}
                  className={bodyRowClassName}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col, idx) => (
                    <TableCell
                      key={idx}
                      className={
                        col.cellClassName ?? "text-foreground"
                      }
                    >
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-muted border-t border-border px-6 py-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Página {currentPage} de {totalPages || 1}
          {pageSize ? ` • ${data.length} / ${pageSize} itens` : ""}
        </p>
        <div className="flex items-center gap-2">
          {extraTopRight}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-border hover:bg-muted"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="border-border hover:bg-muted"
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  );
}
