import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  exportFilename?: string;
}

function exportToCsv<T extends object>(data: T[], columns: ColumnDef<T, any>[], filename: string) {
  const headers = ['S/N', ...columns.map((col) => {
    const header = col.header;
    return typeof header === 'string' ? header : (col as any).accessorKey ?? 'column';
  })];

  const rows = data.map((row, index) =>
    [String(index + 1), ...columns.map((col) => {
      const key = (col as any).accessorKey as keyof T | undefined;
      if (!key) return '';
      const value = row[key];
      const str = String(value ?? '');
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    })],
  );

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function DataTable<T extends object>({ data, columns, exportFilename }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnsWithSN = useMemo<ColumnDef<T, any>[]>(() => [
    {
      id: '_sn',
      header: 'S/N',
      cell: (info) => {
        const table = info.table;
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;
        return pageIndex * pageSize + info.row.index + 1;
      },
      enableSorting: false,
      size: 50,
    },
    ...columns,
  ], [columns]);

  const table = useReactTable({
    data,
    columns: columnsWithSN,
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
                <td colSpan={columnsWithSN.length}>
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
          {exportFilename && data.length > 0 ? (
            <button type="button" onClick={() => exportToCsv(data, columns, exportFilename)}>
              Export CSV
            </button>
          ) : null}
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
