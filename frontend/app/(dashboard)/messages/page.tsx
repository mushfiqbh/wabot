"use client";

import { useState } from "react";
import { useWhatsApp } from "../../../lib/whatsapp-context";
import axios from "axios";
import {
  Send,
  Phone,
  MessageSquare,
  Terminal,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function MessageTestingPage() {
  const { status, apiKey } = useWhatsApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<
    { time: string; msg: string; type: "info" | "error" | "success" }[]
  >([]);

  const addLog = (msg: string, type: "info" | "error" | "success" = "info") => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev,
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey)
      return addLog(
        "API Key not found. Please check your developer settings.",
        "error",
      );
    if (status !== "Connected")
      return addLog(
        "WhatsApp is not connected. Scan the QR code on the dashboard.",
        "error",
      );

    setLoading(true);
    addLog(`Attempting to send message to ${phoneNumber}...`);

    try {
      await axios.post(
        `${API_BASE}/send`,
        [{ numbers: phoneNumber, message }],
        {
          headers: { "x-api-key": apiKey },
        },
      );
      addLog("Message sent successfully!", "success");
      setMessage("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message.";
      addLog(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Message Testing</h2>
          <p className="text-gray-500">
            Test your WhatsApp bot by sending manual messages.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          {status !== "Connected" && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex items-start space-x-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <p className="text-sm text-amber-700">
                You must be connected to send messages. Go to the Dashboard to
                scan your QR code.
              </p>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recipient Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. 5511999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message Body
              </label>
              <div className="relative">
                <MessageSquare
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <textarea
                  required
                  rows={4}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Hello from the WhatsApp Admin Panel!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || status !== "Connected"}
              className="w-full flex justify-center items-center py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <RefreshCw className="animate-spin mr-2" size={20} />
              ) : (
                <Send className="mr-2" size={20} />
              )}
              Send Test Message
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Terminal className="mr-2 text-gray-500" size={20} />
          Interaction Logs
        </h3>

        <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 h-125 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs font-mono text-gray-500">
              output-v1.log
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
            {logs.length === 0 ? (
              <p className="text-gray-600 italic">
                No activity yet. Send a message to see logs.
              </p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-l-2 pl-3",
                    log.type === "error"
                      ? "border-red-500 text-red-400"
                      : log.type === "success"
                        ? "border-green-500 text-green-400"
                        : "border-blue-500 text-blue-400",
                  )}
                >
                  <span className="text-gray-500 mr-2">[{log.time}]</span>
                  {log.msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
