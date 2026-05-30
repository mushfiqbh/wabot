"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./auth-context";
import { supabase } from "./supabase";

interface Activity {
  id: string;
  client_id: string;
  number: string;
  message: string;
  status: "pending" | "sent" | "failed" | "processing";
  created_at: string;
}

interface WhatsAppContextType {
  status: string;
  qr: string | null;
  apiKey: string | null;
  stats: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
  };
  activity: Activity[];
  refreshStatus: () => Promise<void>;
  rotateApiKey: () => Promise<void>;
  loading: boolean;
}

const WhatsAppContext = createContext<WhatsAppContextType>({
  status: "Disconnected",
  qr: null,
  apiKey: null,
  stats: { total: 0, sent: 0, pending: 0, failed: 0 },
  activity: [],
  refreshStatus: async () => {},
  rotateApiKey: async () => {},
  loading: true,
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const WhatsAppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState("Disconnected");
  const [qr, setQr] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0, failed: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatsAndActivity = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch stats
      const { data: messages } = await supabase
        .from("wa_messages")
        .select("status");
      
      if (messages) {
        const newStats = {
          total: messages.length,
          sent: messages.filter(m => m.status === 'sent').length,
          pending: messages.filter(m => m.status === 'pending' || m.status === 'processing').length,
          failed: messages.filter(m => m.status === 'failed').length,
        };
        setStats(newStats);
      }

      // Fetch recent activity
      const { data: recent } = await supabase
        .from("wa_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (recent) {
        setActivity(recent);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [user]);

  const fetchClientData = useCallback(async (userId: string) => {
    try {
      const { data: client } = await supabase
        .from("wa_clients")
        .select("api_key")
        .eq("user_id", userId)
        .single();
      if (client) {
        setApiKey(client.api_key);
      }
    } catch (err) {
      console.error("Error fetching client data:", err);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!apiKey) return;
    try {
      // First try to check current status
      const res = await axios.get(`${API_BASE}/connect`, {
        headers: { 'x-api-key': apiKey }
      });
      
      setStatus(res.data.connected ? 'Connected' : 'Disconnected');
      setQr(res.data.qr || null);
    } catch (err) {
      console.error("Error refreshing status:", err);
      setStatus("Error");
    }
  }, [apiKey]);

  const rotateApiKey = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("rotate_api_key");
      if (error) throw error;
      if (data) {
        setApiKey(data);
      }
    } catch (err) {
      console.error("Error rotating API key:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = async () => {
      if (user) {
        await fetchClientData(user.id);
        await fetchStatsAndActivity();
        setLoading(false);
      } else {
        setApiKey(null);
        setStatus("Disconnected");
        setQr(null);
        setStats({ total: 0, sent: 0, pending: 0, failed: 0 });
        setActivity([]);
        setLoading(false);
      }
    };

    handleAuthChange();
  }, [user, fetchClientData, fetchStatsAndActivity]);

  useEffect(() => {
    if (apiKey) {
      const initStatus = async () => {
        await refreshStatus();
        await fetchStatsAndActivity();
      };
      
      initStatus();
      const interval = setInterval(async () => {
        await refreshStatus();
        await fetchStatsAndActivity();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [apiKey, refreshStatus, fetchStatsAndActivity]);

  return (
    <WhatsAppContext.Provider value={{ status, qr, apiKey, stats, activity, refreshStatus, rotateApiKey, loading }}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => useContext(WhatsAppContext);
