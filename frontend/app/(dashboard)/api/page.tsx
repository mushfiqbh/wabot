"use client";

import { useState } from "react";
import { useWhatsApp } from "../../../lib/whatsapp-context";
import { Copy, Check, Eye, EyeOff, Globe, Code, Lock, RefreshCcw } from "lucide-react";

export default function DeveloperApiPage() {
  const { apiKey, rotateApiKey } = useWhatsApp();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotateKey = async () => {
    if (!confirm("Are you sure? Your existing API key will stop working immediately. This action cannot be undone.")) {
      return;
    }

    setRotating(true);
    try {
      await rotateApiKey();
      alert("API key successfully rotated!");
    } catch (err) {
      alert("Failed to rotate API key. Please try again.");
    } finally {
      setRotating(false);
    }
  };

  const apiEndpoints = [
    {
      name: "Send Message",
      method: "POST",
      endpoint: "/send",
      params: ["apiKey", "numbers", "message"],
      description: "Send messages to one or more numbers. Accepts an array of objects where 'numbers' can be a single number or a comma-separated list."
    },
    {
      name: "Connection Status",
      method: "GET",
      endpoint: "/status",
      params: ["apiKey"],
      description: "Check if the bot is currently connected to WhatsApp."
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Developer API</h2>
        <p className="text-gray-500">Integrate WhatsApp automation into your own applications.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Lock className="mr-2 text-gray-400" size={20} />
              Your Secret API Key
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Production Key</span>
          </div>

          <p className="text-sm text-gray-500 max-w-2xl">
            Keep this key secret. Use it to authenticate your requests to the API. 
            Do not share it in client-side code or public repositories.
          </p>

          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm relative group">
              {showKey ? apiKey : "•".repeat(32)}
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={() => apiKey && copyToClipboard(apiKey)}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold flex items-center hover:bg-gray-800 transition-colors"
            >
              {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
              {copied ? "Copied" : "Copy Key"}
            </button>
            <button
              onClick={handleRotateKey}
              disabled={rotating}
              className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold flex items-center hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Rotate API Key"
            >
              <RefreshCcw size={18} className={rotating ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Code className="mr-2 text-green-600" size={20} />
            Quick Implementation
          </h3>
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-2 overflow-x-auto">
            <p className="text-blue-400">{"// JavaScript / Node.js example"}</p>
            <p>{"fetch('https://whatsapp-api-w0jb.onrender.com/send', {"}</p>
            <p className="pl-4">{"method: 'POST',"}</p>
            <p className="pl-4">{"headers: {"}</p>
            <p className="pl-8">{"'Content-Type': 'application/json',"}</p>
            <p className="pl-8 text-yellow-500">{"'x-api-key': 'YOUR_API_KEY'"}</p>
            <p className="pl-4">{"},"}</p>
            <p className="pl-4">{"body: JSON.stringify(["}</p>
            <p className="pl-8">{"{ numbers: '12345678, 87654321', message: 'Hello batch!' },"}</p>
            <p className="pl-8">{"{ numbers: '11223344', message: 'Single recipient' }"}</p>
            <p className="pl-4">{"])"}</p>
            <p>{"});"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Globe className="mr-2 text-blue-600" size={20} />
            Endpoints Reference
          </h3>
          <div className="space-y-3">
            {apiEndpoints.map((api) => (
              <div key={api.endpoint} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">{api.method}</span>
                    <span className="text-sm font-mono font-bold text-gray-800">{api.endpoint}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{api.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
