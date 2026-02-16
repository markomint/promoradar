'use client';
import { useState, useMemo, useEffect } from "react";

// ─── REAL DATA: Extracted from Croatian retail leaflets, Feb 2026 ───────────
const SCAN_DATE = "2026-02-16";
const NEXT_SCAN = "2026-02-19";

const RETAILERS: Record<string, { name: string; color: string; logo: string }> = {
  konzum: { name: "Konzum", color: "#E30613", logo: "K" },
  spar: { name: "Spar", color: "#00843D", logo: "S" },
  lidl: { name: "Lidl", color: "#0050AA", logo: "L" },
  kaufland: { name: "Kaufland", color: "#E10915", logo: "Kf" },
  plodine: { name: "Plodine", color: "#FF6B00", logo: "P" },
  studenac: { name: "Studenac", color: "#1B3A6B", logo: "St" },
  tommy: { name: "Tommy", color: "#C8102E", logo: "T" },
};

interface PromoItem {
  id: number;
  retailer: string;
  brand: string;
  article: string;
  size: string;
  category: string;
  regularPrice: number | null;
  promoPrice: number | null;
  discountPct: number;
  promoType: string;
  validFrom: string;
  validTo: string;
}

const PROMO_DATA: PromoItem[] = [
  // ── KONZUM (katalog 11.02.–17.02.2026) ──
  { id: 1, retailer: "konzum", brand: "Vindija", article: "Vindon pureći file", size: "750g", category: "Meat & Deli", regularPrice: 11.49, promoPrice: 8.79, discountPct: 23, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 2, retailer: "konzum", brand: "Lactalis", article: "President Zagrebački sir svježi", size: "375g", category: "Dairy", regularPrice: 3.29, promoPrice: 2.39, discountPct: 27, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 3, retailer: "konzum", brand: "Kraš", article: "Dorina čokolada", size: "100g", category: "Confectionery", regularPrice: 1.89, promoPrice: 1.45, discountPct: 23, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 4, retailer: "konzum", brand: "Beiersdorf", article: "Nivea gel za tuširanje", size: "500ml", category: "Personal Care", regularPrice: 5.49, promoPrice: 3.75, discountPct: 32, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 5, retailer: "konzum", brand: "Milka", article: "Milka čokolada razne vrste", size: "80g", category: "Confectionery", regularPrice: 1.89, promoPrice: 0.95, discountPct: 50, promoType: "Mega popust", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 6, retailer: "konzum", brand: "K Plus", article: "K Plus trajno mlijeko", size: "1L", category: "Dairy", regularPrice: 0.95, promoPrice: 0.65, discountPct: 32, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 7, retailer: "konzum", brand: "Podravka", article: "Vegeta dodatak jelima", size: "500g", category: "Canned Goods", regularPrice: 3.99, promoPrice: 2.99, discountPct: 25, promoType: "Vikend akcija", validFrom: "2026-02-06", validTo: "2026-02-08" },
  { id: 8, retailer: "konzum", brand: "Zvijezda", article: "Omegol namaz", size: "225g", category: "Dairy", regularPrice: 1.99, promoPrice: 1.29, discountPct: 35, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 9, retailer: "konzum", brand: "Dukat", article: "Dukatos grčki jogurt", size: "450g", category: "Dairy", regularPrice: 2.89, promoPrice: 2.09, discountPct: 28, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 10, retailer: "konzum", brand: "Henkel", article: "Persil gel za pranje", size: "1.98L", category: "Household", regularPrice: 12.99, promoPrice: 8.99, discountPct: 31, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 11, retailer: "konzum", brand: "Colgate-Palmolive", article: "Colgate zubna pasta", size: "125ml", category: "Personal Care", regularPrice: 3.19, promoPrice: 2.09, discountPct: 34, promoType: "Tjedna akcija", validFrom: "2026-01-21", validTo: "2026-01-27" },
  { id: 12, retailer: "konzum", brand: "Saponia", article: "Ornel omekšivač za rublje", size: "4L", category: "Household", regularPrice: 6.49, promoPrice: 4.49, discountPct: 31, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 13, retailer: "konzum", brand: "Nestlé", article: "Maggi Noodles", size: "59.2g", category: "Canned Goods", regularPrice: 0.79, promoPrice: 0.45, discountPct: 43, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-24" },
  { id: 14, retailer: "konzum", brand: "Vindija", article: "Cekin pileća prsa", size: "1kg", category: "Meat & Deli", regularPrice: 8.49, promoPrice: 6.49, discountPct: 24, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 15, retailer: "konzum", brand: "Zvijezda", article: "ABC sirni namaz", size: "200g", category: "Dairy", regularPrice: 2.69, promoPrice: 1.99, discountPct: 26, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 16, retailer: "konzum", brand: "Milka", article: "Milka čokolada razne vrste", size: "250-300g", category: "Confectionery", regularPrice: 4.49, promoPrice: 2.99, discountPct: 33, promoType: "Tjedna akcija", validFrom: "2026-01-28", validTo: "2026-02-03" },
  { id: 17, retailer: "konzum", brand: "Saponia", article: "Violeta omekšivač za rublje", size: "1.5L", category: "Household", regularPrice: 3.99, promoPrice: 2.99, discountPct: 25, promoType: "Super cijena", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 18, retailer: "konzum", brand: "Podravka", article: "Fini-Mini juha", size: "65g", category: "Canned Goods", regularPrice: 1.19, promoPrice: 0.79, discountPct: 34, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 19, retailer: "konzum", brand: "Saponia", article: "Dax Universal maramice", size: "80/1", category: "Household", regularPrice: 1.85, promoPrice: 1.29, discountPct: 30, promoType: "-30% popust", validFrom: "2026-02-04", validTo: "2026-02-10" },

  // ── SPAR / INTERSPAR ──
  { id: 20, retailer: "spar", brand: "Vindija", article: "Cekin pileća prsa bez kože", size: "1kg", category: "Meat & Deli", regularPrice: 8.99, promoPrice: 6.49, discountPct: 28, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-17" },
  { id: 21, retailer: "spar", brand: "Vindija", article: "Vivis sir krem", size: "100g", category: "Dairy", regularPrice: 1.49, promoPrice: 1.09, discountPct: 27, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-17" },
  { id: 22, retailer: "spar", brand: "PepsiCo", article: "Lay's čips odabrane vrste", size: "120-130g", category: "Snacks", regularPrice: 2.49, promoPrice: 1.89, discountPct: 24, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-17" },
  { id: 23, retailer: "spar", brand: "Unilever", article: "Domestos sredstvo za čišćenje", size: "435ml", category: "Household", regularPrice: 3.99, promoPrice: 2.69, discountPct: 33, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-17" },
  { id: 24, retailer: "spar", brand: "Pivac", article: "Dobro pršut narezak", size: "300g", category: "Meat & Deli", regularPrice: 8.99, promoPrice: 6.49, discountPct: 28, promoType: "Mjesečna ušteda", validFrom: "2026-02-04", validTo: "2026-03-03" },
  { id: 25, retailer: "spar", brand: "Ledo", article: "Ledo okruglice", size: "500g", category: "Frozen", regularPrice: 4.49, promoPrice: 3.19, discountPct: 29, promoType: "Mjesečna ušteda", validFrom: "2026-02-04", validTo: "2026-03-03" },
  { id: 26, retailer: "spar", brand: "Saponia", article: "Violeta toaletni papir troslojni", size: "32 role", category: "Household", regularPrice: 10.99, promoPrice: 7.49, discountPct: 32, promoType: "Mjesečna ušteda", validFrom: "2026-02-04", validTo: "2026-03-03" },
  { id: 27, retailer: "spar", brand: "Bolton", article: "Franz Josef Kaiser tuna", size: "4×80g", category: "Canned Goods", regularPrice: 6.49, promoPrice: 3.49, discountPct: 46, promoType: "Mjesečna ušteda", validFrom: "2026-02-04", validTo: "2026-03-03" },
  { id: 28, retailer: "spar", brand: "JDE Peet's", article: "Jacobs instant kava", size: "200-250g", category: "Beverages", regularPrice: 13.99, promoPrice: 10.29, discountPct: 26, promoType: "Mjesečna ušteda", validFrom: "2026-02-04", validTo: "2026-03-03" },
  { id: 29, retailer: "spar", brand: "Upfield", article: "Rama namaz classic", size: "400g", category: "Dairy", regularPrice: 2.29, promoPrice: 1.49, discountPct: 35, promoType: "Tjedna akcija", validFrom: "2026-01-28", validTo: "2026-02-10" },
  { id: 30, retailer: "spar", brand: "Franck", article: "Franck Jubilarna kava", size: "500g", category: "Beverages", regularPrice: 10.99, promoPrice: 7.69, discountPct: 30, promoType: "Vikend akcija", validFrom: "2026-02-06", validTo: "2026-02-08" },
  { id: 31, retailer: "spar", brand: "S Budget", article: "S-Budget šećer kristal", size: "1kg", category: "Canned Goods", regularPrice: 0.99, promoPrice: 0.65, discountPct: 34, promoType: "Vikend akcija", validFrom: "2026-02-06", validTo: "2026-02-08" },
  { id: 32, retailer: "spar", brand: "P&G", article: "Ariel deterdžent za rublje", size: "2.2kg/40pr", category: "Household", regularPrice: 14.99, promoPrice: 10.99, discountPct: 27, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 33, retailer: "spar", brand: "Ferrero", article: "Nutella lješnjak namaz", size: "600g", category: "Confectionery", regularPrice: 6.79, promoPrice: 4.99, discountPct: 26, promoType: "Vikend akcija", validFrom: "2026-02-13", validTo: "2026-02-15" },
  { id: 34, retailer: "spar", brand: "Podravka", article: "Čokolino žitna kašica", size: "1.8kg", category: "Beverages", regularPrice: 12.99, promoPrice: 8.99, discountPct: 31, promoType: "Vikend akcija", validFrom: "2026-02-13", validTo: "2026-02-15" },
  { id: 35, retailer: "spar", brand: "Nestlé", article: "Nescafe Dolce Gusto kapsule", size: "88-270g", category: "Beverages", regularPrice: 7.49, promoPrice: 5.29, discountPct: 29, promoType: "Vikend akcija", validFrom: "2026-02-13", validTo: "2026-02-15" },
  { id: 36, retailer: "spar", brand: "Kraš", article: "Dorina čokolada", size: "240-290g", category: "Confectionery", regularPrice: 4.49, promoPrice: 2.99, discountPct: 33, promoType: "Tjedna akcija", validFrom: "2026-01-21", validTo: "2026-02-03" },
  { id: 37, retailer: "spar", brand: "Zvijezda", article: "Margo namaz", size: "400g", category: "Dairy", regularPrice: 2.29, promoPrice: 1.49, discountPct: 35, promoType: "Tjedna akcija", validFrom: "2026-01-21", validTo: "2026-02-03" },
  { id: 38, retailer: "spar", brand: "Dukat", article: "Dukat trajno mlijeko", size: "1L", category: "Dairy", regularPrice: 1.15, promoPrice: 0.94, discountPct: 18, promoType: "Tjedna akcija", validFrom: "2026-01-07", validTo: "2026-01-13" },

  // ── LIDL ──
  { id: 39, retailer: "lidl", brand: "Lidl PL", article: "Okusi Zavičaja Kulenova seka", size: "500g", category: "Meat & Deli", regularPrice: 8.49, promoPrice: 5.99, discountPct: 29, promoType: "Tjedna akcija", validFrom: "2026-02-16", validTo: "2026-02-21" },
  { id: 40, retailer: "lidl", brand: "Lidl PL", article: "Lećevački mladi kravlji sir", size: "300g", category: "Dairy", regularPrice: 4.99, promoPrice: 3.79, discountPct: 24, promoType: "Tjedna akcija", validFrom: "2026-02-16", validTo: "2026-02-21" },
  { id: 41, retailer: "lidl", brand: "Lidl PL", article: "Cien gel za tuširanje", size: "500ml", category: "Personal Care", regularPrice: 1.99, promoPrice: 0.99, discountPct: 50, promoType: "Mega popust", validFrom: "2026-02-16", validTo: "2026-02-21" },
  { id: 42, retailer: "lidl", brand: "Lidl PL", article: "Madeleines kolačići", size: "250g", category: "Confectionery", regularPrice: 3.99, promoPrice: 2.59, discountPct: 35, promoType: "Tjedna akcija", validFrom: "2026-02-16", validTo: "2026-02-21" },

  // ── KAUFLAND ──
  { id: 43, retailer: "kaufland", brand: "Dutch Veal", article: "Teleći vrat s kostima", size: "1kg", category: "Meat & Deli", regularPrice: 12.99, promoPrice: 8.89, discountPct: 32, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 44, retailer: "kaufland", brand: "Dukat", article: "Kravica Kraljica svježe mlijeko", size: "1L", category: "Dairy", regularPrice: 1.49, promoPrice: 1.19, discountPct: 20, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 45, retailer: "kaufland", brand: "Pringles", article: "Pringles čips razne vrste", size: "165g", category: "Snacks", regularPrice: 2.99, promoPrice: 1.75, discountPct: 41, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 46, retailer: "kaufland", brand: "Pik Vrbovec", article: "Pik Mortadela classic", size: "100g", category: "Meat & Deli", regularPrice: 1.29, promoPrice: 0.79, discountPct: 39, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 47, retailer: "kaufland", brand: "Emmi", article: "Kerniger zrnati sir", size: "200g", category: "Dairy", regularPrice: 2.19, promoPrice: 1.49, discountPct: 32, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 48, retailer: "kaufland", brand: "Dukat", article: "Dukatos grčki jogurt", size: "450g", category: "Dairy", regularPrice: 2.89, promoPrice: 2.09, discountPct: 28, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 49, retailer: "kaufland", brand: "SCA", article: "Zewa papirnati ručnici", size: "2/1", category: "Household", regularPrice: 2.49, promoPrice: 1.79, discountPct: 28, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 50, retailer: "kaufland", brand: "Vindija", article: "Vindija pureća Šunka Delikates", size: "100g", category: "Meat & Deli", regularPrice: 2.99, promoPrice: 1.99, discountPct: 33, promoType: "Akcija početak tjedna", validFrom: "2026-02-02", validTo: "2026-02-03" },

  // ── PLODINE ──
  { id: 51, retailer: "plodine", brand: "Vindija", article: "Cekin odrezak od pilećeg filea", size: "400g", category: "Meat & Deli", regularPrice: 6.49, promoPrice: 4.99, discountPct: 23, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 52, retailer: "plodine", brand: "Dukat", article: "Dukat trajno mlijeko", size: "1L", category: "Dairy", regularPrice: 1.15, promoPrice: 0.93, discountPct: 19, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 53, retailer: "plodine", brand: "Kraš", article: "Jadro napolitanke", size: "430g", category: "Confectionery", regularPrice: 3.49, promoPrice: 2.29, discountPct: 34, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 54, retailer: "plodine", brand: "Unilever", article: "Domestos univerzalno sredstvo", size: "1250ml", category: "Household", regularPrice: 4.99, promoPrice: 2.99, discountPct: 40, promoType: "Tjedna akcija", validFrom: "2026-02-18", validTo: "2026-02-24" },
  { id: 55, retailer: "plodine", brand: "Emmi", article: "Kerniger svježi zrnati sir", size: "200g", category: "Dairy", regularPrice: 2.19, promoPrice: 1.49, discountPct: 32, promoType: "Tjedna akcija", validFrom: "2026-02-11", validTo: "2026-02-17" },
  { id: 56, retailer: "plodine", brand: "Pik Vrbovec", article: "Pik svježe mljeveno meso", size: "540g", category: "Meat & Deli", regularPrice: 6.49, promoPrice: 4.69, discountPct: 28, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 57, retailer: "plodine", brand: "Beiersdorf", article: "Nivea gel za tuširanje", size: "250ml", category: "Personal Care", regularPrice: 2.99, promoPrice: 1.79, discountPct: 40, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 58, retailer: "plodine", brand: "Kraš", article: "Jadro napolitanke original", size: "860g", category: "Confectionery", regularPrice: 5.99, promoPrice: 3.99, discountPct: 33, promoType: "Tjedna akcija", validFrom: "2026-02-04", validTo: "2026-02-10" },
  { id: 59, retailer: "plodine", brand: "Vindija", article: "Cekin pile Roster", size: "1kg", category: "Meat & Deli", regularPrice: 4.49, promoPrice: 3.18, discountPct: 29, promoType: "Tjedna akcija", validFrom: "2026-01-28", validTo: "2026-02-03" },

  // ── STUDENAC ──
  { id: 60, retailer: "studenac", brand: "Vindija", article: "Cekin koka usitnjeno meso piletina", size: "500g", category: "Meat & Deli", regularPrice: 3.49, promoPrice: 2.29, discountPct: 34, promoType: "Multi ušteda", validFrom: "2026-02-11", validTo: "2026-02-24" },
  { id: 61, retailer: "studenac", brand: "Dukat", article: "Dukat jogurt tekući", size: "330g", category: "Dairy", regularPrice: 1.49, promoPrice: 1.05, discountPct: 30, promoType: "Multi ušteda", validFrom: "2026-02-11", validTo: "2026-02-24" },
  { id: 62, retailer: "studenac", brand: "Kraš", article: "Kraš Tortica vafel", size: "21g", category: "Confectionery", regularPrice: 0.45, promoPrice: 0.35, discountPct: 22, promoType: "Multi ušteda (2+)", validFrom: "2026-02-11", validTo: "2026-02-24" },

  // ── TOMMY ──
  { id: 63, retailer: "tommy", brand: "Podravka", article: "Podravka Čajna kobasica", size: "1kg", category: "Meat & Deli", regularPrice: 17.99, promoPrice: 13.79, discountPct: 23, promoType: "Tjedna akcija", validFrom: "2026-02-12", validTo: "2026-02-18" },
  { id: 64, retailer: "tommy", brand: "Paladin", article: "Sir Plavi s plemenitom plijesni", size: "1kg", category: "Dairy", regularPrice: 18.99, promoPrice: 14.49, discountPct: 24, promoType: "Tjedna akcija", validFrom: "2026-02-12", validTo: "2026-02-18" },
  { id: 65, retailer: "tommy", brand: "Nestlé", article: "Nescafe classic", size: "200g", category: "Beverages", regularPrice: 10.99, promoPrice: 7.99, discountPct: 27, promoType: "Tjedna akcija", validFrom: "2026-02-02", validTo: "2026-02-04" },
];

// ─── ICONS ──────────────────────────────────────────────────────────────────
const SearchIcon = () => (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>);
const ChevronDown = () => (<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>);
const DownloadIcon = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>);
const RadarIcon = () => (<svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" opacity="0.3"/><circle cx="12" cy="12" r="6" opacity="0.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" opacity="0.3"/><path d="M12 12l7-7" strokeWidth="2"/></svg>);
const MailIcon = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>);

// ─── STYLES ─────────────────────────────────────────────────────────────────
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
.real-badge{background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:4px 10px;border-radius:6px;font:700 10px var(--m);letter-spacing:1px;text-transform:uppercase}
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px}
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
.pc{font:600 14px var(--m)}.pr{color:var(--t3);text-decoration:line-through;font:400 12px var(--m)}
.db{display:inline-block;padding:3px 10px;border-radius:6px;font:700 12px var(--m)}
.dh{background:rgba(239,68,68,.1);color:var(--red)}.dm{background:rgba(245,158,11,.1);color:var(--amb)}.dl{background:rgba(16,185,129,.1);color:var(--grn)}
.pt{font-size:11px;color:var(--t2);background:rgba(148,163,184,.1);padding:3px 8px;border-radius:4px}
.sz{font:11px var(--m);color:var(--t3);background:rgba(100,116,139,.15);padding:2px 8px;border-radius:4px}
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
.src-note{background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(99,102,241,.08));border:1px solid rgba(59,130,246,.2);border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:12px;color:var(--t2);line-height:1.6}
.src-note strong{color:var(--t1)}
.steps{background:var(--card);border:1px solid var(--bdr);border-radius:14px;padding:24px 28px;margin-bottom:32px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
@media(max-width:1100px){.kpis{grid-template-columns:repeat(3,1fr)}.steps{grid-template-columns:repeat(2,1fr)}}
@media(max-width:768px){.kpis{grid-template-columns:repeat(2,1fr)}.hdr{flex-direction:column;align-items:flex-start}.bar{flex-direction:column;align-items:stretch}.srch{min-width:unset}.steps{grid-template-columns:1fr}}
`;

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
function PromoRadar() {
  const [search, setSearch] = useState("");
  const [retailerFilter, setRetailerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof PromoItem>("discountPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [sent, setSent] = useState(false);
  const PS = 20;

  const data = useMemo(() => {
    let d = [...PROMO_DATA];
    if (search) { const q = search.toLowerCase(); d = d.filter(x => x.brand.toLowerCase().includes(q) || x.article.toLowerCase().includes(q) || RETAILERS[x.retailer]?.name.toLowerCase().includes(q)); }
    if (retailerFilter !== "all") d = d.filter(x => x.retailer === retailerFilter);
    if (categoryFilter !== "all") d = d.filter(x => x.category === categoryFilter);
    if (brandFilter !== "all") d = d.filter(x => x.brand === brandFilter);
    d.sort((a, b) => {
      const av = a[sortField]; const bv = b[sortField];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return d;
  }, [search, retailerFilter, categoryFilter, brandFilter, sortField, sortDir]);

  const paged = useMemo(() => data.slice((page - 1) * PS, page * PS), [data, page]);
  const tp = Math.max(1, Math.ceil(data.length / PS));
  useEffect(() => setPage(1), [search, retailerFilter, categoryFilter, brandFilter]);

  const toggle = (f: keyof PromoItem) => { if (sortField === f) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortField(f); setSortDir("desc"); } };
  const Arrow = ({ f }: { f: keyof PromoItem }) => sortField === f ? <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === "asc" ? "▲" : "▼"}</span> : null;

  const cats = [...new Set(PROMO_DATA.map(d => d.category))].sort();
  const brands = [...new Set(PROMO_DATA.map(d => d.brand))].sort();
  const avgDisc = (PROMO_DATA.reduce((s, d) => s + d.discountPct, 0) / PROMO_DATA.length).toFixed(1);
  const maxDisc = Math.max(...PROMO_DATA.map(d => d.discountPct));
  const dc = (p: number) => p >= 35 ? "dh" : p >= 25 ? "dm" : "dl";

  const exportCSV = () => {
    const h = ["Retailer","Brand","Article","Size","Category","Regular €","Promo €","Discount %","Promo Type","Valid From","Valid To"];
    const r = data.map(d => [RETAILERS[d.retailer]?.name, d.brand, d.article, d.size, d.category, d.regularPrice?.toFixed(2)||"", d.promoPrice?.toFixed(2)||"", d.discountPct+"%", d.promoType, d.validFrom, d.validTo]);
    const csv = [h, ...r].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `promoradar-${SCAN_DATE}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo"><div className="logo-i"><RadarIcon /></div><div><h1>PromoRadar</h1><span>Competitive Promo Intelligence — Croatia</span></div></div>
          <div className="hdr-r">
            <span className="real-badge">REAL DATA</span>
            <div className="live"><div className="live-dot" />Scan {SCAN_DATE}</div>
            <span style={{ color: "var(--t3)", fontSize: 12, fontFamily: "var(--m)" }}>Next: {NEXT_SCAN}</span>
          </div>
        </header>

        <div className="src-note">
          <strong>📡 Izvor podataka:</strong> Stvarni podaci izvučeni iz kataloga <strong>Konzum, Spar/Interspar, Lidl, Kaufland, Plodine, Studenac i Tommy</strong> za tjedan 11.–24. veljače 2026. Brendovi: Dukat, Vindija, Podravka, Kraš, Ledo, Milka, Nivea, Ariel, Persil, Saponia, Franck, Nestlé, PepsiCo, Unilever, P&G i drugi.
        </div>

        <div className="kpis">
          <div className="kpi"><div className="kpi-l">Retailers</div><div className="kpi-v">{Object.keys(RETAILERS).length}</div><div className="kpi-s">Active leaflets this week</div></div>
          <div className="kpi"><div className="kpi-l">Promo Items</div><div className="kpi-v">{PROMO_DATA.length}</div><div className="kpi-s">Extracted from leaflets</div></div>
          <div className="kpi"><div className="kpi-l">Unique Brands</div><div className="kpi-v">{new Set(PROMO_DATA.map(d => d.brand)).size}</div><div className="kpi-s">FMCG & Private Label</div></div>
          <div className="kpi"><div className="kpi-l">Avg. Discount</div><div className="kpi-v" style={{ color: "var(--amb)" }}>{avgDisc}%</div><div className="kpi-s">Across all promos</div></div>
          <div className="kpi"><div className="kpi-l">Deepest Cut</div><div className="kpi-v" style={{ color: "var(--red)" }}>{maxDisc}%</div><div className="kpi-s">Milka &amp; Cien @ 50% off</div></div>
        </div>

        <div className="chips">
          <button className={`chip ${retailerFilter === "all" ? "on" : ""}`} style={retailerFilter === "all" ? { background: "var(--acc)" } : {}} onClick={() => setRetailerFilter("all")}>Svi</button>
          {Object.entries(RETAILERS).map(([k, r]) => (<button key={k} className={`chip ${retailerFilter === k ? "on" : ""}`} style={retailerFilter === k ? { background: r.color } : {}} onClick={() => setRetailerFilter(retailerFilter === k ? "all" : k)}>{r.name}</button>))}
        </div>

        <div className="bar">
          <div className="srch"><SearchIcon /><input placeholder="Traži po brendu, artiklu ili retaileru..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="sel"><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">Sve kategorije</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown /></div>
          <div className="sel"><select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}><option value="all">Svi brendovi</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select><ChevronDown /></div>
          <button className="btn" onClick={exportCSV}><DownloadIcon />Export CSV</button>
          <button className="btn btn-a" onClick={() => setShowModal(true)}><MailIcon />Pretplata</button>
        </div>

        <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 12, fontFamily: "var(--m)" }}>{paged.length} od {data.length} promo artikala</div>

        <div className="tbl"><div className="tbl-s">
          <table><thead><tr>
            <th className={sortField === "retailer" ? "on" : ""} onClick={() => toggle("retailer")}>Retailer<Arrow f="retailer" /></th>
            <th className={sortField === "brand" ? "on" : ""} onClick={() => toggle("brand")}>Brand<Arrow f="brand" /></th>
            <th className={sortField === "article" ? "on" : ""} onClick={() => toggle("article")}>Artikl<Arrow f="article" /></th>
            <th>Veličina</th>
            <th className={sortField === "category" ? "on" : ""} onClick={() => toggle("category")}>Kategorija<Arrow f="category" /></th>
            <th className={sortField === "regularPrice" ? "on" : ""} onClick={() => toggle("regularPrice")}>Reg. cijena<Arrow f="regularPrice" /></th>
            <th className={sortField === "promoPrice" ? "on" : ""} onClick={() => toggle("promoPrice")}>Akcija<Arrow f="promoPrice" /></th>
            <th className={sortField === "discountPct" ? "on" : ""} onClick={() => toggle("discountPct")}>Popust<Arrow f="discountPct" /></th>
            <th>Tip akcije</th>
            <th>Vrijedi</th>
          </tr></thead>
          <tbody>{paged.map((item, i) => { const r = RETAILERS[item.retailer]; return (
            <tr key={item.id} className="fr" style={{ animationDelay: `${i * 15}ms` }}>
              <td><div className="rb"><div className="rd" style={{ background: r?.color }}>{r?.logo}</div>{r?.name}</div></td>
              <td><strong style={{ color: "var(--t1)" }}>{item.brand}</strong></td>
              <td style={{ color: "var(--t2)" }}>{item.article}</td>
              <td><span className="sz">{item.size}</span></td>
              <td style={{ color: "var(--t2)", fontSize: 12 }}>{item.category}</td>
              <td><span className="pr">{item.regularPrice ? `€${item.regularPrice.toFixed(2)}` : "—"}</span></td>
              <td><span className="pc" style={{ color: "var(--grn)" }}>{item.promoPrice ? `€${item.promoPrice.toFixed(2)}` : "—"}</span></td>
              <td><span className={`db ${dc(item.discountPct)}`}>-{item.discountPct}%</span></td>
              <td><span className="pt">{item.promoType}</span></td>
              <td style={{ fontSize: 11, fontFamily: "var(--m)", color: "var(--t3)", lineHeight: 1.6 }}>{item.validFrom}<br/>→ {item.validTo}</td>
            </tr>
          ); })}</tbody></table>
        </div>
        <div className="tf">
          <span>Str. {page} od {tp} · {data.length} ukupno</span>
          <div className="pg">
            <button className="pb" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
            {Array.from({ length: Math.min(tp, 7) }, (_, i) => { let p: number; if (tp <= 7) p = i + 1; else if (page <= 4) p = i + 1; else if (page >= tp - 3) p = tp - 6 + i; else p = page - 3 + i; return <button key={p} className={`pb ${p === page ? "on" : ""}`} onClick={() => setPage(p)}>{p}</button>; })}
            <button className="pb" disabled={page === tp} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div></div>

        <div className="steps">
          {[
            { s: "01", t: "Scan", d: "Katalozi se skeniraju svakog četvrtka sa 7 hrvatskih retailera" },
            { s: "02", t: "Extract", d: "AI (Claude Vision) izvlači brand, artikl, veličinu, cijenu, tip akcije" },
            { s: "03", t: "Segment", d: "Proizvodi se kategoriziraju i uspoređuju cross-retailer" },
            { s: "04", t: "Deliver", d: "Dashboard + CSV export + tjedni email digest" },
          ].map(x => (
            <div key={x.s}>
              <div style={{ fontFamily: "var(--m)", fontSize: 28, fontWeight: 700, color: "var(--acc)", marginBottom: 8 }}>{x.s}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{x.t}</div>
              <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>{x.d}</div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="mo" onClick={() => { setShowModal(false); setSent(false); }}>
          <div className="md" onClick={e => e.stopPropagation()}>
            {!sent ? (<>
              <h2>Pretplata na tjedni report</h2>
              <p>PromoRadar digest stiže na email svaki četvrtak popodne s najnovijim promo podacima svih retailera.</p>
              <input type="email" placeholder="vas@email.com" autoFocus />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)", cursor: "pointer" }}><input type="checkbox" defaultChecked /> Puni tjedni report (svi retaileri)</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)", cursor: "pointer", marginTop: 8 }}><input type="checkbox" /> Samo najdublji popusti (&gt;30%)</label>
              </div>
              <div className="ma"><button className="btn" onClick={() => { setShowModal(false); setSent(false); }}>Odustani</button><button className="btn btn-a" onClick={() => setSent(true)}>Pretplati se</button></div>
            </>) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <h2 style={{ marginBottom: 8 }}>Pretplaćeni ste!</h2>
                <p>Prvi PromoRadar report stiže ovaj četvrtak.</p>
                <button className="btn btn-a" style={{ margin: "16px auto 0" }} onClick={() => { setShowModal(false); setSent(false); }}>OK</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── EXPORT ─────────────────────────────────────────────────────────────────
export default function Home() {
  return <PromoRadar />;
}