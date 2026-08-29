"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth-context";
import { 
  Package, 
  Calendar, 
  History, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock
} from "lucide-react";
import Link from "next/link";
import { cn } from "../../../lib/utils";

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  packages: {
    name: string;
    description: string;
  };
}

interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function MyPackagePage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (client) {
          // Fetch current subscription
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, packages(name, description)')
            .eq('client_id', client.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (sub) setSubscription(sub as any);

          // Fetch ledger entries
          const { data: ledgerEntries } = await supabase
            .from('ledger')
            .select('*')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });
          
          if (ledgerEntries) {
            setLedger(ledgerEntries);
            const totalBalance = ledgerEntries.reduce((acc, entry) => acc + Number(entry.amount), 0);
            setBalance(totalBalance);
          }
        }
      } catch (err) {
        console.error("Error fetching package data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Loading your package...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Package</h2>
        <p className="text-gray-500">Manage your subscription and view your account ledger.</p>
      </div>

      {/* Subscription Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {subscription ? subscription.packages.name : 'No Active Plan'}
              </h3>
              <p className="text-sm text-gray-500">
                {subscription ? 'Your current active subscription' : 'You are not currently subscribed to any plan'}
              </p>
            </div>
          </div>
          <Link 
            href="/pricing" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            {subscription ? 'Upgrade Plan' : 'Choose a Plan'}
          </Link>
        </div>

        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Calendar size={18} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Start Date</p>
                  <p className="font-medium">{new Date(subscription.start_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock size={18} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Expiry Date</p>
                  <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start space-x-3">
              <AlertCircle className="text-yellow-600 shrink-0" size={20} />
              <p className="text-sm text-yellow-700">
                Your plan is active. Make sure to renew before the expiry date to avoid service interruption.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Account Balance & Ledger */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <History size={20} className="mr-2 text-blue-600" />
            Billing Ledger
          </h3>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
            Account Balance: <span className={balance < 0 ? "text-red-600" : "text-green-600"}>{balance} Tk</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledger.length > 0 ? (
                ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="capitalize">{entry.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex items-center font-bold text-sm",
                        entry.amount < 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {entry.amount < 0 ? <TrendingDown size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1" />}
                        {Math.abs(entry.amount)} Tk
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}