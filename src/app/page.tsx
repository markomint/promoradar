'use client';
import { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const RETAILERS: Record<string, { name: string; color: string; logo: string }> = {
  Konzum: { name: "Konzum", color: "#E30613", logo: "K" },
  Spar: { name: "Spar", color: "#00843D", logo: "S" },
  Lidl: { name: "Lidl", color: "#0050AA", logo: "L" },
  Kaufland: { name: "Kaufland", color: "#E10915", logo: "Kf" },
  Plodine: { name: "Plodine", color: "#FF6B00", logo: "P" },
  Studenac: { name: "Studenac", color: "#1B3A6B", logo: "St" },
  Tommy: { name: "Tommy", color: "#C8102E", logo: "T" },
  Bipa: { name: "Bipa", color: "#E91E8C", logo: "B" },
  DM: { name: "DM", color: "#FFD700", logo: "dm" },
};

interface PromoItem {
  id: number;
  retailer: string;
  brand: string;
  article: string;
  size: string;
  category: string;
  regular_price: number | null;
  promo_price: number | null;
  discount_pct: number | null;
  share_of_page: string;
  valid_from: string;
  valid_to: string;
  scan_date: string;
  source_url: string | null;
}

const SearchIcon = () => (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>);
const ChevronDown = () => (<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>);
const DownloadIcon = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>);
const RadarIcon = () => (<svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" opacity="0.3"/><circle cx="12" cy="12" r="6" opacity="0.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" opacity="0.3"/><path d="M12 12l7-7" strokeWidth="2"/></svg>);
const MailIcon = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>);
const DbIcon = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
:root{--bg:#0B0F1A;--bg2:#111827;--card:#1A2035;--card-h:#1F2842;--bdr:#2A3550;--bdr2:#374160;--t1:#F1F5F9;--t2:#94A3B8;--t3:#64748B;--acc:#3B82F6;--grn:#10B981;--red:#EF4444;--amb:#F59E0B;--f:'DM Sans',sans-serif;--m:'Space Mono',monospace}
*{margin:0;padding:0;box-sizing:border-box}body,#root,#__next{font-family:var(--f);background:var(--bg);color:var(--t1);min-height:100vh}
.app{max-width:1440px;margin:0 auto;padding:0 24px}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--bdr);margin-bottom:24px;flex-wrap:wrap;gap:12px}
.logo{display:flex;align-items:center;gap:12px}
.logo-i{width:44px;height:44px;background:linear-gradient(135deg,var(--acc),#6366F1);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;animation:pg 3s infinite}
@keyframes pg{0%,100%{box-shadow:0 0 15px rgba(59,130,246,.3)}50%{box-shadow:0 0 30px rgba(59,130,246,.6)}}
.logo h1{font-size:22px;font-weight:700;letter-spacing:-.5px;background:linear-gradient(135deg,#fff,#94A3B8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.logo span{font-size:11px;color:var(--t3);font-family:var(--m);letter-spacing:1.5px;text-transform:uppercase}
.hdr-r{display:flex;align-items:center;gap:16px;font-size:13px;color:var(--t2)}
.live{display:flex;align-items:center;gap:6px;background:rgba(16,185,129,.12);color:var(--grn);padding:6px 14px;border-radius:20px;font:500 12px var(--m)}
.live-dot{width:7px;height:7px;background:var(--grn);border-radius:50%;animation:bk 2s infinite}
@keyframes bk{0%,100%{opacity:1}50%{opacity:.3}}
.db-badge{background:linear-gradient(135deg,#10B981,#059669);color:#fff;padding:4px 10px;border-radius:6px;font:700 10px var(--m);letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:5px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.kpi{background:var(--card);border:1px solid var(--bdr);border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:.2s}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--acc),#6366F1);opacity:0;transition:.2s}
.kpi:hover::before{opacity:1}.kpi:hover{border-color:var(--bdr2);transform:translateY(-1px)}
.kpi-l{font:400 11px var(--m);color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.kpi-v{font-size:28px;font-weight:700;letter-spacing:-1px}
.kpi-s{font-size:12px;color:var(--t2);margin-top:4px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.chip{padding:6px 14px;border-radius:20px;font:600 12px var(--f);cursor:pointer;border:1.5px solid var(--bdr);background:transparent;color:var(--t2);transition:.15s}
.chip:hover{border-color:var(--bdr2)}.chip.on{color:#fff;border-color:transparent}
.bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.srch{flex:1;min-width:260px;position:relative}
.srch svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--t3)}
.srch input{width:100%;background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:12px 16px 12px 42px;font:14px var(--f);color:var(--t1);outline:0;transition:.2s}
.srch input::placeholder{color:var(--t3)}.srch input:focus{border-color:var(--acc);box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.sel{position:relative}.sel select{appearance:none;background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:12px 36px 12px 14px;font:13px var(--f);color:var(--t1);cursor:pointer;outline:0;min-width:140px;transition:.2s}
.sel select:focus{border-color:var(--acc)}.sel svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}
.btn{display:flex;align-items:center;gap:6px;padding:11px 18px;border:1px solid var(--bdr);border-radius:10px;background:var(--card);color:var(--t1);font:500 13px var(--f);cursor:pointer;transition:.15s;white-space:nowrap}
.btn:hover{background:var(--card-h);border-color:var(--bdr2)}.btn-a{background:var(--acc);border-color:var(--acc);color:#fff}.btn-a:hover{background:#2563EB}
.tbl{background:var(--card);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;margin-bottom:24px}
.tbl-s{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
thead{background:var(--bg2);position:sticky;top:0;z-index:2}
th{padding:13px 14px;text-align:left;font:600 11px var(--m);text-transform:uppercase;letter-spacing:.8px;color:var(--t3);border-bottom:1px solid var(--bdr);white-space:nowrap;cursor:pointer;user-select:none;transition:.15s}
th:hover{color:var(--t1)}th.on{color:var(--acc)}
td{padding:11px 14px;border-bottom:1px solid rgba(42,53,80,.5);vertical-align:middle}
tr:hover td{background:rgba(59,130,246,.03)}tr:last-child td{border-bottom:0}
.rb{display:inline-flex;align-items:center;gap:8px;font-weight:600}
.rd{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:700 10px var(--m);color:#fff;flex-shrink:0}
.pc{font:600 14px var(--m)}
.pt{font-size:11px;color:var(--t2);background:rgba(148,163,184,.1);padding:3px 8px;border-radius:4px}
.sz{font:11px var(--m);color:var(--t3);background:rgba(100,116,139,.15);padding:2px 8px;border-radius:4px}
.cat-h{background:rgba(59,130,246,.1);color:var(--acc);padding:3px 8px;border-radius:4px;font:600 11px var(--m)}
.cat-p{background:rgba(168,85,247,.1);color:#A855F7;padding:3px 8px;border-radius:4px;font:600 11px var(--m)}
.tf{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--bdr);font-size:13px;color:var(--t2)}
.pg{display:flex;align-items:center;gap:6px}
.pb{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:1px solid var(--bdr);border-radius:8px;background:transparent;color:var(--t2);cursor:pointer;font:13px var(--f);transition:.15s}
.pb:hover{background:var(--card-h);color:var(--t1)}.pb.on{background:var(--acc);color:#fff;border-color:var(--acc)}
.fr{animation:rf .3s ease both}@keyframes rf{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fi .2s}@keyframes fi{from{opacity:0}}
.md{background:var(--card);border:1px solid var(--bdr);border-radius:16px;padding:32px;max-width:480px;width:90%;animation:su .25s}@keyframes su{from{transform:translateY(20px);opacity:0}}
.md h2{font-size:18px;margin-bottom:6px}.md p{font-size:13px;color:var(--t2);margin-bottom:20px}
.md input[type="email"]{width:100%;background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:12px 16px;font:14px var(--f);color:var(--t1);outline:0;margin-bottom:16px}.md input[type="email"]:focus{border-color:var(--acc)}
.ma{display:flex;gap:10px;justify-content:flex-end}
.src-note{background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(59,130,246,.08));border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:12px;color:var(--t2);line-height:1.6}
.src-note strong{color:var(--t1)}
.loading{display:flex;align-items:center;justify-content:center;padding:60px;font:14px var(--m);color:var(--t2)}
.img-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fi .2s;cursor:pointer}
.img-wrap{max-width:90vw;max-height:90vh;position:relative;animation:su .25s}
.img-wrap img{max-width:100%;max-height:85vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.img-info{position:absolute;bottom:-40px;left:0;right:0;text-align:center;color:var(--t2);font:12px var(--m)}
.img-close{position:absolute;top:-16px;right:-16px;width:36px;height:36px;border-radius:50%;background:var(--card);border:1px solid var(--bdr);color:var(--t1);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;z-index:2}
.img-close:hover{background:var(--red);border-color:var(--red)}
tr.clickable{cursor:pointer}tr.clickable:hover td{background:rgba(59,130,246,.08)}
.sop{font:11px var(--m);padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.5px}
.sop-hero{background:rgba(239,68,68,.15);color:#f87171;font-weight:700}
.sop-premium{background:rgba(245,158,11,.15);color:#fbbf24;font-weight:600}
.sop-standard{background:rgba(59,130,246,.1);color:#60a5fa}
.sop-small{background:rgba(100,116,139,.1);color:var(--t3)}
.loading-spin{width:24px;height:24px;border:3px solid var(--bdr);border-top-color:var(--acc);border-radius:50%;animation:spin 1s linear infinite;margin-right:12px}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1100px){.kpis{grid-template-columns:repeat(2,1fr)}}
@media(max-width:768px){.kpis{grid-template-columns:repeat(2,1fr)}.hdr{flex-direction:column;align-items:flex-start}.bar{flex-direction:column;align-items:stretch}.srch{min-width:unset}}
`;

function PromoRadar() {
  const [promoData, setPromoData] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [search, setSearch] = useState("");
  const [retailerFilter, setRetailerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortField, setSortField] = useState("valid_from");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewItem, setPreviewItem] = useState<PromoItem | null>(null);
  const [weekFilter, setWeekFilter] = useState("all");
  const PS = 20;

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from("promo_items")
          .select("*")
          .order("valid_from", { ascending: false })
          .limit(5000);
        if (error) throw error;
        if (data && data.length > 0) {
          setPromoData(data);
          setDbConnected(true);
        }
      } catch (err) {
        console.error("Supabase error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const data = useMemo(() => {
    let d = [...promoData];
    if (weekFilter !== "all") {
      d = d.filter(x => x.scan_date === weekFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        (x.brand || "").toLowerCase().includes(q) ||
        (x.article || "").toLowerCase().includes(q) ||
        (x.retailer || "").toLowerCase().includes(q)
      );
    }
    if (retailerFilter !== "all") {
      d = d.filter(x => x.retailer === retailerFilter);
    }
    if (categoryFilter !== "all") {
      d = d.filter(x => x.category === categoryFilter);
    }
    if (brandFilter !== "all") {
      d = d.filter(x => x.brand === brandFilter);
    }
    d.sort((a: any, b: any) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return d;
  }, [promoData, search, retailerFilter, categoryFilter, brandFilter, weekFilter, sortField, sortDir]);

  const paged = useMemo(() => {
    return data.slice((page - 1) * PS, page * PS);
  }, [data, page]);
  const tp = Math.max(1, Math.ceil(data.length / PS));
  useEffect(() => { setPage(1); }, [search, retailerFilter, categoryFilter, brandFilter, weekFilter]);

  const toggle = (f: string) => {
    if (sortField === f) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(f);
      setSortDir("desc");
    }
  };
  const Arrow = ({ f }: { f: string }) => {
    if (sortField !== f) return null;
    return <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
  };

  const cats = [...new Set(promoData.map(d => d.category).filter(Boolean))].sort();
  const brands = [...new Set(promoData.map(d => d.brand).filter(Boolean))].sort();
  const retailerNames = [...new Set(promoData.map(d => d.retailer).filter(Boolean))].sort();
  const scanWeeks = [...new Set(promoData.map(d => d.scan_date).filter(Boolean))].sort().reverse();
  const householdCount = promoData.filter(p => p.category === "Household").length;
  const personalCount = promoData.filter(p => p.category === "Personal Care").length;
  const scanDate = promoData.length > 0 ? promoData[0].scan_date || "N/A" : "N/A";
  const getRet = (name: string) => RETAILERS[name] || { name: name, color: "#666", logo: "?" };

  const exportCSV = () => {
    const h = ["Retailer","Brand","Article","Size","Category","Akcijska cijena EUR","Popust %","Share of Page","Vrijedi od","Vrijedi do"];
    const r = data.map(d => {
      const pro = d.promo_price ? d.promo_price.toString() : "";
      const disc = d.discount_pct ? "-" + d.discount_pct + "%" : "";
      return [d.retailer, d.brand, d.article, d.size || "", d.category || "", pro, disc, d.share_of_page || "", d.valid_from || "", d.valid_to || ""];
    });
    const csv = [h, ...r].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promoradar-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo">
            <div className="logo-i"><RadarIcon /></div>
            <div>
              <h1>PromoRadar</h1>
              <span>Household & Personal Care — Croatia</span>
            </div>
          </div>
          <div className="hdr-r">
            {dbConnected && <span className="db-badge"><DbIcon /> LIVE</span>}
            <div className="live"><div className="live-dot" />Scan {scanDate}</div>
          </div>
        </header>

        {dbConnected && (
          <div className="src-note">
            <strong>Household & Personal Care promo tracking</strong> — {promoData.length} proizvoda iz {retailerNames.length} retailera. Samo katalozi od veljače 2026. Automatsko osvježavanje svakog četvrtka.
          </div>
        )}

        {loading ? (
          <div className="loading"><div className="loading-spin"></div>Učitavam...</div>
        ) : (
          <>
            <div className="kpis">
              <div className="kpi">
                <div className="kpi-l">Retailers</div>
                <div className="kpi-v">{retailerNames.length}</div>
                <div className="kpi-s">Aktivni retaileri</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Household</div>
                <div className="kpi-v" style={{ color: "var(--acc)" }}>{householdCount}</div>
                <div className="kpi-s">Deterdženti, čišćenje, papir</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Personal Care</div>
                <div className="kpi-v" style={{ color: "#A855F7" }}>{personalCount}</div>
                <div className="kpi-s">Šamponi, gelovi, kreme</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Brendovi</div>
                <div className="kpi-v">{brands.length}</div>
                <div className="kpi-s">Unique brands tracked</div>
              </div>
            </div>

            <div className="chips">
              <button className={"chip" + (retailerFilter === "all" ? " on" : "")} style={retailerFilter === "all" ? { background: "var(--acc)" } : {}} onClick={() => setRetailerFilter("all")}>Svi</button>
              {retailerNames.map(name => {
                const r = getRet(name);
                return <button key={name} className={"chip" + (retailerFilter === name ? " on" : "")} style={retailerFilter === name ? { background: r.color } : {}} onClick={() => setRetailerFilter(retailerFilter === name ? "all" : name)}>{r.name}</button>;
              })}
            </div>

            <div className="bar">
              <div className="srch"><SearchIcon /><input placeholder="Pretraga po brendu ili artiklu..." value={search} onChange={e => setSearch(e.target.value)} /></div>
              <div className="sel">
                <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)}>
                  <option value="all">Svi tjedni</option>
                  {scanWeeks.map(w => <option key={w} value={w}>Scan {w}</option>)}
                </select>
                <ChevronDown />
              </div>
              <div className="sel">
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="all">Sve kategorije</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown />
              </div>
              <div className="sel">
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                  <option value="all">Svi brendovi</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown />
              </div>
              <button className="btn" onClick={exportCSV}><DownloadIcon />CSV</button>
              <button className="btn btn-a" onClick={() => setShowModal(true)}><MailIcon />Pretplata</button>
            </div>

            <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 12, fontFamily: "var(--m)" }}>{data.length} artikala</div>

            <div className="tbl"><div className="tbl-s">
              <table><thead><tr>
                <th className={sortField === "valid_from" ? "on" : ""} onClick={() => toggle("valid_from")}>Datum<Arrow f="valid_from" /></th>
                <th className={sortField === "retailer" ? "on" : ""} onClick={() => toggle("retailer")}>Retailer<Arrow f="retailer" /></th>
                <th className={sortField === "brand" ? "on" : ""} onClick={() => toggle("brand")}>Brand<Arrow f="brand" /></th>
                <th className={sortField === "article" ? "on" : ""} onClick={() => toggle("article")}>Artikl<Arrow f="article" /></th>
                <th>Size</th>
                <th className={sortField === "category" ? "on" : ""} onClick={() => toggle("category")}>Kategorija<Arrow f="category" /></th>
                <th className={sortField === "promo_price" ? "on" : ""} onClick={() => toggle("promo_price")}>Akcijska cijena<Arrow f="promo_price" /></th>
                <th className={sortField === "discount_pct" ? "on" : ""} onClick={() => toggle("discount_pct")}>Popust %<Arrow f="discount_pct" /></th>
                <th className={sortField === "share_of_page" ? "on" : ""} onClick={() => toggle("share_of_page")}>Share of Page<Arrow f="share_of_page" /></th>
              </tr></thead>
              <tbody>{paged.map((item, i) => {
                const r = getRet(item.retailer);
                const catClass = item.category === "Household" ? "cat-h" : "cat-p";
                const hasImg = !!item.source_url;
                return (
                  <tr key={item.id} className={"fr" + (hasImg ? " clickable" : "")} style={{ animationDelay: i * 15 + "ms" }} onClick={() => hasImg && setPreviewItem(item)}>
                    <td style={{ fontSize: 11, fontFamily: "var(--m)", color: "var(--t2)", whiteSpace: "nowrap" }}>
                      {item.valid_from || "?"}<br/>{"\u2192 " + (item.valid_to || "?")}
                    </td>
                    <td><div className="rb"><div className="rd" style={{ background: r.color }}>{r.logo}</div>{r.name}</div></td>
                    <td><strong style={{ color: "var(--t1)" }}>{item.brand}</strong></td>
                    <td style={{ color: "var(--t2)" }}>{item.article}</td>
                    <td><span className="sz">{item.size || "-"}</span></td>
                    <td><span className={catClass}>{item.category || "-"}</span></td>
                    <td><span className="pc" style={{ color: "var(--grn)" }}>{item.promo_price ? "\u20AC" + item.promo_price.toFixed(2) : "\u2014"}</span></td>
                    <td><span className="pt" style={{ color: item.discount_pct ? "var(--red)" : "var(--t3)" }}>{item.discount_pct ? "-" + item.discount_pct + "%" : "\u2014"}</span></td>
                    <td><span className={"sop sop-" + (item.share_of_page || "Standard").toLowerCase()}>{item.share_of_page || "-"}</span></td>
                  </tr>
                );
              })}</tbody></table>
            </div>
            <div className="tf">
              <span>Str. {page} od {tp}</span>
              <div className="pg">
                <button className="pb" disabled={page === 1} onClick={() => setPage(page - 1)}>{"\u2039"}</button>
                {Array.from({ length: Math.min(tp, 7) }, (_, i) => {
                  let p: number;
                  if (tp <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= tp - 3) p = tp - 6 + i;
                  else p = page - 3 + i;
                  return <button key={p} className={"pb" + (p === page ? " on" : "")} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button className="pb" disabled={page === tp} onClick={() => setPage(page + 1)}>{"\u203A"}</button>
              </div>
            </div></div>
          </>
        )}
      </div>

      {showModal && (
        <div className="mo" onClick={() => { setShowModal(false); setSent(false); }}>
          <div className="md" onClick={e => e.stopPropagation()}>
            {!sent ? (<>
              <h2>Pretplata na tjedni report</h2>
              <p>Household & Personal Care promo digest svakog cetvrtka.</p>
              <input type="email" placeholder="vas@email.com" autoFocus />
              <div className="ma">
                <button className="btn" onClick={() => { setShowModal(false); setSent(false); }}>Odustani</button>
                <button className="btn btn-a" onClick={() => setSent(true)}>Pretplati se</button>
              </div>
            </>) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u2713"}</div>
                <h2 style={{ marginBottom: 8 }}>Pretplaceni ste!</h2>
                <p>Prvi report stize ovaj cetvrtak.</p>
                <button className="btn btn-a" style={{ margin: "16px auto 0" }} onClick={() => { setShowModal(false); setSent(false); }}>OK</button>
              </div>
            )}
          </div>
        </div>
      )}
      {previewItem && previewItem.source_url && (
        <div className="img-modal" onClick={() => setPreviewItem(null)}>
          <div className="img-wrap" onClick={e => e.stopPropagation()}>
            <button className="img-close" onClick={() => setPreviewItem(null)}>{"\u2715"}</button>
            <img src={previewItem.source_url} alt={previewItem.article} />
            <div className="img-info">
              {previewItem.retailer} — {previewItem.brand} {previewItem.article}
              {previewItem.valid_from && (" | " + previewItem.valid_from + " \u2192 " + (previewItem.valid_to || "?"))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return <PromoRadar />;
}