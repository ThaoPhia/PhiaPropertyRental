import { Badge } from '@/components/ui/badge';
import type { Application } from '../types';

interface ApplicationsListPanelProps {
  applications: Application[];
  selectedApplicationId: number | null;
  statusFilter: string | null;
  dateFromFilter: string;
  dateToFilter: string;
  onStatusFilterChange: (status: string | null) => void;
  onDateFromFilterChange: (value: string) => void;
  onDateToFilterChange: (value: string) => void;
  onClearDateFilters: () => void;
  onSelectApplication: (application: Application) => void;
}

export function ApplicationsListPanel({
  applications,
  selectedApplicationId,
  statusFilter,
  dateFromFilter,
  dateToFilter,
  onStatusFilterChange,
  onDateFromFilterChange,
  onDateToFilterChange,
  onClearDateFilters,
  onSelectApplication,
}: ApplicationsListPanelProps) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Applications ({applications.length})
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onStatusFilterChange(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  statusFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {['pending', 'approved', 'declined'].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition capitalize ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Filter by Date</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => onDateFromFilterChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => onDateToFilterChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="To"
                />
                {(dateFromFilter || dateToFilter) && (
                  <button
                    onClick={onClearDateFilters}
                    className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => onSelectApplication(app)}
              className={`w-full text-left p-4 hover:bg-blue-50 transition ${
                selectedApplicationId === app.id ? 'bg-blue-100' : ''
              }`}
            >
              <p className="font-semibold text-gray-900">{app.applicantName}</p>
              <p className="text-sm text-gray-600">{app.propertyName}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
                {app.status && (
                  <Badge
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                      app.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : app.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {app.status}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
