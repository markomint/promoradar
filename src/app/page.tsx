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
  DM: { name: "DM", color: "#002878", logo: "dm" },
};

interface PromoItem {
  id: number; retailer: string; brand: string; article: string; size: string;
  category: string; regular_price: number | null; promo_price: number | null;
  discount_pct: number | null; share_of_page: string; valid_from: string;
  valid_to: string; scan_date: string; source_url: string | null;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root{--bg:#F8F9FC;--white:#FFF;--card:#FFF;--bdr:#E8ECF4;--bdr2:#D1D9E6;--t1:#1A1D2B;--t2:#5A6178;--t3:#8E95A9;--accent:#FF3D57;--accent2:#FF6B35;--accent-soft:rgba(255,61,87,.08);--blue:#2563EB;--blue-soft:rgba(37,99,235,.08);--green:#059669;--green-soft:rgba(5,150,105,.08);--purple:#7C3AED;--f:'Plus Jakarta Sans',sans-serif;--m:'JetBrains Mono',monospace;--shadow:0 1px 3px rgba(0,0,0,.06);--shadow-lg:0 4px 20px rgba(0,0,0,.08);--shadow-xl:0 12px 40px rgba(0,0,0,.12);--radius:14px}
*{margin:0;padding:0;box-sizing:border-box}body,#root,#__next{font-family:var(--f);background:var(--bg);color:var(--t1);min-height:100vh}
.header{background:var(--white);border-bottom:1px solid var(--bdr);position:sticky;top:0;z-index:50}
.header-in{max-width:1320px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.logo-area{display:flex;align-items:center;gap:10px}
.logo-mark{width:38px;height:38px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px}
.logo-text{font-size:20px;font-weight:800;letter-spacing:-0.5px}.logo-text span{color:var(--accent)}
.logo-sub{font-size:11px;color:var(--t3);font-weight:500;letter-spacing:.5px;text-transform:uppercase}
.header-r{display:flex;align-items:center;gap:12px}
.live-badge{display:flex;align-items:center;gap:6px;font:500 12px var(--m);color:var(--green);background:var(--green-soft);padding:6px 12px;border-radius:20px}
.live-dot{width:7px;height:7px;background:var(--green);border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.btn-sub{background:var(--accent);color:#fff;border:0;padding:8px 18px;border-radius:10px;font:600 13px var(--f);cursor:pointer;transition:.2s}
.btn-sub:hover{background:#E8354D;transform:translateY(-1px)}
.hero{background:linear-gradient(135deg,#1A1D2B,#2D1B4E,#1A1D2B);padding:48px 24px;color:#fff;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;right:-20%;width:600px;height:600px;background:radial-gradient(circle,rgba(255,61,87,.15),transparent 70%);pointer-events:none}
.hero-in{max-width:1320px;margin:0 auto;position:relative;z-index:1}
.hero h1{font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:8px}
.hero h1 span{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{color:rgba(255,255,255,.6);font-size:15px}
.stats{max-width:1320px;margin:-28px auto 0;padding:0 24px;position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.stat-card{background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow-lg);border:1px solid var(--bdr);text-align:center;transition:.2s}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-xl)}
.stat-num{font-size:28px;font-weight:800;letter-spacing:-1px;margin-bottom:2px}
.stat-label{font-size:12px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.5px}
.filters{max-width:1320px;margin:24px auto 0;padding:0 24px}
.filter-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.chip{padding:8px 16px;border-radius:20px;border:1.5px solid var(--bdr);background:var(--white);font:500 13px var(--f);color:var(--t2);cursor:pointer;transition:.2s;display:flex;align-items:center;gap:6px}
.chip:hover{border-color:var(--t3);color:var(--t1)}.chip.on{border-color:transparent;color:#fff}
.chip .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.search-input{flex:1;min-width:220px;padding:10px 16px 10px 40px;border:1.5px solid var(--bdr);border-radius:12px;font:400 14px var(--f);color:var(--t1);background:var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238E95A9' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") 14px center no-repeat;outline:0;transition:.2s}
.search-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-soft)}
.search-input::placeholder{color:var(--t3)}
.sel-wrap{position:relative}.sel-wrap select{appearance:none;padding:10px 36px 10px 14px;border:1.5px solid var(--bdr);border-radius:12px;font:500 13px var(--f);color:var(--t2);background:var(--white);cursor:pointer;outline:0}
.sel-wrap select:focus{border-color:var(--blue)}.sel-wrap::after{content:'\\25BE';position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none;font-size:12px}
.filter-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.products{max-width:1320px;margin:20px auto 0;padding:0 24px 40px}
.count-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.count{font:600 14px var(--f);color:var(--t2)}.count strong{color:var(--t1)}
.btn-actions{display:flex;gap:8px;align-items:center}
.view-btns{display:flex;gap:4px}
.view-btn{width:34px;height:34px;border:1.5px solid var(--bdr);border-radius:8px;background:var(--white);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t3);transition:.15s}
.view-btn.on{border-color:var(--blue);color:var(--blue);background:var(--blue-soft)}
.btn-csv{display:flex;align-items:center;gap:6px;padding:8px 16px;border:1.5px solid var(--bdr);border-radius:10px;background:var(--white);font:500 13px var(--f);color:var(--t2);cursor:pointer;transition:.15s}
.btn-csv:hover{border-color:var(--blue);color:var(--blue)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.pcard{background:var(--white);border-radius:var(--radius);border:1.5px solid var(--bdr);overflow:hidden;cursor:pointer;transition:.25s;position:relative}
.pcard:hover{border-color:var(--blue);box-shadow:var(--shadow-lg);transform:translateY(-3px)}
.pcard-img{width:100%;height:180px;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.pcard-img img{width:100%;height:100%;object-fit:cover}
.pcard-noimg{color:var(--t3);font:500 13px var(--f)}
.pcard-badge{position:absolute;top:10px;left:10px;display:flex;gap:6px;flex-wrap:wrap}
.badge{padding:4px 10px;border-radius:8px;font:600 11px var(--m);letter-spacing:.3px}
.badge-ret{color:#fff;font-size:10px}.badge-disc{background:var(--accent);color:#fff}
.badge-sop{font:500 10px var(--m);letter-spacing:.5px;text-transform:uppercase}
.badge-hero{background:#FEE2E2;color:#DC2626}.badge-premium{background:#FEF3C7;color:#D97706}
.badge-standard{background:var(--blue-soft);color:var(--blue)}.badge-small{background:#F1F5F9;color:var(--t3)}
.pcard-body{padding:14px 16px}
.pcard-brand{font-size:12px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.pcard-title{font-size:14px;font-weight:600;color:var(--t1);line-height:1.3;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pcard-meta{display:flex;align-items:center;justify-content:space-between}
.pcard-price{display:flex;align-items:baseline;gap:6px}
.price-promo{font:700 20px var(--f);color:var(--accent);letter-spacing:-0.5px}
.price-old{font:500 13px var(--f);color:var(--t3);text-decoration:line-through}
.pcard-size{font:500 12px var(--m);color:var(--t3);background:var(--bg);padding:3px 8px;border-radius:6px}
.pcard-footer{padding:8px 16px;border-top:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center}
.pcard-date{font:400 11px var(--m);color:var(--t3)}
.pcard-cat{font:500 11px var(--f);padding:3px 8px;border-radius:6px}
.cat-h{background:#DBEAFE;color:#2563EB}.cat-p{background:#F3E8FF;color:#7C3AED}
.tbl-wrap{overflow-x:auto;background:var(--white);border-radius:var(--radius);border:1.5px solid var(--bdr);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:13px}thead{background:var(--bg)}
th{padding:12px 14px;text-align:left;font-weight:600;color:var(--t2);font-size:11px;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;white-space:nowrap;border-bottom:1.5px solid var(--bdr);user-select:none}
th:hover{color:var(--t1)}th.on{color:var(--blue)}
td{padding:10px 14px;border-bottom:1px solid var(--bdr);color:var(--t2);vertical-align:middle}
tr.clickable{cursor:pointer}tr.clickable:hover td{background:var(--blue-soft)}
.ret-cell{display:flex;align-items:center;gap:8px}
.ret-dot{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font:700 10px var(--f);flex-shrink:0}
.tbl-brand{font-weight:700;color:var(--t1)}
.tbl-price{font:600 13px var(--m);color:var(--accent)}
.tbl-disc{font:600 12px var(--m);color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:6px}
.tbl-sop{font:500 10px var(--m);padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px}
.sop-hero{background:#FEE2E2;color:#DC2626}.sop-premium{background:#FEF3C7;color:#D97706}
.sop-standard{background:var(--blue-soft);color:var(--blue)}.sop-small{background:#F1F5F9;color:var(--t3)}
.tbl-date{font:400 11px var(--m);color:var(--t3)}
.pagi{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:24px}
.pg-btn{width:36px;height:36px;border:1.5px solid var(--bdr);border-radius:10px;background:var(--white);font:500 13px var(--f);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}
.pg-btn:hover:not(:disabled){border-color:var(--blue);color:var(--blue)}.pg-btn.on{background:var(--blue);border-color:var(--blue);color:#fff}
.pg-btn:disabled{opacity:.4;cursor:default}.pg-info{font:500 13px var(--f);color:var(--t3);margin:0 8px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fi .2s}
@keyframes fi{from{opacity:0}}
.modal-content{max-width:90vw;max-height:90vh;position:relative;animation:su .25s}
@keyframes su{from{transform:translateY(20px);opacity:0}}
.modal-content img{max-width:100%;max-height:82vh;border-radius:16px;box-shadow:var(--shadow-xl)}
.modal-close{position:absolute;top:-14px;right:-14px;width:36px;height:36px;border-radius:50%;background:var(--white);border:1.5px solid var(--bdr);color:var(--t1);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;font-weight:700;transition:.2s;box-shadow:var(--shadow)}
.modal-close:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.modal-info{text-align:center;margin-top:12px;font:500 13px var(--f);color:rgba(255,255,255,.7)}
.sub-modal{background:var(--white);border-radius:20px;padding:32px;max-width:440px;width:90%;box-shadow:var(--shadow-xl)}
.sub-modal h2{font-size:20px;font-weight:800;margin-bottom:4px}.sub-modal p{font-size:13px;color:var(--t2);margin-bottom:20px}
.sub-modal input[type="email"]{width:100%;padding:12px 16px;border:1.5px solid var(--bdr);border-radius:12px;font:400 14px var(--f);color:var(--t1);outline:0;margin-bottom:14px}
.sub-modal input[type="email"]:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-soft)}
.sub-actions{display:flex;gap:10px;justify-content:flex-end}
.btn-cancel{padding:10px 20px;border:1.5px solid var(--bdr);border-radius:10px;background:var(--white);font:500 13px var(--f);color:var(--t2);cursor:pointer}
.btn-send{padding:10px 20px;border:0;border-radius:10px;background:var(--accent);color:#fff;font:600 13px var(--f);cursor:pointer;transition:.2s}
.btn-send:hover{background:#E8354D}
.footer{max-width:1320px;margin:0 auto;padding:24px;text-align:center;font:400 12px var(--f);color:var(--t3);border-top:1px solid var(--bdr)}
@media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}}
@media(max-width:600px){.stats{grid-template-columns:1fr 1fr}.hero h1{font-size:24px}.filter-bar{flex-direction:column;align-items:stretch}.search-input{min-width:unset}}
`;

function PromoRadar() {
  const [promoData, setPromoData] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [retailerFilter, setRetailerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("all");
  const [sortField, setSortField] = useState("valid_from");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid"|"table">("grid");
  const [showSub, setShowSub] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewItem, setPreviewItem] = useState<PromoItem|null>(null);
  const PS = viewMode === "grid" ? 24 : 20;

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("promo_items").select("*").order("valid_from",{ascending:false}).limit(5000);
        if (error) throw error;
        if (data) setPromoData(data);
      } catch(e){console.error(e)} finally{setLoading(false)}
    })();
  }, []);

  const data = useMemo(() => {
    let d = [...promoData];
    if (weekFilter!=="all") d=d.filter(x=>x.scan_date===weekFilter);
    if (search){const q=search.toLowerCase();d=d.filter(x=>(x.brand||"").toLowerCase().includes(q)||(x.article||"").toLowerCase().includes(q)||(x.retailer||"").toLowerCase().includes(q))}
    if (retailerFilter!=="all") d=d.filter(x=>x.retailer===retailerFilter);
    if (categoryFilter!=="all") d=d.filter(x=>x.category===categoryFilter);
    if (brandFilter!=="all") d=d.filter(x=>x.brand===brandFilter);
    d.sort((a:any,b:any)=>{const av=a[sortField],bv=b[sortField];if(av==null)return 1;if(bv==null)return -1;if(typeof av==="string")return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);return sortDir==="asc"?av-bv:bv-av});
    return d;
  }, [promoData,search,retailerFilter,categoryFilter,brandFilter,weekFilter,sortField,sortDir]);

  const paged = useMemo(()=>data.slice((page-1)*PS,page*PS),[data,page,PS]);
  const tp = Math.max(1,Math.ceil(data.length/PS));
  useEffect(()=>{setPage(1)},[search,retailerFilter,categoryFilter,brandFilter,weekFilter,viewMode]);

  const toggle=(f:string)=>{if(sortField===f)setSortDir(sortDir==="asc"?"desc":"asc");else{setSortField(f);setSortDir("desc")}};
  const Arrow=({f}:{f:string})=>sortField!==f?null:<span style={{marginLeft:4,fontSize:10}}>{sortDir==="asc"?"\u25B2":"\u25BC"}</span>;

  const cats=[...new Set(promoData.map(d=>d.category).filter(Boolean))].sort();
  const brands=[...new Set(promoData.map(d=>d.brand).filter(Boolean))].sort();
  const retailerNames=[...new Set(promoData.map(d=>d.retailer).filter(Boolean))].sort();
  const scanWeeks=[...new Set(promoData.map(d=>d.scan_date).filter(Boolean))].sort().reverse();
  const hCount=promoData.filter(p=>p.category==="Household").length;
  const pCount=promoData.filter(p=>p.category==="Personal Care").length;
  const getRet=(n:string)=>RETAILERS[n]||{name:n,color:"#666",logo:"?"};

  const exportCSV=()=>{
    const h=["Retailer","Brand","Article","Size","Category","Promo Price","Discount %","Share of Page","Valid From","Valid To"];
    const r=data.map(d=>[d.retailer,d.brand,d.article,d.size||"",d.category||"",d.promo_price?d.promo_price.toString():"",d.discount_pct?"-"+d.discount_pct+"%":"",d.share_of_page||"",d.valid_from||"",d.valid_to||""]);
    const csv=[h,...r].map(row=>row.map(c=>'"'+c+'"').join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="promoradar-export.csv";a.click();
  };

  const sopCls=(s:string)=>"badge badge-sop badge-"+(s||"standard").toLowerCase();
  const tblSop=(s:string)=>"tbl-sop sop-"+(s||"standard").toLowerCase();

  return (<>
    <style>{CSS}</style>
    <header className="header"><div className="header-in">
      <div className="logo-area"><div className="logo-mark">PR</div><div><div className="logo-text">Promo<span>Radar</span></div><div className="logo-sub">Promotivni monitoring</div></div></div>
      <div className="header-r"><div className="live-badge"><div className="live-dot"/>LIVE</div><button className="btn-sub" onClick={()=>setShowSub(true)}>{"\u2709"} Pretplata</button></div>
    </div></header>

    <section className="hero"><div className="hero-in">
      <h1>Sve <span>H&PC promocije</span> na jednom mjestu</h1>
      <p className="hero-sub">Pratimo Household i Personal Care promocije u {retailerNames.length} retailera. Tjedni scan kataloga s AI Vision tehnologijom.</p>
    </div></section>

    <div className="stats">
      <div className="stat-card"><div className="stat-num" style={{color:"var(--blue)"}}>{retailerNames.length}</div><div className="stat-label">Retailera</div></div>
      <div className="stat-card"><div className="stat-num" style={{color:"var(--accent)"}}>{promoData.length}</div><div className="stat-label">Artikala</div></div>
      <div className="stat-card"><div className="stat-num" style={{color:"var(--green)"}}>{hCount}</div><div className="stat-label">Household</div></div>
      <div className="stat-card"><div className="stat-num" style={{color:"var(--purple)"}}>{pCount}</div><div className="stat-label">Personal Care</div></div>
    </div>

    <div className="filters">
      <div className="filter-row">
        <button className={"chip"+(retailerFilter==="all"?" on":"")} style={retailerFilter==="all"?{background:"var(--blue)",borderColor:"transparent"}:{}} onClick={()=>setRetailerFilter("all")}>Svi</button>
        {retailerNames.map(name=>{const r=getRet(name);return <button key={name} className={"chip"+(retailerFilter===name?" on":"")} style={retailerFilter===name?{background:r.color,borderColor:"transparent"}:{}} onClick={()=>setRetailerFilter(retailerFilter===name?"all":name)}><span className="dot" style={{background:retailerFilter===name?"#fff":r.color}}/>{r.name}</button>})}
      </div>
      <div className="filter-bar">
        <input className="search-input" placeholder="Pretrazi po brendu ili artiklu..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="sel-wrap"><select value={weekFilter} onChange={e=>setWeekFilter(e.target.value)}><option value="all">Svi tjedni</option>{scanWeeks.map(w=><option key={w} value={w}>Scan {w}</option>)}</select></div>
        <div className="sel-wrap"><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Sve kategorije</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="sel-wrap"><select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}><option value="all">Svi brendovi</option>{brands.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
      </div>
    </div>

    <div className="products">
      <div className="count-row">
        <div className="count"><strong>{data.length}</strong> artikala</div>
        <div className="btn-actions">
          <div className="view-btns">
            <button className={"view-btn"+(viewMode==="grid"?" on":"")} onClick={()=>setViewMode("grid")}><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg></button>
            <button className={"view-btn"+(viewMode==="table"?" on":"")} onClick={()=>setViewMode("table")}><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.5" rx="1"/><rect x="1" y="6.5" width="14" height="2.5" rx="1"/><rect x="1" y="11" width="14" height="2.5" rx="1"/></svg></button>
          </div>
          <button className="btn-csv" onClick={exportCSV}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>CSV</button>
        </div>
      </div>

      {loading ? <div style={{textAlign:"center",padding:60,color:"var(--t3)"}}>Ucitavam...</div> : viewMode==="grid" ? (
        <div className="grid">{paged.map(item=>{const r=getRet(item.retailer);return(
          <div key={item.id} className="pcard" onClick={()=>item.source_url&&setPreviewItem(item)}>
            <div className="pcard-img">
              {item.source_url?<img src={item.source_url} alt={item.article} loading="lazy"/>:<span className="pcard-noimg">Nema slike</span>}
              <div className="pcard-badge">
                <span className="badge badge-ret" style={{background:r.color}}>{r.name}</span>
                {item.discount_pct&&<span className="badge badge-disc">-{item.discount_pct}%</span>}
                {item.share_of_page&&<span className={sopCls(item.share_of_page)}>{item.share_of_page}</span>}
              </div>
            </div>
            <div className="pcard-body">
              <div className="pcard-brand">{item.brand}</div>
              <div className="pcard-title">{item.article}</div>
              <div className="pcard-meta">
                <div className="pcard-price">
                  {item.promo_price&&<span className="price-promo">{"\u20AC"}{item.promo_price.toFixed(2)}</span>}
                  {item.regular_price&&<span className="price-old">{"\u20AC"}{item.regular_price.toFixed(2)}</span>}
                </div>
                {item.size&&<span className="pcard-size">{item.size}</span>}
              </div>
            </div>
            <div className="pcard-footer">
              <span className="pcard-date">{item.valid_from||"?"} {"\u2192"} {item.valid_to||"?"}</span>
              <span className={"pcard-cat "+(item.category==="Household"?"cat-h":"cat-p")}>{item.category}</span>
            </div>
          </div>)})}</div>
      ) : (
        <div className="tbl-wrap"><table><thead><tr>
          <th className={sortField==="valid_from"?"on":""} onClick={()=>toggle("valid_from")}>Datum<Arrow f="valid_from"/></th>
          <th className={sortField==="retailer"?"on":""} onClick={()=>toggle("retailer")}>Retailer<Arrow f="retailer"/></th>
          <th className={sortField==="brand"?"on":""} onClick={()=>toggle("brand")}>Brand<Arrow f="brand"/></th>
          <th className={sortField==="article"?"on":""} onClick={()=>toggle("article")}>Artikl<Arrow f="article"/></th>
          <th>Size</th><th className={sortField==="category"?"on":""} onClick={()=>toggle("category")}>Kategorija<Arrow f="category"/></th>
          <th className={sortField==="promo_price"?"on":""} onClick={()=>toggle("promo_price")}>Cijena<Arrow f="promo_price"/></th>
          <th className={sortField==="discount_pct"?"on":""} onClick={()=>toggle("discount_pct")}>Popust<Arrow f="discount_pct"/></th>
          <th className={sortField==="share_of_page"?"on":""} onClick={()=>toggle("share_of_page")}>Share<Arrow f="share_of_page"/></th>
        </tr></thead><tbody>{paged.map(item=>{const r=getRet(item.retailer);return(
          <tr key={item.id} className={item.source_url?"clickable":""} onClick={()=>item.source_url&&setPreviewItem(item)}>
            <td><span className="tbl-date">{item.valid_from||"?"}<br/>{"\u2192 "}{item.valid_to||"?"}</span></td>
            <td><div className="ret-cell"><div className="ret-dot" style={{background:r.color}}>{r.logo}</div>{r.name}</div></td>
            <td><span className="tbl-brand">{item.brand}</span></td>
            <td style={{maxWidth:200}}>{item.article}</td>
            <td><span className="pcard-size">{item.size||"-"}</span></td>
            <td><span className={"pcard-cat "+(item.category==="Household"?"cat-h":"cat-p")}>{item.category}</span></td>
            <td><span className="tbl-price">{item.promo_price?"\u20AC"+item.promo_price.toFixed(2):"\u2014"}</span></td>
            <td>{item.discount_pct?<span className="tbl-disc">-{item.discount_pct}%</span>:<span style={{color:"var(--t3)"}}>{"\u2014"}</span>}</td>
            <td><span className={tblSop(item.share_of_page)}>{item.share_of_page||"-"}</span></td>
          </tr>)})}</tbody></table></div>
      )}

      <div className="pagi">
        <button className="pg-btn" disabled={page===1} onClick={()=>setPage(page-1)}>{"\u2039"}</button>
        {Array.from({length:Math.min(tp,7)},(_,i)=>{let p:number;if(tp<=7)p=i+1;else if(page<=4)p=i+1;else if(page>=tp-3)p=tp-6+i;else p=page-3+i;return <button key={p} className={"pg-btn"+(p===page?" on":"")} onClick={()=>setPage(p)}>{p}</button>})}
        <span className="pg-info">{page} / {tp}</span>
        <button className="pg-btn" disabled={page===tp} onClick={()=>setPage(page+1)}>{"\u203A"}</button>
      </div>
    </div>

    <div className="footer">PromoRadar {"\u00A9"} 2026 {"\u2014"} Household & Personal Care promotivni monitoring za HR i SLO</div>

    {previewItem&&previewItem.source_url&&(<div className="modal-overlay" onClick={()=>setPreviewItem(null)}><div className="modal-content" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setPreviewItem(null)}>{"\u2715"}</button>
      <img src={previewItem.source_url} alt={previewItem.article}/>
      <div className="modal-info">{previewItem.retailer} {"\u2014"} {previewItem.brand} {previewItem.article}{previewItem.valid_from&&(" | "+previewItem.valid_from+" \u2192 "+(previewItem.valid_to||"?"))}</div>
    </div></div>)}

    {showSub&&(<div className="modal-overlay" onClick={()=>setShowSub(false)}><div className="sub-modal" onClick={e=>e.stopPropagation()}>
      {!sent?(<><h2>Tjedni promo digest</h2><p>Prijavite se za tjedni email s najnovijim H&PC promocijama.</p>
        <input type="email" placeholder="vas@email.com"/><div className="sub-actions"><button className="btn-cancel" onClick={()=>setShowSub(false)}>Odustani</button><button className="btn-send" onClick={()=>setSent(true)}>Prijavi se</button></div>
      </>):(<><h2>{"\u2705"} Prijava uspjesna!</h2><p>Primit cete tjedni digest svaki cetvrtak.</p><div className="sub-actions"><button className="btn-send" onClick={()=>{setShowSub(false);setSent(false)}}>Zatvori</button></div></>)}
    </div></div>)}
  </>);
}

export default function Home() { return <PromoRadar />; }