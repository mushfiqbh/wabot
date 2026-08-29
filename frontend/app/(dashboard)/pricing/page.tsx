"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (data) setPackages(data);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading plans...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Choose the plan that&apos;s right for your business.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900">{pkg.name}</h3>
              <p className="mt-4 text-gray-500">{pkg.description}</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">{pkg.price === 0 ? 'Free' : `${pkg.price} Tk`}</span>
                {pkg.price > 0 && (
                  <span className="text-base font-medium text-gray-500">
                    {pkg.duration_days >= 365 ? ' / year' : ' / month'}
                  </span>
                )}
              </p>
              <Link
                href={`/checkout/${pkg.id}`}
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-lg text-center font-bold text-white shadow-sm transition-colors ${
                  pkg.price === 0 ? 'bg-gray-800 hover:bg-gray-900' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {pkg.price === 0 ? 'Start Free Trial' : 'Get Started'}
              </Link>
            </div>
            <div className="flex-1 flex flex-col justify-between p-8 bg-gray-50">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="shrink-0 h-6 w-6 text-green-500" />
                  <span className="ml-3 text-base text-gray-700">WhatsApp API Access</span>
                </li>
                <li className="flex items-start">
                  <Check className="shrink-0 h-6 w-6 text-green-500" />
                  <span className="ml-3 text-base text-gray-700">
                    {pkg.duration_days} Days Validity
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="shrink-0 h-6 w-6 text-green-500" />
                  <span className="ml-3 text-base text-gray-700">24/7 Priority Support</span>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}