"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth-context";
import { AlertCircle, BarChart3, CheckCircle2, Clock3, RefreshCw, Search, Send } from "lucide-react";
import { format } from "date-fns";

type MessageStatus = "pending" | "processing" | "sent" | "failed";
interface MessageRow {
  id: string;
  number: string;
  message: string;
  status: MessageStatus;
  error: string | null;
  retry_count: number | null;
  created_at: string;
  sent_at: string | null;
}

const PAGE_SIZE = 20;
const statusLabel: Record<MessageStatus, string> = {
  sent: "Sent", failed: "Failed", pending: "Pending", processing: "Processing",
};

function dayStart(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function within(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date < end;
}

function MetricCard({ title, total, sent, failed, pending, icon: Icon, tone }: {
  title: string; total: number; sent: number; failed: number; pending: number;
  icon: typeof Send; tone: string;
}) {
  const successRate = total ? Math.round((sent / total) * 100) : 0;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <span className={`rounded-xl p-2.5 ${tone}`}><Icon size={19} /></span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{total.toLocaleString()}</p>
      <p className="mt-1 text-xs text-gray-500">messages processed</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs">
        <span className="text-green-700">{sent.toLocaleString()} sent</span>
        <span className="text-red-600">{failed.toLocaleString()} failed</span>
        <span className="text-amber-600">{pending.toLocaleString()} queued</span>
        <span className="ml-auto font-semibold text-gray-700">{successRate}% success</span>
      </div>
    </section>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const fetchMessages = useCallback(async (initial = false) => {
    if (!user) return;
    initial ? setLoading(true) : setRefreshing(true);
    setError(null);
    try {
      // Read in pages so all-time summaries remain accurate beyond the API row limit.
      const all: MessageRow[] = [];
      let offset = 0;
      while (true) {
        const { data, error: fetchError } = await supabase
          .from("messages")
          .select("id, number, message, status, error, retry_count, created_at, sent_at")
          .order("created_at", { ascending: false })
          .range(offset, offset + 999);
        if (fetchError) throw fetchError;
        const batch = (data || []) as MessageRow[];
        all.push(...batch);
        if (batch.length < 1000) break;
        offset += batch.length;
      }
      setMessages(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load SMS reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { void fetchMessages(true); }, [fetchMessages]);

  const summaries = useMemo(() => {
    const now = new Date();
    const today = dayStart(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisMonth = monthStart(now);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);
    const nextYear = new Date(now.getFullYear() + 1, 0, 1);
    const summarize = (rows: MessageRow[]) => ({
      total: rows.length,
      sent: rows.filter((row) => row.status === "sent").length,
      failed: rows.filter((row) => row.status === "failed").length,
      pending: rows.filter((row) => row.status === "pending" || row.status === "processing").length,
    });
    return {
      today: summarize(messages.filter((row) => within(row.created_at, today, tomorrow))),
      month: summarize(messages.filter((row) => within(row.created_at, thisMonth, nextMonth))),
      year: summarize(messages.filter((row) => within(row.created_at, thisYear, nextYear))),
      total: summarize(messages),
    };
  }, [messages]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59.999`) : null;
    return messages.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      const created = new Date(row.created_at);
      if (start && created < start) return false;
      if (end && created > end) return false;
      if (normalized && !row.number.toLowerCase().includes(normalized) && !row.message.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [messages, query, status, from, to]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-green-700"><BarChart3 size={19} /><span className="text-xs font-bold uppercase tracking-wider">Analytics</span></div>
          <h1 className="text-2xl font-bold text-gray-900">SMS reports</h1>
        </div>
        <button onClick={() => void fetchMessages(false)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-gray-500"><RefreshCw size={18} className="mr-2 animate-spin" />Loading reports…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Today" {...summaries.today} icon={Send} tone="bg-blue-50 text-blue-700" />
            <MetricCard title={format(new Date(), "MMMM yyyy")} {...summaries.month} icon={BarChart3} tone="bg-violet-50 text-violet-700" />
            <MetricCard title={`${new Date().getFullYear()} Year`} {...summaries.year} icon={Clock3} tone="bg-amber-50 text-amber-700" />
            <MetricCard title="All time" {...summaries.total} icon={CheckCircle2} tone="bg-green-50 text-green-700" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 md:p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div><h2 className="text-lg font-bold text-gray-900">Message details</h2><p className="text-sm text-gray-500">Search recipients or message text and narrow by date or delivery status.</p></div>
                <span className="text-sm text-gray-500">{filtered.length.toLocaleString()} results</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input aria-label="Search recipient or message" value={query} onChange={(e) => { setPage(0); setQuery(e.target.value); }} placeholder="Search number or text" className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" /></label>
                <select aria-label="Filter by status" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"><option value="all">All statuses</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="pending">Pending</option><option value="processing">Processing</option></select>
                <input aria-label="From date" type="date" value={from} max={to || undefined} onChange={(e) => { setPage(0); setFrom(e.target.value); }} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500" />
                <input aria-label="To date" type="date" value={to} min={from || undefined} onChange={(e) => { setPage(0); setTo(e.target.value); }} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500" />
              </div>
            </div>
            {pageRows.length === 0 ? (
              <div className="p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Send size={20} /></div><h3 className="mt-3 font-semibold text-gray-900">No messages found</h3><p className="mt-1 text-sm text-gray-500">Try changing the filters or send a message to get started.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-semibold">Recipient</th><th className="px-5 py-3 font-semibold">Message</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Attempts</th><th className="px-5 py-3 font-semibold">Created</th><th className="px-5 py-3 font-semibold">Sent</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRows.map((row) => <tr key={row.id} className="align-top hover:bg-gray-50/70">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-gray-800">{row.number}</td>
                      <td className="max-w-sm px-5 py-4"><p className="line-clamp-2 text-gray-700" title={row.message}>{row.message}</p>{row.error && <p className="mt-1 line-clamp-2 text-xs text-red-600" title={row.error}>{row.error}</p>}</td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === "sent" ? "bg-green-50 text-green-700" : row.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{row.status === "sent" ? <CheckCircle2 size={13} /> : row.status === "failed" ? <AlertCircle size={13} /> : <Clock3 size={13} />}{statusLabel[row.status]}</span></td>
                      <td className="px-5 py-4 text-gray-600">{(row.retry_count ?? 0) + 1}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">{format(new Date(row.created_at), "MMM d, yyyy · HH:mm")}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">{row.sent_at ? format(new Date(row.sent_at), "MMM d, yyyy · HH:mm") : "—"}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">
              <p className="text-xs text-gray-500">{filtered.length ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}` : "No results"}</p>
              <div className="flex items-center gap-2"><button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40">Previous</button><span className="text-xs text-gray-500">Page {page + 1} of {pageCount}</span><button onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={page >= pageCount - 1} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40">Next</button></div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
