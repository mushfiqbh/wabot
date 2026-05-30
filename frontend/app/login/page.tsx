"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import axios from "axios";
import { MessageSquare, Mail, Lock, Phone, ArrowRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === "register") {
        const name = email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { phone, full_name: name, display_name: name },
          },
        });
        if (error) throw error;
        
        if (data.user) {
          await axios.post(`${API_BASE}/register`, {
            name: name,
            userId: data.user.id,
            phone,
          });
          alert("Registration successful! Check your email for verification.");
          setAuthMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <MessageSquare className="text-green-600" size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {authMode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {authMode === "login" 
              ? "Access your WhatsApp management console" 
              : "Start building your WhatsApp automation"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {authMode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="tel"
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. 5511999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all font-semibold"
          >
            {loading ? "Processing..." : (
              <>
                {authMode === "login" ? "Sign In" : "Register Now"}
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            {authMode === "login" 
              ? "Don't have an account? Create one" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
