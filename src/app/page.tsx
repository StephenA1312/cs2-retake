"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

// Tabler icons as components
const IconCopy = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconCheck = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12l5 5l10 -10" />
  </svg>
);

const IconZap = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);

const IconTarget = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconTrophy = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconGlobe = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const IconUsers = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBrandDiscord = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconCrown = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const SERVER_IP = "play.cs2retakes.com";
const DISCORD_URL = "https://discord.gg/ejBw3fXHZe";

export default function Home() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      {/* Toast notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-none font-heading text-sm font-medium flex items-center gap-2">
          <IconCheck className="size-4" />
          Copied!
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 transition-colors duration-300 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-heading text-sm font-bold tracking-wider">
            <span className="text-primary">Retake</span>Base
          </a>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#vip" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">VIP</a>
            <a href="#server" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Server</a>
            {session ? (
              <a href="/dashboard" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                {session.user?.name ?? "Dashboard"}
              </a>
            ) : (
              <a href="/signin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
            )}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/80 transition-colors"
            >
              <IconBrandDiscord className="size-4" />
              Join Discord
            </a>
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden inline-flex items-center justify-center size-10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 bg-background border-b border-border sm:hidden">
          <nav className="flex flex-col px-4 py-4 gap-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">Features</a>
            <a href="#vip" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">VIP</a>
            <a href="#server" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">Server</a>
            {session ? (
              <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                {session.user?.name ?? "Dashboard"}
              </a>
            ) : (
              <a href="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">Sign In</a>
            )}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/80 transition-colors mt-1"
            >
              <IconBrandDiscord className="size-4" />
              Join Discord
            </a>
          </nav>
        </div>
      )}

      <main id="main">
        {/* Hero Section */}
        <section className="pt-24 pb-12 sm:pt-28 sm:pb-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent animate-gradient" />
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-none mb-6 animate-float">
              <span className="size-2 bg-primary rounded-full animate-pulse" />
              <span className="font-heading text-xs font-medium text-primary">SERVER ONLINE</span>
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
              <span className="text-primary">Retake</span>Base
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-sm sm:text-base">
              The Fastest CS2 Retakes Server – Low Ping, Zero Lag
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 bg-card hover:bg-muted border border-border text-foreground px-6 py-3 text-sm font-medium transition-colors w-full sm:w-auto justify-center font-heading"
                aria-label={`Copy server IP ${SERVER_IP}`}
              >
                {copied ? <IconCheck className="size-4 text-primary" /> : <IconCopy className="size-4" />}
                <span className="text-muted-foreground">{copied ? "Copied" : "connect"}</span>
                <span className="text-foreground">{SERVER_IP}</span>
              </button>
              <a
                href="#vip"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/80 transition-colors w-full sm:w-auto"
              >
                Get VIP – $3/month
              </a>
            </div>
            {/* Server stats strip */}
            <div className="mt-8 mx-auto max-w-xl grid grid-cols-3 border border-border bg-card/50 divide-x divide-border">
              <div className="flex flex-col items-center py-3">
                <span className="font-heading text-lg sm:text-xl font-bold tabular-nums">64<span className="text-muted-foreground">-tick</span></span>
                <span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Tickrate</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="font-heading text-lg sm:text-xl font-bold tabular-nums">10v10</span>
                <span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Format</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="font-heading text-lg sm:text-xl font-bold tabular-nums">Dallas</span>
                <span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Region</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Play Here Section */}
        <section id="features" ref={(el) => { sectionRefs.current[0] = el; }} className="py-8 sm:py-10 bg-muted/30 scroll-reveal">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                Why Play Here?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Feature 1 — primary */}
              <div className="relative flex flex-col gap-4 p-6 bg-card border border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground font-heading text-[9px] uppercase tracking-wider px-2 py-0.5">Core</span>
                <div className="size-10 bg-primary flex items-center justify-center text-primary-foreground">
                  <IconZap className="size-5" />
                </div>
                <h3 className="font-heading text-sm font-bold">Instant Respawn</h3>
                <p className="text-xs text-muted-foreground">No waiting around. Get back into the action immediately after each round.</p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col gap-4 p-6 bg-card border border-border hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="size-10 bg-primary/10 flex items-center justify-center text-primary">
                  <IconTarget className="size-5" />
                </div>
                <h3 className="font-heading text-sm font-bold">64-tick</h3>
                <p className="text-xs text-muted-foreground">Smooth, responsive gameplay with consistent tick rate for precise shots.</p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col gap-4 p-6 bg-card border border-border hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="size-10 bg-primary/10 flex items-center justify-center text-primary">
                  <IconTrophy className="size-5" />
                </div>
                <h3 className="font-heading text-sm font-bold">XP & Ranks</h3>
                <p className="text-xs text-muted-foreground">Level up and compete on the leaderboards. Every retake counts.</p>
              </div>
              {/* Feature 4 */}
              <div className="flex flex-col gap-4 p-6 bg-card border border-border hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="size-10 bg-primary/10 flex items-center justify-center text-primary">
                  <IconGlobe className="size-5" />
                </div>
                <h3 className="font-heading text-sm font-bold">US Low Ping</h3>
                <p className="text-xs text-muted-foreground">Optimized servers for US, European and African players with minimal latency.</p>
              </div>
            </div>
          </div>
        </section>

        {/* VIP Section */}
        <section id="vip" ref={(el) => { sectionRefs.current[1] = el; }} className="py-8 sm:py-10 scroll-reveal">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                VIP Membership
              </h2>
              <p className="mt-3 text-muted-foreground text-sm">Enhance your gameplay with exclusive perks</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* Free */}
              <div className="flex flex-col gap-4 overflow-hidden bg-card border border-border py-6 px-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconGlobe className="size-5 text-muted-foreground" />
                  <span className="font-heading text-base font-bold">Free</span>
                </div>
                <div>
                  <span className="font-heading text-3xl font-bold">$0</span>
                  <span className="text-sm text-muted-foreground ml-1">forever</span>
                </div>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Access to all retake servers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>XP & rank progression</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Public leaderboards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Standard queue</span>
                  </li>
                </ul>
                <a
                  href="#server"
                  className="inline-flex items-center justify-center gap-2 bg-muted border border-border text-foreground px-4 py-2 text-sm font-medium hover:bg-muted/80 transition-colors mt-auto"
                >
                  Play for Free →
                </a>
              </div>
              {/* Monthly VIP */}
              <div className="flex flex-col gap-4 overflow-hidden bg-card border-2 border-primary/50 py-6 px-6 hover-glow hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconCrown className="size-5 text-primary" />
                  <span className="font-heading text-base font-bold">VIP Monthly</span>
                </div>
                <div>
                  <span className="font-heading text-3xl font-bold">$3</span>
                  <span className="text-sm text-muted-foreground ml-1">/month</span>
                </div>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Priority queue access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>+30% XP boost</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Full !ws skin access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>VIP chat tag</span>
                  </li>
                </ul>
                <a
                  href={session ? "/buy?tier=monthly" : "/signin?redirect=/buy?tier=monthly"}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80 transition-colors mt-auto"
                >
                  {session ? "Get VIP – $3/month" : "Buy Now"}
                </a>
              </div>
              {/* Lifetime VIP */}
              <div className="flex flex-col gap-4 overflow-hidden bg-card border border-border py-6 px-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconCrown className="size-5 text-primary" />
                  <span className="font-heading text-base font-bold">VIP Lifetime</span>
                </div>
                <div>
                  <span className="font-heading text-3xl font-bold">$15</span>
                  <span className="text-sm text-muted-foreground ml-1">once</span>
                </div>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Everything in Monthly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Permanent access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Lifetime priority queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-3 text-primary shrink-0" />
                    <span>Exclusive lifetime tag</span>
                  </li>
                </ul>
                <a
                  href={session ? "/buy?tier=lifetime" : "/signin?redirect=/buy?tier=lifetime"}
                  className="inline-flex items-center justify-center gap-2 bg-card hover:bg-muted border border-border text-foreground px-4 py-2 text-sm font-medium hover:border-primary/50 transition-colors mt-auto"
                >
                  {session ? "Get VIP – $15 lifetime" : "Buy Now"}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Server Info Section */}
        <section id="server" ref={(el) => { sectionRefs.current[2] = el; }} className="py-8 sm:py-10 bg-muted/30 scroll-reveal">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                Server Info
              </h2>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Prominent IP copy card */}
              <button
                onClick={copyToClipboard}
                className="w-full flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 p-5 bg-card border border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors text-left group"
                aria-label={`Copy server IP ${SERVER_IP}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-[10px] text-muted-foreground uppercase tracking-wider">Server Address</span>
                  <span className="font-heading text-lg sm:text-xl font-bold text-primary">{SERVER_IP}</span>
                </div>
                <span className="inline-flex items-center gap-2 bg-muted group-hover:bg-primary group-hover:text-primary-foreground border border-border group-hover:border-primary px-4 py-2 text-xs font-medium font-heading transition-colors">
                  {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
              {/* 4-stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1 p-4 bg-card border border-border text-center">
                  <span className="font-heading text-[10px] text-muted-foreground uppercase tracking-wider">Location</span>
                  <span className="font-heading text-sm font-bold">Dallas, TX</span>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-card border border-border text-center">
                  <span className="font-heading text-[10px] text-muted-foreground uppercase tracking-wider">Tickrate</span>
                  <span className="font-heading text-sm font-bold">64-tick</span>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-card border border-border text-center">
                  <span className="font-heading text-[10px] text-muted-foreground uppercase tracking-wider">Players</span>
                  <span className="font-heading text-sm font-bold">10v10</span>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-card border border-border text-center">
                  <span className="font-heading text-[10px] text-muted-foreground uppercase tracking-wider">Mode</span>
                  <span className="font-heading text-sm font-bold">Retake</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discord CTA Section */}
        <section ref={(el) => { sectionRefs.current[3] = el; }} className="py-8 sm:py-10 scroll-reveal">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <div className="size-16 bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
              <IconUsers className="size-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Join the Community
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground text-sm">
              Connect with other players, find teammates, report bugs, and stay updated on server news.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#5865F2] text-white px-6 py-3 text-sm font-medium hover:bg-[#4752C4] transition-colors mt-8"
            >
              <IconBrandDiscord className="size-5" />
              Join our Discord
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="font-heading text-sm font-bold tracking-wider">
              <span className="text-primary">RET</span>AKES
            </span>
            <div className="flex items-center gap-6">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Discord</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 RetakeBase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
