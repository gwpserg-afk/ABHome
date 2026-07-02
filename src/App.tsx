import { useState, useEffect, useRef, type FormEvent } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Phone, Star, ShieldCheck, BadgeCheck, Wallet, MapPin, Clock, ArrowRight,
  Menu, X, Home, Hammer, Droplets, PaintRoller, Wrench,
  CheckCircle2, Calculator, Sparkles, Award, ThumbsUp,
  LayoutDashboard, DollarSign, TrendingUp, Users, CreditCard, ArrowLeft, Percent,
  Lock, Eye, EyeOff, Calendar,
} from "lucide-react";

const PHONE = "(810) 627-4895";
const PHONE_HREF = "tel:+18106274895";
const ADDRESS = "2424 Howe St, Shelby Township, MI 48317";
const GOOGLE_REVIEWS = "https://share.google/FK0XyEBS4mhp3d0xX";
// Address autocomplete providers (best first). Tokens come from env vars so they never get committed.
// Mapbox = best house-number accuracy. Set VITE_MAPBOX_TOKEN in .env (local) + Vercel (prod).
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const GEOAPIFY_KEY = (import.meta.env.VITE_GEOAPIFY_KEY as string | undefined) || "";
// Michigan bounding box: minLon, minLat, maxLon, maxLat
const MI_BBOX = "-90.42,41.70,-82.12,48.31";

// Abuse guard: cap address lookups per browser session so no one can hammer the geocoding API.
const MAX_LOOKUPS_PER_SESSION = 80;
function underLookupLimit() {
  try {
    const n = +(sessionStorage.getItem("ab_geo_calls") || "0");
    if (n >= MAX_LOOKUPS_PER_SESSION) return false;
    sessionStorage.setItem("ab_geo_calls", String(n + 1));
    return true;
  } catch { return true; }
}

// Lead capture: emails Brad via Formspree + saves to the admin database.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mkolqdag";
type Lead = { name?: string; phone?: string; email?: string; address?: string; service?: string; message?: string; estimate?: string };
async function submitLead(lead: Lead) {
  // Fire both; don't let one failing block the other.
  const tasks: Promise<any>[] = [];
  tasks.push(
    fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    }).catch(() => {})
  );
  tasks.push(
    fetch("/api/save-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    }).catch(() => {})
  );
  await Promise.allSettled(tasks);
}

/* ---------------- Payments ---------------- */
async function startCheckout(payload: { mode: string; amount?: number; description?: string; email?: string }): Promise<{ url?: string; error?: string }> {
  try {
    const r = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) return { error: d.error || "Payment error." };
    return { url: d.url };
  } catch {
    return { error: "Network error — please try again." };
  }
}

function DepositButton({ email, className = "" }: { email?: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setLoading(true); setErr("");
    const { url, error } = await startCheckout({ mode: "deposit", email });
    if (url) window.location.href = url;
    else { setErr(error || "Payments unavailable right now."); setLoading(false); }
  };
  return (
    <div className={className}>
      <button onClick={go} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3.5 rounded-lg transition-colors disabled:opacity-60">
        <CreditCard className="w-4 h-4" /> {loading ? "Starting secure checkout…" : "Lock in my spot — $500 deposit"}
      </button>
      <p className="text-[11px] text-white/50 mt-2 text-center">Secure checkout by Stripe · card, or pay monthly with Affirm / Klarna</p>
      {err && <p className="text-[12px] text-red-300 mt-1.5 text-center">{err}</p>}
    </div>
  );
}

/* ---------------- Logo ---------------- */
// The brand logo has dark charcoal lettering on transparent — perfect on light backgrounds.
// On dark backgrounds pass `chip` to sit it on a clean white tile so it stays legible.
function Logo({ h = "h-10", chip = false }: { h?: string; chip?: boolean }) {
  const img = <img src="/logo.png" alt="A&B Home Improvement" className={`${h} w-auto object-contain shrink-0`} />;
  if (chip) return <span className="grid place-items-center bg-white rounded-xl px-2.5 py-1.5 shadow-sm">{img}</span>;
  return img;
}

