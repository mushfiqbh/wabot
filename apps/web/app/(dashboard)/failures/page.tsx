"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  AlertTriangle,
  RefreshCw,
  Phone,
  Hash,
  Clock,
  Terminal,
  Filter,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useWhatsApp } from "../../../lib/whatsapp-context";
import { cn } from "../../../lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface MessageFailure {
  id: string;
  client_id: string;
  message_id: string | null;
  number: string | null;
  error_message: string;
  error_code: string | null;
  retry_count: number | null;
  stage: string | null;
  created_at: string;
}

export default function FailuresPage() {
  const { apiKey } = useWhatsApp();
  const [failures, setFailures] = useState<MessageFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");

  const fetchFailures = useCallback(
    async (showLoading = true) => {
      if (!apiKey) return;
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/failures?limit=100`, {
          headers: { "x-api-key": apiKey },
        });
        setFailures(res.data.failures || []);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load failures.",
        );
      } finally {
        if (showLoading) setLoading(false);
        else setRefreshing(false);
      }
    },
    [apiKey],
  );

  useEffect(() => {
    fetchFailures(true);
  }, [fetchFailures]);

  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => fetchFailures(false), 15000);
    return () => clearInterval(interval);
  }, [apiKey, fetchFailures]);

  const stages = Array.from(
    new Set(failures.map((f) => f.stage).filter(Boolean)),
  ) as string[];

  const visibleFailures =
    stageFilter === "all"
      ? failures
      : failures.filter((f) => f.stage === stageFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            Message Failure Log
          </h2>
          <p className="text-gray-500">
            Track every error encountered while sending messages. Auto-refreshes
            every 15 seconds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stages.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Filter size={16} className="text-gray-500" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All stages</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => fetchFailures(false)}
            disabled={refreshing}
            title="Refresh"
            className={cn(
              "p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors",
              refreshing && "opacity-60 cursor-not-allowed",
            )}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
          <RefreshCw className="animate-spin text-gray-400 mr-3" size={20} />
          <span className="text-gray-500">Loading failures...</span>
        </div>
      ) : visibleFailures.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-green-500" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {stageFilter === "all"
              ? "No failures recorded yet"
              : `No failures for stage "${stageFilter}"`}
          </h3>
          <p className="text-gray-500 mt-1">
            Send attempts that fail to deliver will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase font-bold text-gray-500 tracking-wider">
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      When
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} />
                      Recipient
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Terminal size={12} />
                      Error
                    </div>
                  </th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleFailures.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-gray-900">
                        {format(new Date(f.created_at), "MMM d, HH:mm:ss")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(f.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {f.number ? (
                        <span className="font-mono text-gray-800">
                          {f.number}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 max-w-md break-words">
                        {f.error_message}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {f.error_code ? (
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {f.error_code}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {f.stage ? (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {f.stage}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {f.retry_count != null ? (
                        <div className="flex items-center gap-1 text-gray-700">
                          <Hash size={12} className="text-gray-400" />
                          {f.retry_count}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Showing {visibleFailures.length} of {failures.length} most recent
            entries
          </div>
        </div>
      )}
    </div>
  );
}
