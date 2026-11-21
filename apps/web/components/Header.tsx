"use client";

import { useWhatsApp } from "../lib/whatsapp-context";
import { useAuth } from "../lib/auth-context";
import { Circle, User as UserIcon, Menu } from "lucide-react";
import { cn } from "../lib/utils";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { status } = useWhatsApp();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500 fill-green-500';
      case 'connecting': return 'text-yellow-500 fill-yellow-500';
      default: return 'text-red-500 fill-red-500';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg md:hidden"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
          WhatsApp Admin Panel
        </h2>
        <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
          <Circle size={10} className={cn("mr-2", getStatusColor(status))} />
          <span className="text-sm font-medium text-gray-600 capitalize">{status}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          <span className="text-xs text-gray-500">Administrator</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
          <UserIcon size={20} className="text-gray-600" />
        </div>
      </div>
    </header>
  );
}

