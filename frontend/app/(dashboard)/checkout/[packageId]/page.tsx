"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../lib/auth-context";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
}

export default function CheckoutPage() {
  const { packageId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackage() {
      if (!packageId) return;
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      
      if (data) setPkg(data);
      setLoading(false);
    }
    fetchPackage();
  }, [packageId]);

  const handleCheckout = async () => {
    if (!user || !pkg) return;
    setProcessing(true);
    setError(null);

    try {
      // If it's a paid package, use bKash
      if (pkg.price > 0) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/bkash/make-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: pkg.price,
            reference: pkg.id,
            name: user.email?.split('@')[0] || 'User',
            email: user.email,
            phone: '', // Can be collected from a form if needed
          }),
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url; // Redirect to bKash
          return;
        } else {
          throw new Error(data.message || "Failed to initiate bKash payment");
        }
      }

      // 1. Get client_id
      const { data: client, error: clientError } = await supabase
        .from('wa_clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError || !client) throw new Error("Client not found");

      // 1.5 Deactivate existing subscriptions
      const { error: deactivateError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('client_id', client.id)
        .eq('status', 'active');

      if (deactivateError) throw deactivateError;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + pkg.duration_days);

      // 2. Create subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          client_id: client.id,
          package_id: pkg.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        });

      if (subError) throw subError;

      // 3. Record in ledger
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          client_id: client.id,
          amount: -pkg.price,
          type: 'subscription_payment',
          description: `Purchase of ${pkg.name}`
        });

      if (ledgerError) throw ledgerError;

      // Redirect to "My Package" page
      router.push('/package');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process checkout");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Loading checkout...</div>;
  if (!pkg) return <div className="p-8 text-center text-red-500 font-bold">Package not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/pricing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Pricing
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <p className="text-gray-500">Review your order and complete the purchase.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h4 className="font-bold text-gray-900">{pkg.name}</h4>
              <p className="text-sm text-gray-500">{pkg.description}</p>
              <p className="text-xs text-gray-400 mt-1">{pkg.duration_days} days validity</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900">{pkg.price === 0 ? 'Free' : `${pkg.price} Tk`}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center">
              <CreditCard size={18} className="mr-2 text-green-600" />
              Payment Summary
            </h4>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{pkg.price} Tk</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>0 Tk</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Total</span>
                <span>{pkg.price} Tk</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={processing}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              pkg.price === 0 ? 'Confirm Free Trial' : 'Complete Purchase'
            )}
          </button>

          <div className="flex items-center justify-center text-xs text-gray-400 space-x-4">
            <span className="flex items-center">
              <ShieldCheck size={14} className="mr-1" />
              Secure Payment
            </span>
            <span>Verified by SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}