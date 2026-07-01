import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Phone, Star, ShieldCheck, BadgeCheck, Wallet, MapPin, Clock, ArrowRight,
  Menu, X, Home, Hammer, Droplets, PaintRoller, Wrench, Layers,
  CheckCircle2, Calculator, Sparkles, Award, ThumbsUp, ChevronRight,
  User, LayoutDashboard, DollarSign, TrendingUp, Users, CreditCard, ArrowLeft, Percent,
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
    ["Services", "/services"],
    ["Estimate", "/estimate"],
    ["Gallery", "/gallery"],
    ["Reviews", "/reviews"],
    ["Financing", "/financing"],
    ["Contact", "/contact"],
  ];
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-colors ${isActive ? "text-brand" : "text-slatey hover:text-ink"}`;
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="container-x flex items-center justify-between h-[108px]">
        <Link to="/" className="flex items-center gap-3">
          <Logo h="h-[88px]" />
          <span className="hidden sm:block leading-none border-l border-black/10 pl-3">
            <span className="block text-xs font-bold text-brand uppercase tracking-[0.18em]">Roofing Done Right</span>
            <span className="block text-[11px] font-semibold text-slatey uppercase tracking-[0.14em] mt-1">Shelby Twp, MI</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {nav.map(([l, h]) => (
            <NavLink key={h} to={h} className={linkCls}>{l}</NavLink>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <a href={PHONE_HREF} className="flex items-center gap-2 text-sm font-bold text-ink">
            <Phone className="w-4 h-4 text-brand" /> {PHONE}
          </a>
          <Link to="/estimate" className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-brand transition-colors">
            Free Estimate
          </Link>
          <Link to="/admin" title="Admin dashboard" className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-black/10 hover:border-brand hover:bg-cloud transition-colors">
            <span className="grid place-items-center w-7 h-7 rounded-full bg-ink text-white"><User className="w-4 h-4" /></span>
            <span className="text-sm font-bold text-ink">Admin</span>
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
              <NavLink key={h} to={h} onClick={() => setOpen(false)} className="py-2.5 font-semibold text-slatey">{l}</NavLink>
            ))}
            <Link to="/admin" onClick={() => setOpen(false)} className="py-2.5 font-semibold text-slatey flex items-center gap-2"><User className="w-4 h-4" /> Admin Dashboard</Link>
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
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
const MATERIALS = [
  { key: "arch", label: "Architectural Shingles", note: "Most popular", low: 4.75, high: 6.25 },
  { key: "3tab", label: "3-Tab Shingles", note: "Budget-friendly", low: 3.5, high: 4.5 },
  { key: "premium", label: "Premium / Designer Shingles", note: "Top-tier curb appeal", low: 6.5, high: 9 },
  { key: "flat", label: "Flat / Rubber (EPDM)", note: "Low-slope roofs", low: 5.5, high: 8 },
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
  const [size, setSize] = useState(2000);
  const [mat, setMat] = useState("arch");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  const m = MATERIALS.find((x) => x.key === mat)!;
  const low = Math.round((size * m.low) / 100) * 100;
  const high = Math.round((size * m.high) / 100) * 100;
  const mid = Math.round((low + high) / 2);
  const monthly = Math.round(mid / 60);
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
                  <div className="text-sm">Financing from <b className="text-brand-soft text-base">{fmt(monthly)}/mo</b></div>
                  <div className="text-[11px] text-white/50">Flexible plans · quick approval · $0-down options</div>
                </div>
              </div>

              {done ? (
                <div className="mt-4 rounded-xl bg-brand/15 border border-brand/30 p-5 text-center">
                  <CheckCircle2 className="w-9 h-9 text-brand-soft mx-auto mb-2" />
                  <div className="font-bold text-lg">You're all set{name ? `, ${name.split(" ")[0]}` : ""}!</div>
                  <p className="text-sm text-white/70 mt-1">We'll confirm your exact roof measurement and call with your final quote.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="mt-4 flex flex-col gap-2.5">
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
  { icon: Home, t: "Roofing", d: "New roofs, full replacements, tear-offs & repairs. Shingle specialists.", big: true },
  { icon: Droplets, t: "Gutters", d: "Seamless gutters, guards & downspouts to protect your home." },
  { icon: Layers, t: "Siding", d: "Vinyl & fiber-cement siding that lasts and looks sharp." },
  { icon: PaintRoller, t: "Painting", d: "Interior & exterior painting, clean lines, quality finish." },
  { icon: Hammer, t: "Drywall", d: "Repairs, patches, new walls & ceilings — smooth results." },
  { icon: Wrench, t: "Plumbing", d: "Repairs and fixes for everyday plumbing problems." },
];

function Services() {
  return (
    <section id="services" className="section scroll-mt-20">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12">
          <div className="max-w-xl">
            <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">What We Do</p>
            <h2 className="text-4xl md:text-5xl text-ink">Roofing first — and anything else your home needs.</h2>
          </div>
          <Link to="/estimate" className="inline-flex items-center gap-1.5 text-brand font-bold hover:gap-2.5 transition-all">
            Get a free quote <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <div key={s.t} className={`group rounded-2xl border p-6 transition-all hover:-translate-y-1 ${s.big ? "sm:col-span-2 lg:col-span-2 bg-ink text-white border-ink shadow-lift" : "bg-white border-black/5 shadow-card hover:shadow-lift"}`}>
              <div className={`w-12 h-12 rounded-xl grid place-items-center mb-4 ${s.big ? "bg-brand text-white" : "bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white"} transition-colors`}>
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className={`font-display text-xl font-extrabold mb-1.5 ${s.big ? "text-white" : "text-ink"}`}>{s.t}</h3>
              <p className={`text-sm leading-relaxed ${s.big ? "text-white/70" : "text-slatey"}`}>{s.d}</p>
              {s.big && <p className="mt-4 inline-flex items-center gap-1.5 text-brand-soft font-bold text-sm">Anything fixed — call for a quote <ArrowRight className="w-4 h-4" /></p>}
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
    <section id="gallery" className="section bg-cloud scroll-mt-20">
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
          <a href={GOOGLE_REVIEWS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-ink hover:bg-slatey text-white font-bold px-7 py-3.5 rounded-xl transition-colors">
            <Star className="w-4 h-4 fill-brand-soft text-brand-soft" /> Read all our reviews on Google <ArrowRight className="w-4 h-4" />
          </a>
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
            See my monthly payment <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <Wallet className="w-10 h-10 text-brand-soft" />
            <span className="inline-flex items-center gap-1.5 bg-brand-soft/15 text-brand-soft text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">$0 Down Available</span>
          </div>
          <div className="mt-4 font-display text-2xl font-extrabold">Pick a plan that fits your budget</div>
          <p className="text-white/60 mt-2 text-sm">Spread the cost over time. The longer the term, the lower your monthly payment. Get your exact number with the instant estimator.</p>
          <div className="mt-6 space-y-3">
            {[
              ["12 months", "Pay it off fast", "Highest monthly"],
              ["24 months", "Balanced & popular", "Lower monthly"],
              ["Up to 60 months", "Lowest monthly payment", "Most affordable"],
            ].map(([term, tag, note]) => (
              <div key={term} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3.5 border border-white/10">
                <div>
                  <div className="font-display font-extrabold text-brand-soft">{term}</div>
                  <div className="text-[11px] text-white/55 mt-0.5">{tag}</div>
                </div>
                <div className="text-[11px] text-white/45 text-right">{note}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/45 mt-4 leading-relaxed">Financing offered through our lending partners, subject to credit approval. $0-down and multiple term options available — we'll match you to the right plan.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Contact ---------------- */
function ContactForm() {
  const [done, setDone] = useState(false);
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
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="mt-6 space-y-3">
      <input required placeholder="Name" className={field} />
      <input required type="tel" placeholder="Phone" className={field} />
      <input placeholder="Property address" className={field} />
      <textarea rows={3} placeholder="What do you need? (e.g. new roof, leak repair, gutters)" className={field} />
      <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3.5 rounded-lg transition-colors">
        Get My Free Estimate <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

function Contact() {
  return (
    <section id="contact" className="section scroll-mt-20">
      <div className="container-x grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-brand font-bold uppercase tracking-[0.2em] text-xs mb-3">Get In Touch</p>
          <h2 className="text-4xl md:text-5xl text-ink">Free estimates, 7 days a week.</h2>
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
            {[["Services", "/services"], ["Instant Estimate", "/estimate"], ["Gallery", "/gallery"], ["Reviews", "/reviews"], ["Financing", "/financing"], ["Contact", "/contact"]].map(([l, h]) => (
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
function HomePage() {
  return (<><Hero /><TrustBar /><Services /><Reviews /><CtaBand /><Contact /></>);
}
function ServicesPage() {
  return (<><PageHead label="What We Do" title="Roofing first — and the whole house too." sub="One trusted local crew for roofing, gutters, siding, and more." /><Services /><CtaBand /></>);
}
function EstimatePage() {
  return (<><Estimator /></>);
}
function GalleryPage() {
  return (<><PageHead label="Our Work" title="See the quality for yourself." sub="Real jobs from real Metro Detroit homeowners." /><Gallery /><CtaBand /></>);
}
function ReviewsPage() {
  return (<><PageHead label="Reviews" title="Trusted by 50 happy neighbors." sub="4.8 stars and a Top 3 Roofer award in Shelby Township." /><Reviews /><CtaBand /></>);
}
function FinancingPage() {
  return (<><Financing /><Contact /></>);
}
function ContactPage() {
  return (<><PageHead label="Get In Touch" title="Let's talk about your roof." sub="Call, text, or send us a note — we usually reply the same day." /><Contact /></>);
}

/* ---------------- Site layout ---------------- */
function SiteLayout() {
  return (<><Header /><main><Outlet /></main><Footer /></>);
}

/* ---------------- Admin dashboard ---------------- */
const LEADS = [
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

function AdminPage() {
  const money = (n: number) => "$" + n.toLocaleString();
  const pipeline = LEADS.reduce((s, l) => s + l.est, 0);
  const totalMargin = LEADS.reduce((s, l) => s + (l.est - l.cost), 0);
  const avgMargin = Math.round((totalMargin / pipeline) * 100);

  const kpis = [
    { icon: Users, label: "Active Leads", value: String(LEADS.length), sub: "3 new this week", tone: "text-brand" },
    { icon: DollarSign, label: "Pipeline Value", value: money(pipeline), sub: "across all open jobs", tone: "text-green-600" },
    { icon: TrendingUp, label: "Total Margin", value: money(totalMargin), sub: "estimated profit", tone: "text-brand" },
    { icon: Percent, label: "Avg Margin", value: avgMargin + "%", sub: "healthy & on target", tone: "text-green-600" },
  ];

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
            <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to site
            </Link>
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
        <p className="mt-2 inline-block text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Demo data — sample leads for preview</p>

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

        {/* Leads table */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-card mt-8 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">Leads &amp; Jobs</h2>
              <p className="text-sm text-slatey">Every estimate, cost, margin, and how they paid.</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><Sparkles className="w-4 h-4" /> Auto-saved from the site</span>
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
                {LEADS.map((l) => {
                  const margin = l.est - l.cost;
                  const pct = Math.round((margin / l.est) * 100);
                  return (
                    <tr key={l.name} className="hover:bg-cloud/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink">{l.name}</div>
                        <div className="text-[12px] text-slatey flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {l.address}</div>
                        <div className="text-[11px] text-slatey/60 mt-0.5">{l.date}</div>
                      </td>
                      <td className="px-4 py-4 text-slatey">{l.service}</td>
                      <td className="px-4 py-4 text-right font-bold text-ink">{money(l.est)}</td>
                      <td className="px-4 py-4 text-right text-slatey">{money(l.cost)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-bold text-green-600">{money(margin)}</div>
                        <div className="text-[11px] text-slatey/70">{pct}% margin</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slatey"><Wallet className="w-3.5 h-3.5 text-brand" /> {l.plan}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slatey"><CreditCard className="w-3.5 h-3.5 text-brand" /> {l.paid}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded-full ${statusStyle[l.status]}`}>{l.status}</span>
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
export default function App() {
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
          <Route path="/financing" element={<FinancingPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
