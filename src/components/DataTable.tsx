import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';

interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
}

export function DataTable<T extends object>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const start = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
  const end = Math.min(start + table.getState().pagination.pageSize - 1, data.length);
  const pageDescription = data.length ? `${start}-${end} of ${data.length}` : 'No records';

  return (
    <div className="table-shell">
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'is-sortable' : undefined}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state empty-state--table">No records match the current filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>{pageDescription}</span>
        <div className="table-footer__actions">
          <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </button>
          <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
