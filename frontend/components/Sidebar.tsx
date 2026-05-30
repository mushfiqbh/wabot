"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  MessageSquare, 
  Code2, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { cn } from "../lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Account', href: '/account', icon: User },
  { name: 'Message Testing', href: '/messages', icon: MessageSquare },
  { name: 'Developer API', href: '/api', icon: Code2 },
];

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (v: boolean) => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {(!collapsed || mobileOpen) && <span className="text-xl font-bold bg-linear-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">WA Admin</span>}
        {!mobileOpen && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-800 rounded hidden md:block"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobileOpen && setMobileOpen?.(false)}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg transition-colors group",
                isActive 
                  ? "bg-green-600 text-white" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("min-w-5", isActive ? "text-white" : "group-hover:text-white")} />
              {(!collapsed || mobileOpen) && <span className="ml-3 font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors group",
            (collapsed && !mobileOpen) && "justify-center"
          )}
        >
          <LogOut size={20} />
          {(!collapsed || mobileOpen) && <span className="ml-3 font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex flex-col h-screen bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        {sidebarContent}
      </div>
    </>
  );
}

