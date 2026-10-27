"use client";

import { useState } from "react";
import Link from "next/link";
import { useWhatsApp } from "@/lib/whatsapp-context";
import { QRCodeSVG } from "qrcode.react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Unplug,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { status, qr, stats, activity, refreshStatus, resetConnection } = useWhatsApp();
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Reset connection?\n\nThis will unlink your current WhatsApp device. A new QR code will be generated for you to scan and link again."
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      await resetConnection();
    } catch (err) {
      alert("Failed to reset connection. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const dashboardStats = [
    { label: 'Total Messages', value: stats.total.toLocaleString(), icon: MessageCircle, color: 'bg-blue-500' },
    { label: 'Successfully Sent', value: stats.sent.toLocaleString(), icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Pending / Queued', value: stats.pending.toLocaleString(), icon: Clock, color: 'bg-yellow-500' },
    { label: 'Failed Attempts', value: stats.failed.toLocaleString(), icon: AlertCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-lg text-white", stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Connection Status</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={resetting}
                title="Reset connection and generate a new QR code"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  "text-red-600 hover:bg-red-50 border border-red-200",
                  resetting && "opacity-60 cursor-not-allowed"
                )}
              >
                <Unplug size={16} />
                {resetting ? "Resetting\u2026" : "Reset Connection"}
              </button>
              <button
                onClick={() => refreshStatus()}
                title="Refresh status"
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            {status === 'Connected' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={40} className="text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Your device is connected!</h4>
                <p className="text-gray-500 mt-1">Ready to send and receive messages autonomously.</p>
              </div>
            ) : qr ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl shadow-lg inline-block mb-6">
                  <QRCodeSVG value={qr} size={256} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Scan QR Code</h4>
                <p className="text-gray-500 mt-1">Open WhatsApp on your phone and scan to connect.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="animate-pulse bg-gray-200 w-64 h-64 rounded-xl mb-6"></div>
                <h4 className="text-lg font-semibold text-gray-900">Initializing...</h4>
                <p className="text-gray-500 mt-1">Please wait while we prepare your connection.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            {stats.failed > 0 && (
              <Link
                href="/failures"
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <AlertTriangle size={12} />
                View failures
              </Link>
            )}
          </div>
          <div className="space-y-6">
            {activity.length > 0 ? activity.map((job) => (
              <div key={job.id} className="flex items-start space-x-4">
                <div className={cn(
                  "mt-1.5 w-2 h-2 rounded-full shrink-0",
                  job.status === 'sent' ? 'bg-green-500' :
                  job.status === 'pending' || job.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                )}></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {job.status === 'sent' ? 'Sent to ' : job.status === 'failed' ? 'Failed to ' : 'Queued for '}
                    {job.number}
                  </p>
                  {job.status === 'failed' && (job as any).error && (
                    <p className="text-xs text-red-600 mt-0.5 line-clamp-2 bg-red-50 border border-red-100 rounded px-2 py-1">
                      {(job as any).error}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">&quot;{job.message}&quot;</p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 whitespace-nowrap">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity found.</p>
            )}
          </div>
          <Link
            href="/failures"
            className="w-full mt-8 py-2 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 rounded-lg transition-colors flex items-center justify-center"
          >
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
