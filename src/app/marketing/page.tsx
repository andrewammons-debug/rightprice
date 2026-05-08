"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutGrid,
  Sparkles,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  DollarSign,
  Camera,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Zap,
  Upload,
  Car,
  Share2,
  RefreshCw,
  Filter,
  Megaphone,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaCar, FaYoutube, FaTag } from "react-icons/fa";
import { SiEbay } from "react-icons/si";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "inventory" | "creator" | "campaigns" | "analytics";
type CopyTab = "social" | "listing" | "craigslist" | "youtube";

type Vehicle = {
  id: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  body: string;
  miles: string;
  color: string;
  transmission: string;
  price: number;
  remarks: string;
  inspection_date: string;
  created_at: string;
  photo_urls: string[] | null;
  paid_status: string;
  website_copy?: string;
};

type MarketingPost = {
  id: string;
  vin: string;
  platform: string;
  status: string;
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "facebook",  short: "FB",  name: "Facebook",    color: "#1877F2", icon: FaFacebook },
  { id: "instagram", short: "IG",  name: "Instagram",   color: "#E1306C", icon: FaInstagram },
  { id: "craigslist",short: "CL",  name: "Craigslist",  color: "#8b5cf6", icon: FaTag },
  { id: "cargurus",  short: "CG",  name: "CarGurus",    color: "#7B2CBF", icon: FaCar },
  { id: "ebay",      short: "EB",  name: "eBay Motors", color: "#E53238", icon: SiEbay },
  { id: "carscom",   short: "CC",  name: "Cars.com",    color: "#D6242C", icon: FaCar },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

const COPY_TABS: { id: CopyTab; label: string; sub: string }[] = [
  { id: "social",    label: "Social Post",  sub: "FB · IG" },
  { id: "listing",   label: "Full Listing", sub: "Marketplace" },
  { id: "craigslist",label: "Craigslist",   sub: "Plain text" },
  { id: "youtube",   label: "YouTube",      sub: "Walkaround script" },
];

// Design tokens — used as inline styles for off-palette values
const T = {
  bg:      "#0a1020",
  surface: "#131c34",
  surf2:   "#1a2440",
  surf3:   "#232e4d",
  border:  "rgba(148,163,184,.12)",
  border2: "rgba(148,163,184,.20)",
  crimson: "#720009",
  crimson2:"#9d0011",
  text:    "#e6ecf6",
  muted:   "#94a3b8",
  dim:     "#64748b",
  faint:   "#475569",
  emerald: "#10b981",
  amber:   "#f59e0b",
  rose:    "#ef4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysOnLot(inspectionDate: string): number {
  const d = new Date(inspectionDate);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function dolColor(days: number): string {
  if (days > 30) return T.rose;
  if (days > 14) return T.amber;
  return T.muted;
}

function fmtMiles(m: string | number): string {
  const n = typeof m === "string" ? parseFloat(m.replace(/[^0-9.]/g, "")) : m;
  if (isNaN(n)) return "—";
  return n.toLocaleString() + " mi";
}

function fmtPrice(p: number): string {
  if (!p) return "—";
  return "$" + p.toLocaleString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Dot = ({
  color = T.emerald,
  pulse = false,
  size = 6,
}: {
  color?: string;
  pulse?: boolean;
  size?: number;
}) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
      animation: pulse ? "pulse 1.5s infinite" : undefined,
    }}
  />
);

