"use client";

import React from "react";

export interface Campaign {
  id: string;
  title: string;
  category: string;
  target_amount: number;
  raised_amount: number;
  recipient_address: string;
  description: string;
  beneficiary_name?: string;
  token_type: string;
}

// Header Bileşeni
export const Header = ({
  account,
  walletType,
  balance,
  onOpenApplyModal,
  onConnectMetaMask,
  onConnectFreighter,
}: {
  account: string;
  walletType: "freighter" | "metamask" | null;
  balance: number | null;
  onOpenApplyModal: () => void;
  onConnectMetaMask: () => void;
  onConnectFreighter: () => void;
}) => (
  <header className="relative isolate flex flex-col items-stretch justify-between gap-8 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/40 px-5 py-8 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:px-12 lg:py-14">
    <div className="pointer-events-none absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full bg-emerald-400/[0.07] blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-72 w-72 rounded-full bg-indigo-400/[0.08] blur-3xl" />
    <div className="relative max-w-2xl">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200 sm:text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgb(110_231_183)]" />
        Şeffaf finansmanın yeni yolu
      </div>
      <h1 className="text-5xl font-black tracking-[-0.06em] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-500 bg-clip-text text-transparent sm:text-6xl lg:text-7xl">
        FundFlow<span className="text-emerald-300">.</span>
      </h1>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 sm:text-sm">
        Merkeziyetsiz &amp; Şeffaf Destek Platformu
      </p>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
        Eğitimden dayanışmaya, toplulukların ihtiyaç duyduğu kaynağı güvenle
        buluşturun. Her katkı izlenebilir, her proje görünür.
      </p>
    </div>

    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:max-w-sm lg:justify-end">
      <button
        onClick={onOpenApplyModal}
        className="min-h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.99] sm:min-h-11"
      >
        <span>＋</span> Proje başvurusu yap
      </button>

      {account && (
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-2 text-left backdrop-blur-md sm:text-right">
          <span className="text-xs text-slate-400 block">Bakiye ({walletType?.toUpperCase()})</span>
          <span className="font-bold text-emerald-400">{balance?.toFixed(4) ?? "..."}</span>
        </div>
      )}

      {!account ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onConnectMetaMask}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/55 px-3 py-3 text-xs font-semibold text-slate-300 shadow-lg shadow-black/10 backdrop-blur-md transition hover:border-slate-500 hover:bg-slate-800/80 hover:text-white sm:min-h-11 sm:text-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-orange-300/20 bg-orange-400/10 text-sm" aria-hidden="true">🦊</span>
            MetaMask
          </button>
          <button
            onClick={onConnectFreighter}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/55 px-3 py-3 text-xs font-semibold text-slate-300 shadow-lg shadow-black/10 backdrop-blur-md transition hover:border-slate-500 hover:bg-slate-800/80 hover:text-white sm:min-h-11 sm:text-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-sm" aria-hidden="true">✦</span>
            Freighter
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 font-mono text-sm text-emerald-200">
          {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      )}
    </div>
  </header>
);

// Filtreleme Bileşeni
export const FilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}: {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
}) => (
  <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/45 p-3 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-4 lg:flex-row lg:items-center">
    <div className="relative w-full shrink-0 lg:w-72">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="text"
        placeholder="Proje, kurum veya amaç ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-11 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 focus:bg-slate-950/80 focus:ring-2 focus:ring-emerald-400/10"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:text-white">✕</button>
      )}
    </div>

    <div className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-wrap lg:justify-end lg:overflow-visible">
      {[
        { id: "all", label: "Tümü" },
        { id: "education", label: "Eğitim" },
        { id: "solidarity", label: "Dayanışma" },
        { id: "civil_society", label: "Sivil toplum" },
        { id: "individual", label: "Bireysel projeler" },
        { id: "talent", label: "Genç Yetenek" },
        { id: "club_infrastructure", label: "Kulüp Altyapı" },
        { id: "martial_arts", label: "Dövüş Sporları" },
        { id: "tournament", label: "Turnuva / Seyahat" },
      ].map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id)}
          className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition duration-200 whitespace-nowrap ${
            selectedCategory === cat.id
              ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-[inset_0_-2px_0_rgb(52_211_153),0_4px_18px_rgb(16_185_129/0.08)]"
              : "border border-transparent bg-transparent text-slate-500 hover:text-white"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  </div>
);

// Kampanya Kartı Bileşeni
export const CampaignCard = ({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (c: Campaign) => void;
}) => {
  const progress = campaign.target_amount > 0
    ? Math.min(100, Math.round((campaign.raised_amount / campaign.target_amount) * 100))
    : 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-emerald-950/30 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-emerald-400/0 blur-3xl transition duration-500 group-hover:bg-emerald-400/[0.08]" />
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">
            {campaign.beneficiary_name || campaign.category}
          </span>
          <span className="text-right font-mono text-[10px] text-slate-500">ID: {campaign.id}</span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">{campaign.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{campaign.description}</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-400">Toplanan: {campaign.raised_amount.toLocaleString('tr-TR')} / {campaign.token_type}</span>
            <span className="text-emerald-300">Hedef: {campaign.target_amount.toLocaleString('tr-TR')} (%{progress})</span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${campaign.title} fonlama ilerlemesi`}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button
          onClick={() => onSelect(campaign)}
          className="mt-1 min-h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
        >
          Destek Ol
        </button>
      </div>
    </div>
  );
};