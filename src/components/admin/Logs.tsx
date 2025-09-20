"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { HiDocumentText, HiSearch, HiTrash } from 'react-icons/hi';
import { useLogsStore } from '../../store/useLogStore';
import { formatDate } from '../../config/format';

const Logs: React.FC = () => {
  const { logs, loadingLogs, hasMore, fetchLogsByAdmin, deleteLog, resetPagination } = useLogsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch logs on component mount
  useEffect(() => {
    fetchLogsByAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = () => {
    resetPagination();
    fetchLogsByAdmin(searchTerm, startDate, endDate, true);
  };

  // Handle load more
  const handleLoadMore = () => {
    fetchLogsByAdmin(searchTerm, startDate, endDate, false);
  };

  // Handle delete log
  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      await deleteLog(logId);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    resetPagination();
    fetchLogsByAdmin('', '', '', true);
  };

  // Deduplicate logs based on ID
  const uniqueLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log, index, self) => 
      self.findIndex(l => l.id === log.id) === index
    );
  }, [logs]);

  return (
    <div className="bg-base-100 rounded-none border border-base-300 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <HiDocumentText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold martian-mono text-primary">System Logs</h2>
            <p className="text-xs text-base-content/60 font-normal italic">
              Track all administrative actions and system events
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline text-xs text-primary martian-mono btn-sm gap-2"
          >
            Filters
          </button>
          <button
            onClick={() => {
              resetPagination();
              fetchLogsByAdmin();
            }}
            className="btn btn-primary text-xs text-white martian-mono btn-sm gap-2"
            disabled={loadingLogs}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-base-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="text-xs italic font-normal text-zinc-500">Search</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="input input-bordered input-sm w-full text-xs martian-mono text-primary rounded-none pr-10"
                />
                <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/60" />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="text-xs italic font-normal text-zinc-500">Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-bordered input-sm w-full text-xs martian-mono text-primary rounded-none"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="text-xs italic font-normal text-zinc-500">End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-bordered input-sm w-full text-xs martian-mono text-primary rounded-none"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSearch}
              className="btn btn-primary btn-sm text-xs martian-mono text-white rounded-none"
              disabled={loadingLogs}
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="btn btn-outline btn-sm text-xs martian-mono text-primary rounded-none"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-4">
        {loadingLogs && logs === null ? (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="ml-2 text-base-content/60">Loading logs...</span>
          </div>
        ) : uniqueLogs && uniqueLogs.length > 0 ? (
          <>
            {uniqueLogs.map((log, index) => (
              <div key={`${log.id}-${index}`} className="card bg-base-50 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-primary martian-mono text-sm">
                          {log.name}
                        </h3>
                        <span className="badge badge-primary badge-sm">
                          {log.logsBy}
                        </span>
                        <span className="text-xs text-base-content/60 italic">
                          {formatDate(log.date)}
                        </span>
                      </div>
                      <p className="text-xs font-normal text-zinc-500 mb-2">
                        {log.description}
                      </p>
  
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      title="Delete log"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  className="btn btn-outline btn-sm text-xs martian-mono text-primary rounded-none"
                  disabled={loadingLogs}
                >
                  {loadingLogs ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <HiDocumentText className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
            <h3 className="text-sm martian-mono font-bold text-primary mb-2">No Logs Found</h3>
            <p className="text-base-content/60 text-xs font-normal italic">
              {searchTerm || startDate || endDate 
                ? 'No logs match your search criteria'
                : 'No logs have been recorded yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {uniqueLogs && uniqueLogs.length > 0 && (
        <div className="mt-6 p-4 bg-base-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-base-content/60">
              Showing {uniqueLogs.length} log{uniqueLogs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
