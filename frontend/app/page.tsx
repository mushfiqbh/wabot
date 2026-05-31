"use client";

import Link from "next/link";
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Layout,
  Smartphone,
  MessageCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-green-500/30 overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 p-2 rounded-lg">
                <MessageSquare className="text-black" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight">BotFlow</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-white transition-colors">
                Log in
              </Link>
              <Link 
                href="/login" 
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
              >
                Get Started
              </Link>
              <button 
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 border-b border-white/10 p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="#features" className="block text-lg font-medium text-gray-400" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-lg font-medium text-gray-400" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#about" className="block text-lg font-medium text-gray-400" onClick={() => setIsMenuOpen(false)}>About</a>
            <Link href="/login" className="block text-lg font-medium text-green-500" onClick={() => setIsMenuOpen(false)}>Log in</Link>
          </div>
        )}
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-green-400 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Next-Gen WhatsApp Automation
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Scale your reach <br className="hidden md:block" />
            with <span className="text-green-500">Precision.</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The most advanced WhatsApp bot template. Built for developers who want to ship faster, scale harder, and keep their engagement high.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-green-900/40 flex items-center justify-center gap-2 group"
            >
              Start Automating
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          {/* Feature Grid */}
          <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-green-500/50 transition-all group">
              <div className="bg-green-500/10 p-3 rounded-2xl w-fit mb-6 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Deployment</h3>
              <p className="text-gray-400 leading-relaxed">Connect your WhatsApp account in seconds with our QR code authentication system. No complex API approvals needed.</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-green-500/50 transition-all group text-left">
              <div className="bg-blue-500/10 p-3 rounded-2xl w-fit mb-6 text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
              <p className="text-gray-400 leading-relaxed">Multi-session management with secure Supabase storage. Your tokens and chats are protected with industry-standard encryption.</p>
            </div>

            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-green-500/50 transition-all group text-left">
              <div className="bg-purple-500/10 p-3 rounded-2xl w-fit mb-6 text-purple-500 group-hover:bg-purple-500 group-hover:text-black transition-colors">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Powerful Analytics</h3>
              <p className="text-gray-400 leading-relaxed">Track message delivery, response rates, and bot performance with our built-in real-time dashboard analytics.</p>
            </div>
          </div>
        </section>

        {/* Messaging Preview Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/10 rounded-[40px] p-8 md:p-16 overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Conversation is the new conversion.</h2>
                <p className="text-gray-400 text-lg mb-8">Stop sending static emails that get ignored. Reach your users where they are—on WhatsApp. With 98% open rates, you can't afford to miss out.</p>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <span>Automated replies with AI integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <span>Broadcast lists and bulk messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <span>Webhook support for custom logic</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-4 rotate-3 transform hidden md:block">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500" />
                    <div className="font-bold text-sm">Customer Support</div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3 rounded-xl rounded-tl-none w-3/4 text-sm italic text-gray-400">Hello! How can we help you today?</div>
                    <div className="bg-green-600 p-3 rounded-xl rounded-tr-none ml-auto w-3/4 text-sm font-medium">I need to upgrade my plan.</div>
                    <div className="bg-white/5 p-3 rounded-xl rounded-tl-none w-3/4 text-sm">Sure! I've sent you a secure link to manage your subscription.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-4">Simple, fair pricing.</h2>
            <p className="text-gray-400 text-lg">Start for free, upgrade when you need to scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-white/20 transition-all flex flex-col">
              <div className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">Starter</div>
              <div className="text-5xl font-black mb-8">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 text-gray-400 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> 1 WhatsApp Session</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> 100 Messages/day</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Basic Webhooks</li>
                <li className="flex items-center gap-3 text-gray-600"><X size={18} /> API Access</li>
              </ul>
              <button className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all font-bold">Try Free</button>
            </div>

            {/* Pro */}
            <div className="bg-white/5 border-2 border-green-500 p-10 rounded-[40px] relative overflow-hidden transform md:-translate-y-4 flex flex-col shadow-2xl shadow-green-900/10">
              <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-tighter">Recommended</div>
              <div className="text-green-400 font-bold mb-4 uppercase tracking-widest text-xs">Professional</div>
              <div className="text-5xl font-black mb-8">$49<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 text-gray-300 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> 5 WhatsApp Sessions</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Unlimited Messages</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Advanced Analytics</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> API Access</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Priority Support</li>
              </ul>
              <button className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 transition-all font-bold shadow-lg shadow-green-900/20">Go Pro</button>
            </div>

            {/* Enterprise */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-white/20 transition-all flex flex-col">
              <div className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">Enterprise</div>
              <div className="text-5xl font-black mb-8">$149<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 text-gray-400 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Unlimited Sessions</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Dedicated Account Manager</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Custom SLA</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /> Team Collaboration</li>
              </ul>
              <button className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all font-bold">Talk to Sales</button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="bg-green-600 rounded-[50px] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to grow your bot?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-xl hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  Create Your Account
                </Link>
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-10 py-5 bg-black/20 hover:bg-black/30 text-white rounded-full font-black text-xl transition-all border border-white/20"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-gray-400">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-green-500 p-2 rounded-lg text-black">
                  <MessageSquare size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">BotFlow</span>
              </div>
              <p className="max-w-xs mb-8">Building the future of WhatsApp automation, one conversation at a time.</p>
              <div className="flex gap-4">
                {/* <Twitter size={20} className="hover:text-white cursor-pointer" />
                <Github size={20} className="hover:text-white cursor-pointer" /> */}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Legal</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-gray-500 text-xs">
            © 2026 BotFlow Inc. All rights reserved. Built with ❤️ for the world.
          </div>
        </footer>
      </main>
    </div>
  );
}
