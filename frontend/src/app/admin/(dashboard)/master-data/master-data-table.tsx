import type { ReactNode } from "react";
import { Edit2, Loader2, Trash2 } from "lucide-react";

interface MasterDataTableProps {
  label: string;
  columns: string[];
  loading: boolean;
  error: string;
  empty: boolean;
  onRetry: () => void;
  children: ReactNode;
}

export function MasterDataTable({
  label,
  columns,
  loading,
  error,
  empty,
  onRetry,
  children,
}: MasterDataTableProps) {
  const showMessage = loading || error || empty;

  return (
    <div
      role="region"
      aria-label={`${label} records`}
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600"
    >
      <table role="table" aria-label={label} aria-busy={loading} className="mobile-records w-full text-left text-sm">
        <thead role="rowgroup" className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
          <tr role="row">
            {columns.map((column) => (
              <th key={column} role="columnheader" scope="col" className="whitespace-nowrap px-4 py-3">
                {column}
              </th>
            ))}
            <th role="columnheader" scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="divide-y divide-gray-100 text-gray-600 [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
          {showMessage ? (
            <tr role="row">
              <td role="cell" colSpan={columns.length + 1}>
                <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 text-center text-sm">
                  {loading ? (
                    <span role="status" className="inline-flex items-center gap-2">
                      <Loader2 aria-hidden="true" className="size-4 animate-spin text-teal-700 motion-reduce:animate-none" />
                      Loading {label.toLowerCase()}…
                    </span>
                  ) : error ? (
                    <>
                      <span role="alert" className="text-red-700">{error}</span>
                      <button type="button" onClick={onRetry} className="cursor-pointer font-semibold text-teal-700 underline">
                        Retry
                      </button>
                    </>
                  ) : (
                    <span role="status">No {label.toLowerCase()} found.</span>
                  )}
                </div>
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

interface RecordActionsProps {
  name: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RecordActions({ name, onEdit, onDelete }: RecordActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${name}`}
        title={`Edit ${name}`}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-gray-100"
      >
        <Edit2 aria-hidden="true" className="size-4" />
      </button>
      )}
      {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${name}`}
        title={`Delete ${name}`}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
      )}
    </div>
  );
}