/* ---------------- Scroll to top on route change ---------------- */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* ---------------- Header ---------------- */
function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    ["Home", "/"],
    ["Services", "/services"],
    ["Gallery", "/gallery"],
    ["Estimate", "/estimate"],
    ["Reviews", "/reviews"],
    ["Contact", "/contact"],
  ];
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-colors ${isActive ? "text-brand" : "text-slatey hover:text-ink"}`;
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="container-x flex items-center justify-between h-[92px]">
        <Link to="/" className="flex items-center gap-3">
          <Logo h="h-16" />
          <span className="hidden sm:block leading-none border-l border-black/10 pl-3">
            <span className="block text-xs font-bold text-brand uppercase tracking-[0.18em]">Roofing Done Right</span>
            <span className="block text-[11px] font-semibold text-slatey uppercase tracking-[0.14em] mt-1">Shelby Twp, MI</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {nav.map(([l, h]) => (
            <NavLink key={h} to={h} end={h === "/"} className={linkCls}>{l}</NavLink>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <a href={PHONE_HREF} className="flex items-center gap-2 text-sm font-bold text-ink">
            <Phone className="w-4 h-4 text-brand" /> {PHONE}
          </a>
          <Link to="/estimate" className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-brand transition-colors">
            Free Estimate
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-ink" aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-black/5 bg-white">
          <div className="container-x py-4 flex flex-col gap-1">
            {nav.map(([l, h]) => (
              <NavLink key={h} to={h} end={h === "/"} onClick={() => setOpen(false)} className="py-2.5 font-semibold text-slatey">{l}</NavLink>
            ))}
            <a href={PHONE_HREF} className="mt-2 inline-flex items-center justify-center gap-2 bg-ink text-white font-bold px-4 py-3 rounded-lg">
              <Phone className="w-4 h-4" /> {PHONE}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section id="top" className="relative min-h-[88vh] flex items-center text-white overflow-hidden">
      <img src="/photos/crew-tearoff.png" alt="A&B Home Improvement roofing crew at work" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink/92 via-ink/80 to-ink/60" />
      <div className="container-x relative py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-bold backdrop-blur">
            <Award className="w-4 h-4 text-brand-soft" /> Top 3 Roofer in Shelby Township · 2025
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-6xl font-extrabold leading-[1.03]">
            Your Roof,<br /><span className="text-brand-soft">Done Right.</span>
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-xl">
            Metro Detroit's top-rated roofing crew. New roofs, repairs, and full exteriors — quality work,
            honest pricing, and a free estimate measured right from your address.
          </p>

          {/* Financing highlight — the big differentiator */}
          <div className="mt-6 inline-flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-brand/15 border border-brand-soft/40 rounded-2xl px-5 py-3.5 backdrop-blur">
            <span className="inline-flex items-center gap-2 font-extrabold text-white text-lg">
              <Wallet className="w-5 h-5 text-brand-soft" /> $0 Down Financing
            </span>
            <span className="text-white/70 text-sm">Get your roof now, pay monthly with <b className="text-brand-soft">Affirm</b> or <b className="text-brand-soft">Klarna</b> — quick approval, flexible terms.</span>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/estimate" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-7 py-4 rounded-xl shadow-brand transition-all hover:scale-[1.02]">
              <Calculator className="w-5 h-5" /> Get My Instant Estimate
            </Link>
            <a href={PHONE_HREF} className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:bg-white hover:text-ink font-bold px-7 py-4 rounded-xl transition-all">
              <Phone className="w-5 h-5" /> {PHONE}
            </a>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-brand-soft text-brand-soft" />)}</span>
              <b>4.8</b> · 50 Google reviews
            </span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-soft" /> Licensed &amp; Insured</span>
            <span className="inline-flex items-center gap-1.5"><Wallet className="w-4 h-4 text-brand-soft" /> Financing Available</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust bar ---------------- */
function TrustBar() {
  const items: [typeof Award, string][] = [
    [Award, "Top 3 in Shelby Twp · 2025"],
    [Star, "4.8★ · 50 Reviews"],
    [ShieldCheck, "Licensed & Insured"],
    [Wallet, "Financing Available"],
    [BadgeCheck, "Free Estimates"],
    [Clock, "24/7 Availability"],
    [ThumbsUp, "Family Owned"],
  ];
  const row = [...items, ...items];
  return (
    <div className="bg-ink text-white py-5 overflow-hidden border-b border-white/5">
      <div className="marquee gap-10">
        {row.map(([Icon, label], i) => (
          <span key={i} className="inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap text-white/85">
            <Icon className="w-4 h-4 text-brand-soft" /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Estimator ---------------- */
// Priced so a typical ~1,400 sq ft roof (arch shingles) lands ~$7,000–$11,000 (mid ~$9,000), per Brad.
const MATERIALS = [
  { key: "arch", label: "Architectural Shingles", note: "Most popular", low: 5.0, high: 7.85 },
  { key: "dimensional", label: "Dimensional Shingles", note: "Great value & look", low: 5.75, high: 8.5 },
  { key: "impact", label: "Impact-Resistant (Class 4)", note: "Hail & storm rated", low: 7.0, high: 10.0 },
  { key: "premium", label: "Premium / Designer Shingles", note: "Top-tier curb appeal", low: 8.5, high: 12.5 },
  { key: "flat", label: "Flat / Rubber (EPDM)", note: "Low-slope roofs", low: 6.5, high: 9.5 },
];

function AddressAutocomplete({ value, onChange, onSelect }: { value: string; onChange: (v: string) => void; onSelect: (v: string) => void }) {
  const [sug, setSug] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.trim().length < 3) { setSug([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!underLookupLimit()) { setSug([]); return; }
      try {
        let list: string[] = [];
        if (MAPBOX_TOKEN) {
          // Mapbox Geocoding — best house-number accuracy, restricted to Michigan bounding box
          const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=us&types=address&bbox=${MI_BBOX}&limit=6`);
          const d = await r.json();
          list = (d.features || []).map((f: any) => f.place_name.replace(/, United States$/, "") as string);
        } else if (GEOAPIFY_KEY) {
          // Geoapify autocomplete — returns real house numbers, restricted to Michigan (free key, no card)
          const r = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&filter=rect:${MI_BBOX}&format=json&limit=6&apiKey=${GEOAPIFY_KEY}`);
          const d = await r.json();
          list = (d.results || [])
            .filter((f: any) => f.state_code === "MI" || f.state === "Michigan")
            .map((f: any) => f.formatted as string);
        } else {
          // Fallback: free OSM autocomplete, biased to Michigan (no API key — street-level only)
          const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=8&lat=43.3&lon=-84.6`);
          const d = await r.json();
          list = (d.features || [])
            .filter((f: any) => f.properties?.state === "Michigan")
            .map((f: any) => {
              const p = f.properties;
              const line1 = [p.housenumber, p.street || p.name].filter(Boolean).join(" ");
              return [line1, p.city || p.district || p.county, "MI", p.postcode].filter(Boolean).join(", ");
            });
        }
        setSug([...new Set(list)].slice(0, 6));
        setOpen(true);
      } catch { setSug([]); }
    }, 250);
  }, [value]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-3.5 focus-within:border-brand transition">
        <MapPin className="w-5 h-5 text-brand shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => sug.length > 0 && setOpen(true)}
          placeholder="Start typing your address…"
          className="w-full focus:outline-none"
        />
      </div>
      {open && sug.length > 0 && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-lg border border-black/10 shadow-lift overflow-hidden">
          {sug.map((s, i) => (
            <button key={i} type="button" onClick={() => { onSelect(s); setOpen(false); setSug([]); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-cloud flex items-center gap-2 border-b border-black/5 last:border-0">
              <MapPin className="w-4 h-4 text-slatey shrink-0" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Estimator() {
  const [address, setAddress] = useState("");
  const [found, setFound] = useState(false);
  const [size, setSize] = useState(1400);
  const [mat, setMat] = useState("arch");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  const m = MATERIALS.find((x) => x.key === mat)!;
  const round500 = (n: number) => Math.round(n / 500) * 500;
  const low = round500(size * m.low);
  const high = round500(size * m.high);
  const fmt = (n: number) => "$" + n.toLocaleString();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&t=k&z=20&output=embed`;
  const lookup = () => { if (address.trim().length > 5) setFound(true); };

  return (
    <section id="estimate" className="section bg-cloud scroll-mt-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Instant Estimate</p>
          <h2 className="text-4xl md:text-5xl text-ink">See your roof. Get your price.</h2>
          <p className="mt-4 text-slatey">
            Type your address and we'll pull up your actual roof from above — then give you an
            instant estimate with financing. No calls to sit through, no pressure.
          </p>
        </div>

        {!found ? (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-black/5 shadow-card p-7 md:p-9">
            <label className="block text-xs font-bold uppercase tracking-wider text-slatey mb-2">Enter your property address</label>
            <AddressAutocomplete value={address} onChange={setAddress} onSelect={(v) => { setAddress(v); setFound(true); }} />
            <button onClick={lookup} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-4 rounded-xl shadow-brand transition-colors">
              <MapPin className="w-5 h-5" /> See My Roof &amp; Estimate
            </button>
            <p className="text-[11px] text-slatey/70 text-center mt-3">We'll show your roof from satellite + an instant ballpark. Financing available.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Satellite */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-card overflow-hidden flex flex-col">
              <div className="px-5 pt-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-brand font-bold text-sm"><MapPin className="w-4 h-4" /> Your Property</span>
                <button onClick={() => { setFound(false); setDone(false); }} className="text-xs font-semibold text-slatey hover:text-ink underline">Change address</button>
              </div>
              <p className="px-5 pt-1 text-sm text-slatey truncate">{address}</p>
              <div className="mt-3 flex-1 min-h-[320px]">
                <iframe title="Your roof from satellite" src={mapSrc} className="w-full h-full min-h-[320px] border-0" loading="lazy" />
              </div>
              <p className="px-5 py-3 text-[11px] text-slatey/70">Satellite view of your address. We confirm the exact roof measurement on your free inspection.</p>
            </div>

            {/* Estimate */}
            <div className="bg-ink text-white rounded-2xl shadow-lift p-7 flex flex-col">
              <div className="flex items-center gap-2 text-brand-soft text-sm font-bold"><Sparkles className="w-4 h-4" /> Your Estimated Investment</div>
              <div className="mt-3 font-display text-4xl md:text-5xl font-extrabold">
                {fmt(low)} <span className="text-white/40 text-2xl font-bold">–</span> {fmt(high)}
              </div>
              <p className="text-white/55 text-sm mt-2">{m.label} · ~{size.toLocaleString()} sq ft · installed</p>

              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mt-5 mb-1.5">Adjust roof size — {size.toLocaleString()} sq ft</label>
              <input type="range" min={800} max={5000} step={100} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-brand" />

              <div className="grid grid-cols-2 gap-1.5 mt-4">
                {MATERIALS.map((x) => (
                  <button key={x.key} onClick={() => setMat(x.key)} className={`text-left rounded-lg border p-2 transition ${mat === x.key ? "border-brand bg-brand/15" : "border-white/10 hover:border-white/25"}`}>
                    <div className="text-[13px] font-bold leading-tight">{x.label}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-center gap-3">
                <Wallet className="w-6 h-6 text-brand-soft shrink-0" />
                <div>
                  <div className="text-sm"><b className="text-brand-soft text-base">$0-Down Monthly Financing</b></div>
                  <div className="text-[11px] text-white/50">Pay over time with Affirm or Klarna · quick approval</div>
                </div>
              </div>

              {done ? (
                <div className="mt-4 rounded-xl bg-brand/15 border border-brand/30 p-5">
                  <div className="text-center">
                    <CheckCircle2 className="w-9 h-9 text-brand-soft mx-auto mb-2" />
                    <div className="font-bold text-lg">You're all set{name ? `, ${name.split(" ")[0]}` : ""}!</div>
                    <p className="text-sm text-white/70 mt-1">We'll confirm your exact roof measurement and call with your final quote.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/80 text-center mb-3">Want to lock in your spot on the schedule?</p>
                    <DepositButton />
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); submitLead({ name, phone, address, service: `${m.label} · ~${size.toLocaleString()} sq ft`, estimate: `${fmt(low)}–${fmt(high)}` }); setDone(true); }} className="mt-4 flex flex-col gap-2.5">
                  <p className="text-sm text-white/70">Want your exact quote? Drop your info:</p>
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className="rounded-lg bg-white/10 border border-white/15 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-brand" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" placeholder="Phone number" className="rounded-lg bg-white/10 border border-white/15 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-brand" />
                  <button type="submit" className="mt-1 inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark font-bold px-6 py-3.5 rounded-lg transition-colors">
                    Get My Exact Quote <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
              <p className="text-[11px] text-white/40 mt-3">Ballpark only — final price after a free inspection. Shingles &amp; flat roofs (no metal/steel).</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
const SERVICES = [
  { icon: Droplets, t: "Gutters", d: "Seamless gutters, guards & downspouts to protect your home." },
  { icon: PaintRoller, t: "Painting", d: "Interior & exterior painting, clean lines, quality finish." },
  { icon: Hammer, t: "Drywall", d: "Repairs, patches, new walls & ceilings — smooth results." },
  { icon: Wrench, t: "Plumbing", d: "Everyday plumbing repairs and fixes, handled fast." },
];

function Services() {
  return (
    <section id="services" className="section scroll-mt-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">What We Do</p>
          <h2 className="text-4xl md:text-5xl text-ink">Roofing first — and anything else your home needs.</h2>
          <p className="mt-4 text-slatey text-lg">One local, licensed crew for the whole house — no subcontractors, no runaround.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Roofing hero card */}
          <div className="relative lg:row-span-2 rounded-3xl overflow-hidden shadow-lift min-h-[360px] group">
            <img src="/photos/finished-roof.png" alt="Finished shingle roof by A&B Home Improvement" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/10" />
            <div className="relative h-full flex flex-col justify-end p-7 text-white">
              <span className="inline-flex self-start items-center gap-1.5 bg-brand text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">Most requested</span>
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur grid place-items-center mb-3"><Home className="w-6 h-6" /></div>
              <h3 className="font-display text-3xl font-extrabold">Roofing</h3>
              <p className="text-white/80 mt-2 max-w-sm">New roofs, full replacements, tear-offs & repairs. Shingle specialists — built to last and done right the first time.</p>
              <Link to="/estimate" className="mt-5 inline-flex items-center gap-2 bg-white text-ink font-bold px-5 py-3 rounded-xl w-fit hover:bg-brand hover:text-white transition-colors">
                Get a free roof quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Supporting services */}
          {SERVICES.map((s) => (
            <div key={s.t} className="group rounded-3xl bg-white border border-black/5 shadow-card hover:shadow-lift hover:-translate-y-1.5 transition-all duration-300 p-7">
              <div className="w-12 h-12 rounded-xl grid place-items-center mb-4 bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-ink mb-1.5">{s.t}</h3>
              <p className="text-sm text-slatey leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Gallery ---------------- */
function Gallery() {
  const photos = [
    { src: "/photos/before-after.png", t: "Before & After", big: true },
    { src: "/photos/finished-roof.png", t: "Finished Shingle Roof" },
    { src: "/photos/crew-shingles.png", t: "Full Tear-Off & Reroof" },
    { src: "/photos/shingle-roof-brown.png", t: "Architectural Shingles" },
    { src: "/photos/underlayment.png", t: "Quality Underlayment" },
    { src: "/photos/chimney.png", t: "Exterior & Masonry" },
  ];
  return (
    <section id="gallery" className="section bg-cream scroll-mt-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Our Work</p>
          <h2 className="text-4xl md:text-5xl text-ink">Real roofs. Real crews. Real results.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((p, i) => (
            <div key={i} className={`group relative overflow-hidden rounded-2xl shadow-card ${p.big ? "sm:col-span-2 lg:row-span-2 lg:col-span-1" : ""}`}>
              <img src={p.src} alt={p.t} className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${p.big ? "h-full min-h-[260px]" : "h-60"}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 text-white font-bold text-sm">{p.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Reviews ---------------- */
function Reviews() {
  const reviews = [
    { n: "Oakley Hollie", t: "Easy to schedule with and took the time to explain what needed to be done. Straightforward plan, fair quote, and a clean worksite. Highly recommend.", tag: "2 reviews" },
    { n: "Alena Morningstar", t: "Reached out after a friend recommended them. They came by within a few days, walked through everything with us, and the work was excellent.", tag: "" },
    { n: "Loretta Stone", t: "Came by within a couple of days, looked everything over, and gave a straightforward plan without overcomplicating things. Great experience.", tag: "Local Guide" },
    { n: "Verified Customer", t: "Brad's awesome and has the best prices around.", tag: "Google" },
    { n: "Verified Customer", t: "They came out and did wonderful work on my aunt's roof for a great price!", tag: "Google" },
  ];
  return (
    <section id="reviews" className="section scroll-mt-20">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Reviews</p>
            <h2 className="text-4xl md:text-5xl text-ink">4.8 stars across 50 reviews</h2>
          </div>
          <div className="flex items-center gap-4 bg-cloud rounded-2xl px-6 py-4 border border-black/5">
            <img src="/photos/top3-award.png" alt="Top 3 Roofer Shelby Township 2025" className="h-16 w-16 object-contain rounded-lg" />
            <div>
              <div className="font-display font-extrabold text-ink leading-tight">Top 3 Roofer</div>
              <div className="text-sm text-slatey">Shelby Township · 2025</div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.slice(0, 3).map((r, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-card p-6">
              <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, k) => <Star key={k} className="w-4 h-4 fill-brand text-brand" />)}</div>
              <p className="text-ink leading-relaxed text-[15px]">"{r.t}"</p>
              <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2.5">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-ink text-white font-bold text-sm">{r.n[0]}</span>
                <div>
                  <div className="font-bold text-ink text-sm">{r.n}</div>
                  {r.tag && <div className="text-[11px] text-slatey">{r.tag}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          {reviews.slice(3).map((r, i) => (
            <div key={i} className="bg-cloud rounded-2xl p-5 flex items-center gap-4 border border-black/5">
              <span className="flex shrink-0">{[...Array(5)].map((_, k) => <Star key={k} className="w-4 h-4 fill-brand text-brand" />)}</span>
              <p className="text-ink font-medium">"{r.t}"</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href={GOOGLE_REVIEWS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-white hover:bg-cloud text-ink font-bold px-7 py-3.5 rounded-xl border border-black/10 shadow-card transition-colors">
            <img src="/google-logo.png" alt="Google" className="w-5 h-5 object-contain" /> Read all our reviews on Google <ArrowRight className="w-4 h-4 text-brand" />
          </a>
        </div>

        {/* Leave-a-review CTA — Brad can send this to past customers */}
        <div className="mt-6 rounded-3xl bg-ink text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative">
            <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, k) => <Star key={k} className="w-5 h-5 fill-brand-soft text-brand-soft" />)}</div>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold">Had a great experience?</h3>
            <p className="text-white/70 mt-1.5 max-w-md">It takes 30 seconds and means the world to a local family business. Leave us a quick review on Google.</p>
          </div>
          <a href={GOOGLE_REVIEWS} target="_blank" rel="noopener noreferrer" className="relative shrink-0 inline-flex items-center gap-2.5 bg-white hover:bg-brand hover:text-white text-ink font-bold px-7 py-4 rounded-xl transition-colors shadow-lift">
            <img src="/google-logo.png" alt="Google" className="w-5 h-5 object-contain" /> Leave a 5-Star Review <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Meet the team ---------------- */
function MeetTheTeam() {
  return (
    <section className="section bg-cream">
      <div className="container-x grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="relative">
          <img src="/photos/crew-shingles.png" alt="Brad and the A&B Home Improvement crew on a roof" className="rounded-3xl shadow-lift w-full object-cover aspect-[4/5] max-h-[560px]" />
          <div className="absolute -bottom-5 right-4 sm:right-8 bg-white rounded-2xl shadow-card px-5 py-4 flex items-center gap-3 border border-black/5">
            <span className="grid place-items-center w-11 h-11 rounded-full bg-brand text-white font-display font-extrabold">B</span>
            <div>
              <div className="font-display font-extrabold text-ink leading-tight">Brad</div>
              <div className="text-[12px] text-slatey">Owner · on every job</div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Meet the team</p>
          <h2 className="text-4xl md:text-5xl text-ink">Real people. Real work. Right here in Shelby Township.</h2>
          <div className="mt-6 space-y-4 text-slatey text-lg leading-relaxed">
            <p>A&amp;B started the honest way — showing up on time, doing the job right, and treating every home like it's our own. No pushy sales, no crews that vanish halfway through.</p>
            <p>When you call, you get Brad and a crew that's been doing this for years. We'll walk your roof with you, tell you straight what it needs, and give you a fair price.</p>
          </div>
          <p className="font-hand text-4xl text-brand mt-6 leading-none">— Brad &amp; the A&amp;B crew</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-ink">
            <span className="inline-flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-brand" /> Family owned</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" /> Licensed &amp; insured</span>
            <span className="inline-flex items-center gap-2"><Star className="w-4 h-4 text-brand" /> 50 five-star reviews</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href={PHONE_HREF} className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-charcoal text-white font-bold px-7 py-4 rounded-xl transition-colors"><Phone className="w-5 h-5" /> Talk to Brad</a>
            <Link to="/estimate" className="inline-flex items-center justify-center gap-2 border-2 border-black/15 hover:border-brand text-ink font-bold px-7 py-4 rounded-xl transition-colors">Get your estimate</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Areas served ---------------- */
const SERVICE_AREAS = [
  "Shelby Township", "Sterling Heights", "Warren", "Troy", "Rochester Hills", "Rochester",
  "Romeo", "Bloomfield Hills", "Utica", "Macomb Twp", "Clinton Twp", "Washington Twp",
  "Chesterfield", "Roseville", "St. Clair Shores", "Madison Heights",
];

function AreasServed() {
  return (
    <section className="section bg-white scroll-mt-20">
      <div className="container-x text-center">
        <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Service Area</p>
        <h2 className="text-4xl md:text-5xl text-ink">Proudly serving Metro Detroit</h2>
        <p className="mt-4 text-slatey text-lg max-w-2xl mx-auto">From Shelby Township to Troy, Warren to Romeo — if you're in Macomb or Oakland County, we've got your roof covered.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
          {SERVICE_AREAS.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 bg-cloud border border-black/5 rounded-full px-4 py-2 text-sm font-semibold text-ink">
              <MapPin className="w-3.5 h-3.5 text-brand" /> {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Financing ---------------- */
function Financing() {
  return (
    <section id="financing" className="section bg-ink text-white scroll-mt-20 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand/15 blur-2xl" />
      <div className="container-x relative grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-brand-soft font-bold uppercase tracking-[0.2em] text-xs mb-3">Financing</p>
          <h2 className="text-4xl md:text-5xl">A new roof you can actually afford.</h2>
          <p className="mt-5 text-white/75 text-lg max-w-lg">
            Don't let a big number stop you from protecting your home. We offer flexible monthly
            financing with quick approvals — get the roof you need now and pay over time.
          </p>
          <ul className="mt-7 space-y-3">
            {["Low monthly payments", "Fast, easy approval", "Ask about $0-down plans", "No prepayment penalties"].map((x) => (
              <li key={x} className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-brand-soft shrink-0" /> {x}</li>
            ))}
          </ul>
          <Link to="/estimate" className="mt-8 inline-flex items-center gap-2 bg-brand hover:bg-brand-dark font-bold px-7 py-4 rounded-xl shadow-brand transition-colors">
            See my financing options <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <Wallet className="w-10 h-10 text-brand-soft" />
            <span className="inline-flex items-center gap-1.5 bg-brand-soft/15 text-brand-soft text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">$0 Down Available</span>
          </div>
          <div className="mt-4 font-display text-2xl font-extrabold">Example payments</div>
          <p className="text-white/60 mt-2 text-sm">On a <b className="text-white">$10,000</b> roof — the longer the term, the lower the monthly.</p>
          <div className="mt-6 space-y-3">
            {[
              ["12 months", "Pay it off fast", "≈ $900/mo"],
              ["24 months", "Balanced & popular", "≈ $485/mo"],
              ["60 months", "Lowest monthly payment", "≈ $237/mo"],
            ].map(([term, tag, note]) => (
              <div key={term} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3.5 border border-white/10">
                <div>
                  <div className="font-display font-extrabold text-brand-soft">{term}</div>
                  <div className="text-[11px] text-white/55 mt-0.5">{tag}</div>
                </div>
                <div className="font-display font-extrabold text-white text-right">{note}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/45 mt-4 leading-relaxed">Example only, based on ~14.99% APR on a $10,000 project. Your actual rate (0–36% APR), term, and monthly payment depend on the amount financed and credit approval through Affirm or Klarna. $0-down options available.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Get started (3 paths) ---------------- */
function GetStarted() {
  const [visit, setVisit] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [when, setWhen] = useState("");
  const field = "w-full rounded-lg bg-white border border-black/10 px-4 py-3 text-sm text-ink placeholder:text-slatey/50 focus:outline-none focus:border-brand transition";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    submitLead({ name, phone, address, service: "In-home inspection request", message: when ? `Preferred time: ${when}` : "" });
    setDone(true);
  };
  return (
    <section id="get-started" className="section bg-cream scroll-mt-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Get Started</p>
          <h2 className="text-4xl md:text-5xl text-ink">How would you like to begin?</h2>
          <p className="mt-4 text-slatey text-lg">Pick whatever's easiest — no pressure, no obligation.</p>
          <div className="mt-5 inline-flex items-center gap-2 bg-brand/10 border border-brand/25 rounded-full px-4 py-2 text-sm font-bold text-brand-dark">
            <Wallet className="w-4 h-4 text-brand" /> $0-Down financing available on every option — pay monthly with Affirm or Klarna
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`rounded-3xl border p-7 transition-all ${visit ? "border-brand bg-white shadow-lift" : "bg-white border-black/5 shadow-card hover:shadow-lift hover:-translate-y-1"}`}>
            <div className="w-12 h-12 rounded-xl grid place-items-center mb-4 bg-brand/10 text-brand"><Calendar className="w-6 h-6" /></div>
            <h3 className="font-display text-xl font-extrabold text-ink">Book a home visit</h3>
            <p className="text-sm text-slatey mt-1.5 leading-relaxed">Brad comes out, inspects your roof in person, and gives you an <b className="text-ink">exact quote</b> — free.</p>
            <button onClick={() => setVisit(true)} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-3 rounded-lg transition-colors">Schedule my visit <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="rounded-3xl bg-white border border-black/5 shadow-card hover:shadow-lift hover:-translate-y-1 transition-all p-7">
            <div className="w-12 h-12 rounded-xl grid place-items-center mb-4 bg-brand/10 text-brand"><Calculator className="w-6 h-6" /></div>
            <h3 className="font-display text-xl font-extrabold text-ink">Get a quick estimate</h3>
            <p className="text-sm text-slatey mt-1.5 leading-relaxed">Leave your info or use our instant estimator — we'll follow up with a ballpark, usually same day.</p>
            <Link to="/estimate" className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-ink hover:bg-charcoal text-white font-bold px-5 py-3 rounded-lg transition-colors">Get my estimate <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="rounded-3xl bg-ink text-white shadow-lift p-7 relative overflow-hidden">
            <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-brand/20 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl grid place-items-center mb-4 bg-white/10 text-brand-soft"><Phone className="w-6 h-6" /></div>
              <h3 className="font-display text-xl font-extrabold">Call us now</h3>
              <p className="text-sm text-white/70 mt-1.5 leading-relaxed">Want it handled ASAP? Skip the forms and talk to us directly — a real person picks up.</p>
              <a href={PHONE_HREF} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-3 rounded-lg transition-colors"><Phone className="w-4 h-4" /> {PHONE}</a>
            </div>
          </div>
        </div>
        {visit && (
          <div className="mt-6 max-w-2xl mx-auto bg-white rounded-3xl border border-black/5 shadow-lift p-7 md:p-9">
            {done ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-brand mx-auto mb-3" />
                <div className="font-display text-2xl font-extrabold text-ink">Visit requested{name ? `, ${name.split(" ")[0]}` : ""}!</div>
                <p className="text-slatey mt-1">Brad will reach out to lock in a time that works for you.</p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-extrabold text-ink">Schedule your free in-home inspection</h3>
                <p className="text-slatey text-sm mt-1">Tell us where and when — Brad will confirm.</p>
                <form onSubmit={submit} className="mt-5 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className={field} />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" placeholder="Phone" className={field} />
                  </div>
                  <AddressAutocomplete value={address} onChange={setAddress} onSelect={setAddress} />
                  <select value={when} onChange={(e) => setWhen(e.target.value)} className={field}>
                    <option value="">Preferred time (optional)</option>
                    <option>As soon as possible</option>
                    <option>Weekday morning</option>
                    <option>Weekday afternoon</option>
                    <option>Weekday evening</option>
                    <option>Weekend</option>
                  </select>
                  <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3.5 rounded-lg transition-colors">Request my visit <ArrowRight className="w-4 h-4" /></button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Contact ---------------- */
function ContactForm() {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  if (done) {
    return (
      <div className="mt-6 rounded-xl bg-brand/10 border border-brand/25 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-brand mx-auto mb-3" />
        <div className="font-bold text-xl text-ink">Request sent!</div>
        <p className="text-slatey mt-1">We'll reach out shortly to schedule your free estimate.</p>
      </div>
    );
  }
  const field = "w-full rounded-lg bg-cloud border border-black/10 px-4 py-3 text-sm text-ink placeholder:text-slatey/50 focus:outline-none focus:border-brand focus:bg-white transition";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&t=k&z=20&output=embed`;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitLead({ name, phone, address, message, service: "Contact form" });
        setDone(true);
      }}
      className="mt-6 space-y-3"
    >
      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Name" className={field} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" placeholder="Phone" className={field} />
      <AddressAutocomplete value={address} onChange={setAddress} onSelect={setAddress} />
      {address.trim().length > 6 && (
        <div className="rounded-lg overflow-hidden border border-black/10 shadow-sm">
          <iframe title="Your property from above" src={mapSrc} className="w-full h-44 border-0" loading="lazy" />
          <p className="text-[11px] text-slatey/70 px-3 py-2 bg-cloud">📍 That's your roof — we'll measure it exactly on your free inspection.</p>
        </div>
      )}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="What do you need? (e.g. new roof, leak repair, gutters)" className={field} />
      <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3.5 rounded-lg transition-colors">
        Get My Free Estimate <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

function Contact() {
  return (
    <section id="contact" className="section bg-cream scroll-mt-20">
      <div className="container-x grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Get In Touch</p>
          <h2 className="text-4xl md:text-5xl text-ink">Free estimates, 7 days a week.</h2>
          <p className="font-hand text-3xl text-brand mt-3 leading-none">a real person picks up — promise.</p>
          <p className="mt-5 text-slatey text-lg">
            Run by Brad and a hard-working local crew, A&amp;B has earned <b className="text-ink">50 five-star reviews</b> the
            honest way — showing up on time, doing the job right, and treating your home like our own.
            Roofing is what we do best, but we handle the whole house. Give us a call, shoot us a text,
            or grab your instant estimate online — whatever's easiest for you.
          </p>
          <div className="mt-8 space-y-3">
            <a href={PHONE_HREF} className="flex items-center gap-4 bg-cloud rounded-2xl p-5 border border-black/5 hover:shadow-card transition">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand/10 text-brand"><Phone className="w-5 h-5" /></span>
              <div><div className="text-[11px] font-bold uppercase tracking-wider text-slatey">Call or Text</div><div className="font-display text-lg font-extrabold text-ink">{PHONE}</div></div>
            </a>
            <div className="flex items-center gap-4 bg-cloud rounded-2xl p-5 border border-black/5">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand/10 text-brand"><MapPin className="w-5 h-5" /></span>
              <div><div className="text-[11px] font-bold uppercase tracking-wider text-slatey">Service Area</div><div className="font-bold text-ink">{ADDRESS}</div></div>
            </div>
            <div className="flex items-center gap-4 bg-cloud rounded-2xl p-5 border border-black/5">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand/10 text-brand"><Clock className="w-5 h-5" /></span>
              <div><div className="text-[11px] font-bold uppercase tracking-wider text-slatey">Hours</div><div className="font-bold text-ink">Open 24 Hours · 7 Days a Week</div></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lift border border-black/5 border-t-4 border-t-brand p-8">
          <div className="flex items-center gap-2 text-brand text-[11px] font-bold uppercase tracking-[0.2em] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" /> Free · No Obligation
          </div>
          <h3 className="font-display text-2xl font-extrabold text-ink">Request your free estimate</h3>
          <p className="text-slatey text-sm mt-1">We'll get back to you fast — usually the same day.</p>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA band ---------------- */
function CtaBand() {
  return (
    <section className="bg-brand text-white">
      <div className="container-x py-14 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold">Ready for your free estimate?</h2>
          <p className="mt-2 text-white/85 text-lg">See your roof from above and get an instant price — no pressure.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link to="/estimate" className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-charcoal text-white font-bold px-7 py-4 rounded-xl transition-colors">
            <Calculator className="w-5 h-5" /> Get My Instant Estimate
          </Link>
          <a href={PHONE_HREF} className="inline-flex items-center justify-center gap-2 border-2 border-white/50 hover:bg-white hover:text-brand font-bold px-7 py-4 rounded-xl transition-all">
            <Phone className="w-5 h-5" /> {PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="bg-ink text-white/70 border-t border-white/10">
      <div className="container-x py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="mb-4">
            <Logo h="h-14" chip />
          </div>
          <p className="text-sm">Roofing-first home improvement · Shelby Township, MI · Licensed &amp; Insured · Family owned.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-3">Explore</h4>
          <ul className="space-y-1.5 text-sm">
            {[["Services", "/services"], ["Gallery", "/gallery"], ["Instant Estimate", "/estimate"], ["Reviews", "/reviews"], ["Contact", "/contact"]].map(([l, h]) => (
              <li key={h}><Link to={h} className="hover:text-brand-soft">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li><a href={PHONE_HREF} className="hover:text-brand-soft flex items-center gap-2"><Phone className="w-4 h-4" /> {PHONE}</a></li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> {ADDRESS}</li>
            <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Open 24 Hours</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} A&amp;B Home Improvement LLC · All rights reserved.
      </div>
    </footer>
  );
}

/* ---------------- Page header (for interior pages) ---------------- */
function PageHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <section className="bg-ink text-white pt-16 pb-14">
      <div className="container-x text-center max-w-2xl mx-auto">
        <p className="text-brand-soft font-bold uppercase tracking-[0.2em] text-xs mb-3">{label}</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold">{title}</h1>
        {sub && <p className="mt-4 text-white/70 text-lg">{sub}</p>}
      </div>
    </section>
  );
}

/* ---------------- Pages ---------------- */
function usePageMeta(title: string, desc?: string) {
  useEffect(() => {
    document.title = title;
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
  }, [title, desc]);
}

function HomePage() {
  usePageMeta("A&B Home Improvement — Roofing Done Right | Shelby Township, MI", "Metro Detroit's top-rated roofer. New roofs, repairs, gutters & siding. 4.8★ (50 reviews), licensed & insured, financing available. Free instant estimate from your address.");
  return (<><Hero /><TrustBar /><Services /><MeetTheTeam /><Reviews /><AreasServed /><GetStarted /><Contact /></>);
}
function ServicesPage() {
  usePageMeta("Roofing, Gutters & Home Services | A&B Home Improvement — Shelby Twp, MI", "Roofing, gutters, painting & more from Metro Detroit's top-rated local crew. Licensed & insured. Flexible financing available. Get a free quote today.");
  return (<><PageHead label="What We Do" title="Roofing first — and the whole house too." sub="One trusted local crew for roofing, gutters, painting, and more — with easy financing." /><Services /><Financing /><CtaBand /></>);
}
function EstimatePage() {
  usePageMeta("Free Instant Roof Estimate from Your Address | A&B Home Improvement", "See your roof from above and get an instant price range with financing — no calls, no pressure. Serving Shelby Township & Metro Detroit.");
  return (<><Estimator /></>);
}
function GalleryPage() {
  usePageMeta("Roofing Project Gallery | A&B Home Improvement — Metro Detroit", "See real roofing jobs, tear-offs, and finished shingle roofs from A&B Home Improvement across Metro Detroit.");
  return (<><PageHead label="Our Work" title="See the quality for yourself." sub="Real jobs from real Metro Detroit homeowners." /><Gallery /><CtaBand /></>);
}
function ReviewsPage() {
  usePageMeta("Reviews — 4.8★ from 50 Homeowners | A&B Home Improvement", "Read why Shelby Township homeowners rate A&B Home Improvement 4.8 stars. Top 3 Roofer 2025. Honest pricing, quality work.");
  return (<><PageHead label="Reviews" title="Trusted by 50 happy neighbors." sub="4.8 stars and a Top 3 Roofer award in Shelby Township." /><Reviews /><CtaBand /></>);
}
function ContactPage() {
  usePageMeta("Contact — Free Estimates 7 Days a Week | A&B Home Improvement", "Call, text, or message A&B Home Improvement in Shelby Township, MI. Free estimates, usually same-day response.");
  return (<><PageHead label="Get In Touch" title="Let's talk about your roof." sub="Call, text, or send us a note — we usually reply the same day." /><Contact /></>);
}
function PaySuccessPage() {
  usePageMeta("Payment received — A&B Home Improvement");
  return (
    <section className="section min-h-[60vh] grid items-center">
      <div className="container-x max-w-xl mx-auto text-center">
        <CheckCircle2 className="w-16 h-16 text-brand mx-auto mb-4" />
        <h1 className="font-display text-4xl font-extrabold text-ink">Thank you — payment received!</h1>
        <p className="mt-4 text-slatey text-lg">We've got it. Brad's team will reach out to confirm the details and get you on the schedule. A receipt is on its way to your email.</p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-7 py-4 rounded-xl shadow-brand transition-colors">Back to home <ArrowRight className="w-5 h-5" /></Link>
      </div>
    </section>
  );
}
function PayCancelPage() {
  usePageMeta("Payment canceled — A&B Home Improvement");
  return (
    <section className="section min-h-[60vh] grid items-center">
      <div className="container-x max-w-xl mx-auto text-center">
        <h1 className="font-display text-4xl font-extrabold text-ink">Payment canceled</h1>
        <p className="mt-4 text-slatey text-lg">No worries — nothing was charged. If you have any questions, give us a call and we'll help you out.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/estimate" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-7 py-4 rounded-xl shadow-brand transition-colors">Back to estimate</Link>
          <a href={PHONE_HREF} className="inline-flex items-center justify-center gap-2 border-2 border-black/15 hover:border-brand text-ink font-bold px-7 py-4 rounded-xl transition-colors"><Phone className="w-5 h-5" /> {PHONE}</a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Site layout ---------------- */
function SiteLayout() {
  return (<><Header /><main><Outlet /></main><Footer /></>);
}

/* ---------------- Admin dashboard ---------------- */
type PipeRow = { name: string; address: string; service: string; est: number; cost: number; plan: string; paid: string; status: string; date: string };
const LEADS: PipeRow[] = [
  {
    name: "Sarah Whitmore", address: "57559 Yorkshire Dr, Shelby Twp", service: "Full Roof Replacement",
    est: 14200, cost: 8600, plan: "24-mo financing", paid: "Financing (approved)", status: "Won", date: "Jun 26",
  },
  {
    name: "Mike Delgado", address: "1204 Rochester Rd, Rochester Hills", service: "Gutters + Siding",
    est: 6800, cost: 4100, plan: "$0-down · 12-mo", paid: "Card (deposit)", status: "In Progress", date: "Jun 28",
  },
  {
    name: "The Hendersons", address: "8890 24 Mile Rd, Macomb", service: "Roof Leak Repair",
    est: 2400, cost: 1150, plan: "Paid in full", paid: "Check", status: "New Lead", date: "Jun 30",
  },
];

const statusStyle: Record<string, string> = {
  "Won": "bg-green-100 text-green-700",
  "In Progress": "bg-brand/15 text-brand-dark",
  "New Lead": "bg-blue-100 text-blue-700",
};

function InvoiceGenerator() {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const gen = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(""); setLink(""); setCopied(false);
    const { url, error } = await startCheckout({ mode: "invoice", amount: Number(amount), description: desc, email });
    if (url) setLink(url); else setErr(error || "Could not create link.");
    setLoading(false);
  };
  const copy = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const field = "w-full rounded-lg bg-cloud border border-black/10 px-4 py-3 text-sm text-ink placeholder:text-slatey/50 focus:outline-none focus:border-brand focus:bg-white transition";

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-card p-6">
      <div className="flex items-center gap-2 text-brand"><CreditCard className="w-5 h-5" /><h2 className="font-display text-xl font-extrabold text-ink">Create a payment link</h2></div>
      <p className="text-sm text-slatey mt-1">Enter the price you quoted → get a link to text or email the client. They pay by card, or monthly with Affirm / Klarna. Link never expires.</p>
      <form onSubmit={gen} className="mt-4 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slatey mb-1.5">Amount (USD)</label>
          <input required type="number" min={1} max={100000} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="9000" className={field} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slatey mb-1.5">Client email (optional)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slatey mb-1.5">Description</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Full roof replacement — 123 Main St, Shelby Twp" className={field} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-60">
            {loading ? "Creating link…" : "Generate payment link"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      {link && (
        <div className="mt-4 rounded-xl bg-cloud border border-black/10 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slatey mb-1.5">Payment link — send this to the client</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly value={link} className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink" onFocus={(e) => e.target.select()} />
            <button onClick={copy} className="inline-flex items-center justify-center gap-1.5 bg-ink hover:bg-charcoal text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
              {copied ? <><CheckCircle2 className="w-4 h-4" /> Copied</> : "Copy"}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 border border-black/10 hover:border-brand text-ink font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">Open</a>
          </div>
        </div>
      )}
    </div>
  );
}

type RealLead = { id?: string | number; name?: string; phone?: string; email?: string; address?: string; service?: string; message?: string; estimate?: string; created_at?: string };

function AdminLogin({ value, onChange, onSubmit, err, loading }: { value: string; onChange: (v: string) => void; onSubmit: () => void; err: string; loading: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="min-h-screen bg-cream grid place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lift border border-black/5 p-8">
          <div className="flex justify-center mb-6"><Logo h="h-12" /></div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Sign in</h1>
          <p className="text-slatey text-sm mt-1">Owner dashboard — enter your password to continue.</p>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mt-6 space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slatey/50" />
              <input autoFocus type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Password" className="w-full rounded-lg bg-cloud border border-black/10 pl-10 pr-10 py-3.5 text-sm text-ink placeholder:text-slatey/50 focus:outline-none focus:border-brand focus:bg-white transition" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slatey/50 hover:text-ink" aria-label="Toggle password">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-ink hover:bg-charcoal text-white font-bold px-6 py-3.5 rounded-lg transition-colors disabled:opacity-60">
              {loading ? "Signing in…" : "Log in"}
            </button>
            {err && <p className="text-[13px] text-red-600 text-center">{err}</p>}
          </form>
        </div>
        <a href="https://www.abroofingmi.com" className="mt-5 flex items-center justify-center gap-1.5 text-sm text-slatey hover:text-ink"><ArrowLeft className="w-4 h-4" /> Back to site</a>
      </div>
    </div>
  );
}

function AdminPage() {
  const money = (n: number) => "$" + n.toLocaleString();

  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [realLeads, setRealLeads] = useState<RealLead[]>([]);
  const [configured, setConfigured] = useState(false);

  // Editable pipeline — Brad can change any price/cost/status and the whole dashboard updates live.
  const [rows, setRows] = useState<PipeRow[]>(() => LEADS.map((l) => ({ ...l })));
  const [editing, setEditing] = useState(false);
  const updateRow = (i: number, patch: Partial<PipeRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const numCls = "w-24 rounded-md border border-black/15 px-2 py-1 text-sm text-right focus:outline-none focus:border-brand";
  const txtCls = "w-full min-w-[110px] rounded-md border border-black/15 px-2 py-1 text-sm focus:outline-none focus:border-brand";
  const pipeline = rows.reduce((s, l) => s + l.est, 0);
  const totalMargin = rows.reduce((s, l) => s + (l.est - l.cost), 0);
  const avgMargin = pipeline ? Math.round((totalMargin / pipeline) * 100) : 0;

  const verify = async (k: string, silent = false) => {
    setLoading(true); if (!silent) setErr("");
    try {
      const r = await fetch("/api/leads", { headers: { "x-admin-key": k } });
      if (r.status === 401) { setErr("Wrong password."); sessionStorage.removeItem("ab_admin_key"); setLoading(false); return; }
      if (r.status === 503) { setErr("Admin isn't set up yet — add ADMIN_PASSWORD in Vercel."); setLoading(false); return; }
      const d = await r.json();
      sessionStorage.setItem("ab_admin_key", k);
      setRealLeads(Array.isArray(d.leads) ? d.leads : []);
      setConfigured(!!d.configured);
      setAuthed(true);
    } catch { setErr("Couldn't connect — try again."); }
    setLoading(false);
  };
  useEffect(() => { const s = sessionStorage.getItem("ab_admin_key"); if (s) verify(s, true); }, []);
  const logout = () => { sessionStorage.removeItem("ab_admin_key"); setAuthed(false); setPw(""); };
  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  const kpis = [
    { icon: Users, label: "Active Leads", value: String(LEADS.length), sub: "3 new this week", tone: "text-brand" },
    { icon: DollarSign, label: "Pipeline Value", value: money(pipeline), sub: "across all open jobs", tone: "text-green-600" },
    { icon: TrendingUp, label: "Total Margin", value: money(totalMargin), sub: "estimated profit", tone: "text-brand" },
    { icon: Percent, label: "Avg Margin", value: avgMargin + "%", sub: "healthy & on target", tone: "text-green-600" },
  ];

  if (!authed) return <AdminLogin value={pw} onChange={setPw} onSubmit={() => verify(pw)} err={err} loading={loading} />;

  return (
    <div className="min-h-screen bg-cloud">
      {/* Admin top bar */}
      <div className="bg-ink text-white">
        <div className="container-x flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Logo h="h-9" chip />
            <span className="font-display font-extrabold text-lg hidden sm:block">Owner <span className="text-brand-soft">Dashboard</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.abroofingmi.com" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to site
            </a>
            <button onClick={logout} className="text-sm font-semibold text-white/70 hover:text-white">Log out</button>
            <div className="flex items-center gap-2.5 pl-4 border-l border-white/15">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-brand text-white font-bold text-sm">B</span>
              <div className="leading-tight">
                <div className="text-sm font-bold">Brad</div>
                <div className="text-[11px] text-white/55">Owner</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-x py-8">
        <div className="flex items-center gap-2 mb-1 text-brand"><LayoutDashboard className="w-5 h-5" /><span className="font-bold uppercase tracking-wider text-xs">Dashboard</span></div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Welcome back, Brad</h1>
        <p className="text-slatey mt-1">Here's how your jobs and leads are looking.</p>

        {/* Real website leads */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-card mt-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">New Website Leads</h2>
              <p className="text-sm text-slatey">Live — every estimator + contact submission lands here.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live</span>
          </div>
          {realLeads.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Users className="w-8 h-8 text-slatey/40 mx-auto mb-2" />
              <p className="text-slatey font-semibold">No leads yet</p>
              <p className="text-sm text-slatey/70 mt-1">{configured ? "They'll appear here the moment someone submits the estimator or contact form." : "Connect the database (Supabase) to start saving leads — until then, leads still email Brad via Formspree."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slatey/70 bg-cloud">
                    <th className="px-6 py-3 font-bold">Customer</th>
                    <th className="px-4 py-3 font-bold">Contact</th>
                    <th className="px-4 py-3 font-bold">Service / Interest</th>
                    <th className="px-4 py-3 font-bold">Estimate</th>
                    <th className="px-4 py-3 font-bold">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {realLeads.map((l, i) => (
                    <tr key={l.id ?? i} className="hover:bg-cloud/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink">{l.name || "—"}</div>
                        {l.address && <div className="text-[12px] text-slatey flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {l.address}</div>}
                      </td>
                      <td className="px-4 py-4 text-slatey">
                        {l.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-brand" /> {l.phone}</div>}
                        {l.email && <div className="text-[12px] text-slatey/70 mt-0.5">{l.email}</div>}
                      </td>
                      <td className="px-4 py-4 text-slatey">{l.service || "—"}{l.message && <div className="text-[12px] text-slatey/60 mt-0.5 max-w-xs truncate">{l.message}</div>}</td>
                      <td className="px-4 py-4 font-bold text-ink">{l.estimate || "—"}</td>
                      <td className="px-4 py-4 text-slatey/70 text-[13px]">{fmtDate(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-8 mb-4 inline-block text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Below: sample pipeline showing cost / margin tracking</p>

        {/* KPI cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-black/5 shadow-card p-5">
              <div className="flex items-center justify-between">
                <span className={`grid place-items-center w-10 h-10 rounded-xl bg-cloud ${k.tone}`}><k.icon className="w-5 h-5" /></span>
              </div>
              <div className="mt-4 font-display text-3xl font-extrabold text-ink">{k.value}</div>
              <div className="text-sm font-bold text-slatey mt-0.5">{k.label}</div>
              <div className="text-[12px] text-slatey/70 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Invoice / payment-link generator */}
        <div className="mt-8">
          <InvoiceGenerator />
        </div>

        {/* Leads table */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-card mt-8 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">Leads &amp; Jobs</h2>
              <p className="text-sm text-slatey">Edit any price, cost, or status — the totals above update instantly.</p>
            </div>
            <button onClick={() => setEditing((e) => !e)} className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg transition-colors ${editing ? "bg-brand text-white hover:bg-brand-dark" : "bg-cloud text-ink hover:bg-black/5"}`}>
              {editing ? <><CheckCircle2 className="w-4 h-4" /> Done</> : "Edit prices"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slatey/70 bg-cloud">
                  <th className="px-6 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Service</th>
                  <th className="px-4 py-3 font-bold text-right">Estimate</th>
                  <th className="px-4 py-3 font-bold text-right">Cost</th>
                  <th className="px-4 py-3 font-bold text-right">Margin</th>
                  <th className="px-4 py-3 font-bold">Payment Plan</th>
                  <th className="px-4 py-3 font-bold">Paid Via</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.map((l, i) => {
                  const margin = l.est - l.cost;
                  const pct = l.est ? Math.round((margin / l.est) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-cloud/60 transition-colors align-top">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink">{l.name}</div>
                        <div className="text-[12px] text-slatey flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {l.address}</div>
                        <div className="text-[11px] text-slatey/60 mt-0.5">{l.date}</div>
                      </td>
                      <td className="px-4 py-4 text-slatey">{l.service}</td>
                      <td className="px-4 py-4 text-right font-bold text-ink">
                        {editing ? <input type="number" value={l.est} onChange={(e) => updateRow(i, { est: +e.target.value })} className={numCls} /> : money(l.est)}
                      </td>
                      <td className="px-4 py-4 text-right text-slatey">
                        {editing ? <input type="number" value={l.cost} onChange={(e) => updateRow(i, { cost: +e.target.value })} className={numCls} /> : money(l.cost)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>{money(margin)}</div>
                        <div className="text-[11px] text-slatey/70">{pct}% margin</div>
                      </td>
                      <td className="px-4 py-4">
                        {editing ? <input value={l.plan} onChange={(e) => updateRow(i, { plan: e.target.value })} className={txtCls} /> : <span className="inline-flex items-center gap-1.5 text-slatey"><Wallet className="w-3.5 h-3.5 text-brand" /> {l.plan}</span>}
                      </td>
                      <td className="px-4 py-4">
                        {editing ? <input value={l.paid} onChange={(e) => updateRow(i, { paid: e.target.value })} className={txtCls} /> : <span className="inline-flex items-center gap-1.5 text-slatey"><CreditCard className="w-3.5 h-3.5 text-brand" /> {l.paid}</span>}
                      </td>
                      <td className="px-4 py-4">
                        {editing ? (
                          <select value={l.status} onChange={(e) => updateRow(i, { status: e.target.value })} className={txtCls}>
                            <option>New Lead</option><option>In Progress</option><option>Won</option>
                          </select>
                        ) : <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded-full ${statusStyle[l.status]}`}>{l.status}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[12px] text-slatey/60 mt-6">This is a live preview of the owner dashboard. When we go live, every estimate submitted on the site drops in here automatically, and you'll be able to update statuses, costs, and export reports.</p>
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
// The admin.abroofingmi.com subdomain serves the private dashboard at its root.
const IS_ADMIN_HOST = typeof window !== "undefined" && window.location.hostname.startsWith("admin.");

export default function App() {
  if (IS_ADMIN_HOST) {
    return (
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="*" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    );
  }
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/estimate" element={<EstimatePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pay/success" element={<PaySuccessPage />} />
          <Route path="/pay/cancel" element={<PayCancelPage />} />
        </Route>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
