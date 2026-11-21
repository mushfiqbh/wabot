"use client";

import { useAuth } from "../../../lib/auth-context";
import { User, Mail, Phone, Calendar, Key, Shield } from "lucide-react";

export default function AccountPage() {
  const { user } = useAuth();

  const profileItems = [
    { label: 'Full Name', value: user?.user_metadata?.full_name || 'Not provided', icon: User },
    { label: 'Email Address', value: user?.email, icon: Mail },
    { label: 'Phone Number', value: user?.user_metadata?.phone || 'Not provided', icon: Phone },
    { label: 'Member Since', value: new Date(user?.created_at || '').toLocaleDateString(), icon: Calendar },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-500">Manage your profile information and security preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm font-bold text-2xl text-green-700">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user?.user_metadata?.display_name || user?.email}</h3>
              <p className="text-sm text-gray-500">Administrator role</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {profileItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                <item.icon size={14} className="mr-2" />
                {item.label}
              </label>
              <p className="text-gray-900 font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-gray-900">
            <Shield className="text-green-600" />
            <h4 className="font-bold">Security & Login</h4>
          </div>
          <p className="text-sm text-gray-500">Update your password and enable two-factor authentication for better security.</p>
          <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
            Update Password
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-gray-900">
            <Key className="text-blue-600" />
            <h4 className="font-bold">Access Control</h4>
          </div>
          <p className="text-sm text-gray-500">Manage API keys and developer access for your WhatsApp bot integration.</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors">
            Manage Keys
          </button>
        </div>
      </div>
    </div>
  );
}