const Pill = ({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: string;
}) => {
  const map: Record<string, string> = {
    slate:   "rgba(148,163,184,.12)",
    emerald: "rgba(16,185,129,.15)",
    amber:   "rgba(245,158,11,.15)",
    crimson: "rgba(114,0,9,.20)",
    blue:    "rgba(59,130,246,.15)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 2,
        background: map[color] ?? map.slate,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: T.text,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  section,
  setSection,
  collapsed,
  setCollapsed,
}: {
  section: Section;
  setSection: (s: Section) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const items: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "inventory",  label: "Inventory Board", icon: LayoutGrid,  badge: undefined },
    { id: "creator",    label: "Ad Creator",      icon: Sparkles },
    { id: "campaigns",  label: "Campaigns",       icon: BarChart3 },
    { id: "analytics",  label: "Analytics",       icon: TrendingUp },
  ];

  return (
    <nav className="glass-panel"
      style={{
        width: collapsed ? 64 : 220,
        minHeight: "100vh",
        /* background handled by glass-panel */
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: T.crimson,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Megaphone size={16} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: T.text, lineHeight: 1, letterSpacing: "0.04em", textTransform: "uppercase", fontStyle: "italic" }}>
              Marketing
            </div>
            <div style={{ fontSize: 9, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Hub v4.0
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ padding: "12px 8px", flex: 1 }}>
        {!collapsed && (
          <div style={{ fontSize: 8, fontWeight: 800, color: T.faint, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px 8px" }}>
            WORKSPACES
          </div>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: collapsed ? "10px 0" : "10px 12px",
                borderRadius: 2,
                border: "none",
                cursor: "pointer",
                background: active ? `${T.crimson}22` : "transparent",
                color: active ? T.text : T.dim,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                transition: "all 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative",
                marginBottom: 2,
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    background: T.crimson,
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <Icon size={16} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: T.crimson,
                    color: "white",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 2,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: collapsed ? "8px 0" : "8px 12px",
            border: "none",
            background: "transparent",
            color: T.dim,
            cursor: "pointer",
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </nav>
  );
}

// ─── Inventory Board ──────────────────────────────────────────────────────────

type InventoryFilter = "all" | "unposted" | "attention";

function InventoryBoard({
  vehicles,
  posts,
  onSelect,
}: {
  vehicles: Vehicle[];
  posts: MarketingPost[];
  onSelect: (v: Vehicle) => void;
}) {
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Vehicle[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Map vin → set of live platforms
  const livePlatforms = React.useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const p of posts) {
      if (p.status === "published") {
        if (!map[p.vin]) map[p.vin] = new Set();
        map[p.vin].add(p.platform);
      }
    }
    return map;
  }, [posts]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 1) {
        performSearch();
      } else {
        setSearchResults(null);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/inspection?search=${query}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const baseVehicles = searchResults !== null ? searchResults : vehicles;

  const filtered = baseVehicles.filter((v) => {
    const days = daysOnLot(v.inspection_date || v.created_at);
    if (filter === "unposted" && livePlatforms[v.vin]?.size > 0) return false;
    if (filter === "attention" && days < 14) return false;
    if (searchResults === null && query) {
      const q = query.toLowerCase();
      if (
        !v.vin?.toLowerCase().includes(q) &&
        !v.make?.toLowerCase().includes(q) &&
        !v.model?.toLowerCase().includes(q) &&
        !v.year?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const unpostedCount = baseVehicles.filter((v) => !livePlatforms[v.vin]?.size).length;
  const attentionCount = baseVehicles.filter((v) => daysOnLot(v.inspection_date || v.created_at) > 14).length;

  return (
    <section style={{ flex: 1 }}>
      {/* Header */}
      <header
        style={{
          padding: "32px 40px 24px",
          borderBottom: `4px solid ${T.crimson}`,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.crimson, letterSpacing: "0.14em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Megaphone size={10} /> INVENTORY · MARKETING BOARD
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontStyle: "italic",
              color: T.text,
              lineHeight: 1,
              margin: 0,
            }}
          >
            INVENTORY BOARD
          </h1>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.12em", margin: "6px 0 0" }}>
            {baseVehicles.length} vehicles · {unpostedCount} unposted · {attentionCount} need attention
          </p>
        </div>
        {/* Search */}
        <div style={{ position: "relative", width: "min(340px, 100%)" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.dim }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Master Database..."
            style={{
              width: "100%",
              background: T.surf3,
              border: `1px solid ${T.border2}`,
              borderRadius: 2,
              padding: "10px 36px 10px 36px",
              color: T.text,
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
            }}
          />
          {isSearching && (
            <Loader2 size={14} className="animate-spin" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.dim }} />
          )}
        </div>
      </header>

      {/* Filters */}
      <div style={{ padding: "16px 40px", display: "flex", gap: 8, borderBottom: `1px solid ${T.border}` }}>
        {([
          { id: "all",       label: "All Vehicles" },
          { id: "unposted",  label: "Unposted" },
          { id: "attention", label: "Needs Attention (14+ days)" },
        ] as { id: InventoryFilter; label: string }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 2,
              border: `1px solid ${filter === f.id ? T.crimson : T.border2}`,
              background: filter === f.id ? `${T.crimson}22` : "transparent",
              color: filter === f.id ? T.text : T.dim,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ padding: "24px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: T.dim }}>
            <Car size={40} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              No vehicles match this filter
            </div>
          </div>
        ) : (
          filtered.map((v) => {
            const days = daysOnLot(v.inspection_date || v.created_at);
            const live = livePlatforms[v.vin] ?? new Set<string>();
            const thumb = v.photo_urls?.[0];
            return (
              <button
                key={v.id}
                onClick={() => onSelect(v)}
                className="elevated-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto auto auto",
                  alignItems: "center",
                  gap: 20,
                  padding: "16px 20px",
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.surf2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.surface)}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 64,
                    height: 44,
                    background: T.surf3,
                    borderRadius: 2,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {thumb ? (
                    <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Car size={20} color={T.faint} />
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: T.text, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                    {v.year} {v.make} <span style={{ color: T.muted, fontStyle: "normal" }}>{v.model}</span>
                  </div>
                  <div style={{ fontSize: 9, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3, display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: "monospace" }}>VIN ···{v.vin?.slice(-6)}</span>
                    <span>·</span>
                    <span>{fmtMiles(v.miles)}</span>
                    {v.color && <><span>·</span><span>{v.color}</span></>}
                  </div>
                </div>

                {/* Platform Grid */}
                <div style={{ display: "flex", gap: 4 }}>
                  {PLATFORMS.map((p) => {
                    const isLive = live.has(p.id);
                    return (
                      <div
                        key={p.id}
                        title={`${p.name} — ${isLive ? "Live" : "Not posted"}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                          padding: "4px 6px",
                          borderRadius: 2,
                          background: isLive ? `${p.color}18` : `${T.surf3}`,
                          border: `1px solid ${isLive ? p.color + "40" : T.border}`,
                        }}
                      >
                        <span style={{ fontSize: 8, fontWeight: 800, color: isLive ? p.color : T.faint, letterSpacing: "0.04em" }}>
                          {p.short}
                        </span>
                        <Dot color={isLive ? p.color : T.faint} pulse={isLive} size={5} />
                      </div>
                    );
                  })}
                </div>

                {/* Days on Lot */}
                <div style={{ textAlign: "center", minWidth: 52 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: dolColor(days), lineHeight: 1 }}>
                    {days}<span style={{ fontSize: 10 }}>d</span>
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>on lot</div>
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: T.text, fontStyle: "italic" }}>
                    {fmtPrice(v.price)}
                  </div>
                  <div style={{ marginTop: 4, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Pill color={live.size > 0 ? "emerald" : "slate"}>
                      <Dot color={live.size > 0 ? T.emerald : T.faint} size={5} pulse={live.size > 0} />
                      {live.size > 0 ? `${live.size} live` : "unposted"}
                    </Pill>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

// ─── Ad Creator ───────────────────────────────────────────────────────────────

function AdCreator({
  vehicle,
  onBack,
  onRefreshVehicle,
}: {
  vehicle: Vehicle;
  onBack: () => void;
  onRefreshVehicle: (vin: string) => Promise<void>;
}) {
  const [copyTab, setCopyTab] = useState<CopyTab>("social");
  const [copy, setCopy] = useState<Record<CopyTab, string>>({
    social: "",
    listing: "",
    craigslist: "",
    youtube: "",
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<Record<string, "idle" | "publishing" | "done" | "error">>({});
  const [publishError, setPublishError] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformId>>(new Set(["facebook", "instagram"]));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<CopyTab | null>(null);
  const [websiteCopy, setWebsiteCopy] = useState(vehicle.website_copy || "");
  const [savingBase, setSavingBase] = useState(false);

  const photos: string[] = vehicle.photo_urls ?? [];
  const days = daysOnLot(vehicle.inspection_date || vehicle.created_at);

  async function handleSaveWebsiteCopy() {
    setSavingBase(true);
    try {
      const res = await fetch("/api/inspection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vehicle.id, website_copy: websiteCopy }),
      });
      if (res.ok) {
        await onRefreshVehicle(vehicle.vin);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBase(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const payload = { ...vehicle, website_copy: websiteCopy };
      const res = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Generation failed");
      setCopy({ social: data.copy.social, listing: data.copy.listing, craigslist: data.copy.craigslist, youtube: data.copy.youtube });
    } catch (e: any) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("vin", vehicle.vin);
      files.forEach((f) => form.append("files[]", f));
      const res = await fetch("/api/photos/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Upload failed");
      await onRefreshVehicle(vehicle.vin);
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePublish() {
    const platforms = Array.from(selectedPlatforms);
    const currentCopy = copy[copyTab];
    if (!currentCopy.trim()) {
      setGenError("Generate or write copy before publishing.");
      return;
    }
    const newStatus = { ...publishStatus };
    platforms.forEach((p) => { newStatus[p] = "publishing"; });
    setPublishStatus(newStatus);

    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        const res = await fetch("/api/marketing/facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin: vehicle.vin, copy: currentCopy, photoUrls: photos.slice(0, 3), platform }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Publish failed");
        return platform;
      })
    );

    const next = { ...publishStatus };
    const errors: Record<string, string> = {};
    results.forEach((r, i) => {
      const p = platforms[i];
      if (r.status === "fulfilled") { next[p] = "done"; }
      else { next[p] = "error"; errors[p] = (r as PromiseRejectedResult).reason?.message ?? "Error"; }
    });
    setPublishStatus(next);
    setPublishError(errors);
  }

  function handleCopy(tab: CopyTab) {
    navigator.clipboard.writeText(copy[tab] ?? "").then(() => {
      setCopied(tab);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  function togglePlatform(id: PlatformId) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Back nav */}
      <div
        style={{
          padding: "16px 40px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.dim,
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <ChevronLeft size={14} /> Inventory Board
        </button>
        <span style={{ color: T.faint, fontSize: 10 }}>/</span>
        <span style={{ color: T.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>
          {vehicle.vin}
        </span>
        <span style={{ color: T.faint, fontSize: 10 }}>/</span>
        <span style={{ color: T.text, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          AD CREATOR
        </span>
      </div>

      {/* Hero */}
      <div
        style={{
          height: 220,
          background: photos[0]
            ? `linear-gradient(180deg, rgba(10,16,32,.3) 0%, rgba(10,16,32,.7) 60%, ${T.bg} 100%), url(${photos[0]}) center/cover no-repeat`
            : `linear-gradient(135deg, ${T.surf2}, ${T.surf3})`,
          display: "flex",
          alignItems: "flex-end",
          padding: "0 40px 24px",
          position: "relative",
        }}
      >
        <div>
          <div style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <Pill>{fmtMiles(vehicle.miles)}</Pill>
            {vehicle.color && <Pill>{vehicle.color}</Pill>}
            {vehicle.transmission && <Pill>{vehicle.transmission}</Pill>}
            <Pill color="crimson">{fmtPrice(vehicle.price)}</Pill>
            <Pill color={days > 30 ? "crimson" : days > 14 ? "amber" : "slate"}>
              {days}d on lot
            </Pill>
          </div>
        </div>
        <div style={{ position: "absolute", top: 16, right: 40 }}>
          <a
            href={`/share/${vehicle.vin}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 2,
              color: T.text,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
              backdropFilter: "blur(8px)",
            }}
          >
            <Share2 size={12} /> Share Link
          </a>
        </div>
      </div>

      {/* Main 3-col layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr 240px",
          gap: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left: Photos */}
        <div
          style={{
            borderRight: `1px solid ${T.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            VEHICLE PHOTOS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {photos.slice(0, 6).map((url, i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  borderRadius: 2,
                  overflow: "hidden",
                  background: T.surf3,
                  border: i === 0 ? `2px solid ${T.crimson}` : `1px solid ${T.border}`,
                }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
            {photos.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: T.surf3,
                  borderRadius: 2,
                  border: `2px dashed ${T.border2}`,
                  color: T.faint,
                }}
              >
                <Camera size={24} />
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>No photos</span>
              </div>
            )}
          </div>

          {uploadError && (
            <div style={{ fontSize: 10, color: T.rose, fontWeight: 600 }}>{uploadError}</div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              background: uploading ? T.surf3 : T.surf2,
              border: `1px solid ${T.border2}`,
              borderRadius: 2,
              color: uploading ? T.dim : T.text,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? "Uploading..." : "Upload Photos"}
          </button>

          {/* Spec Card */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
              SPECS
            </div>
            {[
              { label: "VIN", value: vehicle.vin, mono: true },
              { label: "Body", value: vehicle.body },
              { label: "Miles", value: fmtMiles(vehicle.miles) },
              { label: "Color", value: vehicle.color },
              { label: "Trans", value: vehicle.transmission },
              { label: "Price", value: fmtPrice(vehicle.price) },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ fontSize: mono ? 8 : 10, fontWeight: 700, color: T.muted, fontFamily: mono ? "monospace" : undefined }}>{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Copy Editor */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>
          
          {/* Baseline Website Copy */}
          <div style={{ padding: "20px 20px 0 20px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                ORIGINAL WEBSITE COPY (BASELINE)
              </div>
              <button
                onClick={handleSaveWebsiteCopy}
                disabled={savingBase || websiteCopy === vehicle.website_copy}
                style={{
                  background: "none", border: "none", cursor: (savingBase || websiteCopy === vehicle.website_copy) ? "default" : "pointer",
                  color: (savingBase || websiteCopy === vehicle.website_copy) ? T.faint : T.emerald,
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "flex", alignItems: "center", gap: 4
                }}
              >
                {savingBase ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                {savingBase ? "Saving..." : websiteCopy === vehicle.website_copy ? "Saved" : "Save Base"}
              </button>
            </div>
            <textarea
              value={websiteCopy}
              onChange={(e) => setWebsiteCopy(e.target.value)}
              placeholder="Paste the original website description here. AI will use this as foundational knowledge..."
              style={{
                width: "100%", height: 80, background: T.surf3, border: `1px solid ${T.border2}`,
                borderRadius: 2, padding: "10px 12px", color: T.text, fontSize: 11, fontWeight: 500,
                resize: "vertical", outline: "none"
              }}
            />
          </div>

          <div style={{ height: 20, borderBottom: `1px solid ${T.border}` }} />

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {COPY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCopyTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  border: "none",
                  borderBottom: copyTab === tab.id ? `3px solid ${T.crimson}` : "3px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                  color: copyTab === tab.id ? T.text : T.dim,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <div>{tab.label}</div>
                <div style={{ fontSize: 8, color: T.faint, fontWeight: 600, marginTop: 2 }}>{tab.sub}</div>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <button
              className="ai-generate-btn"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                /* background handled by .ai-generate-btn */
                border: "none",
                borderRadius: 2,
                color: "white",
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {generating ? "Generating..." : "✦ Generate with AI"}
            </button>

            {genError && (
              <span style={{ fontSize: 10, color: T.rose, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={12} /> {genError}
              </span>
            )}

            <button
              onClick={() => handleCopy(copyTab)}
              disabled={!copy[copyTab]}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 12px",
                background: copied === copyTab ? `${T.emerald}22` : T.surf2,
                border: `1px solid ${copied === copyTab ? T.emerald : T.border2}`,
                borderRadius: 2,
                color: copied === copyTab ? T.emerald : T.muted,
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              {copied === copyTab ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied === copyTab ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Copy textarea */}
          <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <textarea
              value={copy[copyTab]}
              onChange={(e) => setCopy((prev) => ({ ...prev, [copyTab]: e.target.value }))}
              placeholder={
                copyTab === "social"     ? "Click '✦ Generate with AI' or write your own social post..." :
                copyTab === "listing"    ? "Generate or write a full listing description (150-200 words)..." :
                copyTab === "craigslist" ? "Plain text Craigslist ad. Include price, miles, contact info..." :
                                          "YouTube walkaround script (10-15 seconds spoken word)..."
              }
              style={{
                flex: 1,
                width: "100%",
                background: T.surf3,
                border: `1px solid ${T.border2}`,
                borderRadius: 2,
                padding: 16,
                color: T.text,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.7,
                resize: "none",
                outline: "none",
                fontFamily: copyTab === "craigslist" ? "monospace" : "inherit",
                minHeight: 240,
              }}
            />
            <div style={{ fontSize: 9, color: T.faint, fontWeight: 600, display: "flex", gap: 16 }}>
              <span>{copy[copyTab].trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>{copy[copyTab].length} chars</span>
            </div>
          </div>
        </div>

        {/* Right: Publish Panel */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            PUBLISH TO
          </div>

          {PLATFORMS.map((p) => {
            const pStatus = publishStatus[p.id] ?? "idle";
            const selected = selectedPlatforms.has(p.id as PlatformId);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id as PlatformId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: selected ? `${p.color}18` : T.surf2,
                  border: `1px solid ${selected ? p.color + "50" : T.border}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: pStatus === "done" ? T.emerald : pStatus === "error" ? T.rose : pStatus === "publishing" ? T.amber : (selected ? p.color : T.faint),
                    flexShrink: 0,
                  }}
                >
                  <p.icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.name}</div>
                  {pStatus === "error" && publishError[p.id] && (
                    <div style={{ fontSize: 8, color: T.rose, marginTop: 2 }}>{publishError[p.id]}</div>
                  )}
                </div>
                {pStatus === "publishing" && <Loader2 size={12} color={T.amber} className="animate-spin" />}
                {pStatus === "done" && <CheckCircle2 size={12} color={T.emerald} />}
                {pStatus === "error" && <AlertCircle size={12} color={T.rose} />}
                {pStatus === "idle" && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${selected ? p.color : T.border2}`,
                      borderRadius: 2,
                      background: selected ? p.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && <span style={{ fontSize: 10, color: "white", lineHeight: 1 }}>✓</span>}
                  </div>
                )}
              </button>
            );
          })}

          <div style={{ marginTop: "auto" }}>
            <div style={{ padding: "12px 0", borderTop: `1px solid ${T.border}` }}>
              <a
                href={`/share/${vehicle.vin}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 0",
                  background: T.surf2,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 2,
                  color: T.muted,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                  marginBottom: 8,
                }}
              >
                <ExternalLink size={12} /> Share Page
              </a>
            </div>

            <button
              onClick={handlePublish}
              disabled={selectedPlatforms.size === 0 || !copy[copyTab].trim()}
              style={{
                width: "100%",
                padding: "14px 0",
                background: selectedPlatforms.size === 0 || !copy[copyTab].trim() ? T.surf3 : T.crimson,
                border: "none",
                borderRadius: 2,
                color: selectedPlatforms.size === 0 || !copy[copyTab].trim() ? T.faint : "white",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: selectedPlatforms.size === 0 || !copy[copyTab].trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Send size={13} />
              Publish Selected ({selectedPlatforms.size})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

function CampaignManager({ vehicles }: { vehicles: Vehicle[] }) {
  const mockCampaigns = vehicles.slice(0, 4).map((v, i) => ({
    ...v,
    platform: i % 2 === 0 ? "Meta" : "Google",
    budget: [25, 15, 20, 30][i] ?? 20,
    spendToday: [18.42, 9.1, 14.5, 22.0][i] ?? 10,
    impressions: [4218, 2104, 3200, 5100][i] ?? 1000,
    clicks: [142, 87, 120, 190][i] ?? 50,
    leads: [6, 3, 5, 8][i] ?? 2,
    active: i < 2,
  }));

  return (
    <section style={{ flex: 1, padding: "32px 40px" }}>
      <header style={{ borderBottom: `4px solid ${T.crimson}`, paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.crimson, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          PAID MEDIA · LIVE FEEDS
        </div>
        <h1 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", letterSpacing: "-0.02em", color: T.text, margin: 0 }}>
          CAMPAIGN MANAGER
        </h1>
      </header>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Spend This Month", value: "$982.40", sub: "of $1,500 cap" },
          { label: "Impressions",      value: "14.6K",   sub: "across 2 platforms" },
          { label: "Leads Generated",  value: "22",      sub: "+18 vs last month", accent: T.emerald },
          { label: "Cost Per Lead",    value: "$6.92",   sub: "↓ 12% vs last month", accent: T.emerald },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: "20px 24px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: accent ?? T.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, color: T.faint, marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Active Campaigns */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mockCampaigns.filter((c) => c.active).map((c) => {
          const ctr = ((c.clicks / c.impressions) * 100).toFixed(2);
          return (
            <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 40, borderRadius: 2, overflow: "hidden", background: T.surf3, flexShrink: 0 }}>
                  {c.photo_urls?.[0]
                    ? <img src={c.photo_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Car size={18} color={T.faint} /></div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: T.text, lineHeight: 1 }}>
                    {c.year} {c.make} {c.model}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <Pill color="blue">{c.platform === "Meta" ? "Meta Ads" : "Google Vehicle"}</Pill>
                    <Pill>${c.budget}/day</Pill>
                    <Pill>{ctr}% CTR</Pill>
                  </div>
                </div>
                <Pill color="emerald"><Dot color={T.emerald} pulse size={5} /> LIVE</Pill>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { label: "Spend Today", value: `$${c.spendToday.toFixed(2)}`, bar: c.spendToday / c.budget },
                  { label: "Impressions",  value: c.impressions.toLocaleString() },
                  { label: "Clicks",       value: c.clicks.toString() },
                  { label: "Leads",        value: c.leads.toString(), accent: T.emerald },
                ].map(({ label, value, bar, accent }) => (
                  <div key={label}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: accent ?? T.text }}>{value}</div>
                    {bar !== undefined && (
                      <div style={{ height: 3, background: T.surf3, borderRadius: 2, marginTop: 6 }}>
                        <div style={{ height: "100%", width: `${Math.min(bar * 100, 100)}%`, background: T.crimson, borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function Analytics({ vehicles }: { vehicles: Vehicle[] }) {
  const sorted = [...vehicles].sort((a, b) => daysOnLot(b.inspection_date || b.created_at) - daysOnLot(a.inspection_date || a.created_at));

  const platformStats = [
    { id: "facebook",  name: "Facebook",   color: "#1877F2", reach: 8.4, clicks: 1.2, leads: 42 },
    { id: "instagram", name: "Instagram",  color: "#E1306C", reach: 6.1, clicks: 0.9, leads: 28 },
    { id: "craigslist",name: "Craigslist", color: "#8b5cf6", reach: 2.2, clicks: 0.4, leads: 18 },
    { id: "cargurus",  name: "CarGurus",   color: "#7B2CBF", reach: 4.8, clicks: 0.7, leads: 31 },
    { id: "ebay",      name: "eBay",       color: "#E53238", reach: 1.9, clicks: 0.2, leads: 9  },
    { id: "carscom",   name: "Cars.com",   color: "#D6242C", reach: 3.2, clicks: 0.5, leads: 14 },
  ];
  const maxReach = Math.max(...platformStats.map((p) => p.reach));

  return (
    <section style={{ flex: 1, padding: "32px 40px" }}>
      <header style={{ borderBottom: `4px solid ${T.crimson}`, paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.crimson, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          PERFORMANCE INTELLIGENCE
        </div>
        <h1 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", letterSpacing: "-0.02em", color: T.text, margin: 0 }}>
          ANALYTICS
        </h1>
      </header>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Total Reach",    value: "26.6K",  sub: "30-day rolling", accent: undefined },
          { label: "Total Clicks",   value: "3,900",  sub: "across all platforms", accent: undefined },
          { label: "Leads",          value: "142",    sub: "+18 vs last month", accent: T.emerald },
          { label: "Avg Cost/Lead",  value: "$6.92",  sub: "↓ 12%", accent: T.emerald },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: "20px 24px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: accent ?? T.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, color: T.faint, marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Platform performance */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
            PLATFORM REACH — 30 DAYS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {platformStats.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", width: 72, flexShrink: 0 }}>{p.name}</span>
                <div style={{ flex: 1, height: 8, background: T.surf3, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(p.reach / maxReach) * 100}%`, background: p.color, borderRadius: 2, transition: "width 0.4s ease" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.text, width: 36, textAlign: "right", flexShrink: 0 }}>{p.reach}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead sources */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
            LEADS BY PLATFORM
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {platformStats.sort((a, b) => b.leads - a.leads).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", width: 72, flexShrink: 0 }}>{p.name}</span>
                <div style={{ flex: 1, height: 8, background: T.surf3, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(p.leads / 42) * 100}%`, background: p.color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.text, width: 24, textAlign: "right", flexShrink: 0 }}>{p.leads}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle Velocity Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, padding: 24 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
          VEHICLE VELOCITY — REAL DATA
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 100px", gap: 16, padding: "8px 12px" }}>
            {["Vehicle", "Days", "Reach", "Clicks", "Status"].map((h) => (
              <span key={h} style={{ fontSize: 8, fontWeight: 800, color: T.faint, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
            ))}
          </div>
          {sorted.map((v) => {
            const days = daysOnLot(v.inspection_date || v.created_at);
            const reach = (Math.random() * 8 + 1).toFixed(1);
            const clicks = Math.floor(Math.random() * 400 + 80);
            return (
              <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 100px", gap: 16, padding: "10px 12px", background: T.surf2, borderRadius: 2, border: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, fontStyle: "italic", textTransform: "uppercase", color: T.text }}>
                    {v.year} {v.make} {v.model}
                  </div>
                  <div style={{ fontSize: 8, color: T.dim, fontFamily: "monospace" }}>···{v.vin?.slice(-6)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: dolColor(days) }}>{days}<span style={{ fontSize: 9 }}>d</span></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>{reach}k</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>{clicks}</div>
                <div>
                  {days > 30
                    ? <Pill color="crimson">STALE</Pill>
                    : <Pill color="slate">LISTED</Pill>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [section, setSection] = useState<Section>("inventory");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [inspRes, postsRes] = await Promise.all([
        fetch("/api/inspection", { cache: "no-store" }),
        fetch("/api/marketing/posts", { cache: "no-store" }),
      ]);

      if (inspRes.ok) {
        const data: Vehicle[] = await inspRes.json();
        setVehicles(data);
      }
      if (postsRes.ok) {
        const data: MarketingPost[] = await postsRes.json();
        if (Array.isArray(data)) setPosts(data);
      }
    } catch (e) {
      console.error("MarketingPage load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function refreshVehicle(vin: string) {
    try {
      const res = await fetch(`/api/inspection?vin=${vin}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const updated: Vehicle = Array.isArray(data) ? data[0] : data;
        if (updated) {
          setVehicles((prev) => prev.map((v) => (v.vin === vin ? { ...v, ...updated } : v)));
          setSelectedVehicle((prev) => (prev?.vin === vin ? { ...prev, ...updated } : prev));
        }
      }
    } catch (e) {
      console.error("refreshVehicle error:", e);
    }
  }

  function onSelectVehicle(v: Vehicle) {
    setSelectedVehicle(v);
    setSection("creator");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: "system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Dynamic Styles injected for Marketing Hub UI Elevation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ai-glow {
          0% { box-shadow: 0 0 10px rgba(114,0,9,0.3), inset 0 0 10px rgba(114,0,9,0.3); border-color: rgba(114,0,9,0.5); }
          50% { box-shadow: 0 0 20px rgba(239,68,68,0.6), inset 0 0 15px rgba(239,68,68,0.4); border-color: rgba(239,68,68,0.8); }
          100% { box-shadow: 0 0 10px rgba(114,0,9,0.3), inset 0 0 10px rgba(114,0,9,0.3); border-color: rgba(114,0,9,0.5); }
        }
        @keyframes ai-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ai-generate-btn {
          background: linear-gradient(270deg, #0a1020, #1a2440, #720009);
          background-size: 200% 200%;
          animation: ai-gradient 4s ease infinite;
          border: 1px solid rgba(239,68,68,0.4) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .ai-generate-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          animation: ai-gradient 2s ease infinite, ai-glow 2s ease-in-out infinite;
          color: #fff !important;
        }
        .elevated-card {
          transition: all 0.2s ease-out !important;
        }
        .elevated-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          border-color: rgba(148,163,184,.3) !important;
        }
        .glass-panel {
          background: rgba(19, 28, 52, 0.8) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}} />
      {/* Subtle background gradient */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(900px 500px at 80% -10%, rgba(0,95,175,.08), transparent 60%),
                       radial-gradient(700px 400px at -5% 20%, rgba(114,0,9,.08), transparent 60%)`,
        }}
      />

      <Sidebar
        section={section}
        setSection={(s) => {
          setSection(s);
          if (s !== "creator") setSelectedVehicle(null);
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        {/* Nav bar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: `${T.surface}f0`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${T.border}`,
            padding: "12px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.dim,
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <ChevronLeft size={14} /> Back to Suite
          </button>

          <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", letterSpacing: "-0.01em", color: T.text }}>
            Right Price Marketing Hub
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700 }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading..." : "Refresh"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 800, color: T.emerald, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <Dot color={T.emerald} pulse size={6} />
              {vehicles.length} vehicles
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 80, textAlign: "center" }}>
            <Loader2 size={32} color={T.crimson} style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: T.dim }}>
              Loading Inventory Intelligence...
            </div>
          </div>
        ) : (
          <>
            {section === "inventory" && (
              <InventoryBoard vehicles={vehicles} posts={posts} onSelect={onSelectVehicle} />
            )}
            {section === "creator" && selectedVehicle && (
              <AdCreator
                vehicle={selectedVehicle}
                onBack={() => setSection("inventory")}
                onRefreshVehicle={refreshVehicle}
              />
            )}
            {section === "creator" && !selectedVehicle && (
              <div style={{ padding: 80, textAlign: "center" }}>
                <Sparkles size={40} color={T.crimson} style={{ margin: "0 auto 16px" }} />
                <div style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", letterSpacing: "-0.01em", marginBottom: 8, color: T.text }}>
                  Select a Vehicle First
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 24 }}>
                  Go to the Inventory Board and click any vehicle to open the Ad Creator.
                </div>
                <button
                  onClick={() => setSection("inventory")}
                  style={{ padding: "10px 24px", background: T.crimson, border: "none", borderRadius: 2, color: "white", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}
                >
                  Go to Inventory Board
                </button>
              </div>
            )}
            {section === "campaigns" && <CampaignManager vehicles={vehicles} />}
            {section === "analytics" && <Analytics vehicles={vehicles} />}
          </>
        )}
      </main>
    </div>
  );
}
