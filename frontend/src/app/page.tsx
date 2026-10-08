"use client";

import { useState, useEffect, useCallback } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";
import { ethers, type Eip1193Provider } from "ethers";
import axios from "axios";
import { toast } from "sonner";
import { Header, FilterBar, CampaignCard, Campaign } from "./components";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [walletType, setWalletType] = useState<"freighter" | "metamask" | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donateAmount, setDonateAmount] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applyFormData, setApplyFormData] = useState({
    title: "",
    category: "education",
    token_type: "SPORTS",
    target_amount: "",
    recipient_address: "",
    description: "",
    applicant_name: "",
  });

  const API_URL = "http://127.0.0.1:8000";

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/campaigns`);
      setCampaigns(res.data);
    } catch (err) {
      console.error("Kampanyalar yüklenemedi", err);
      toast.error("Kampanyalar yüklenemedi. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setCampaignsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    void Promise.resolve().then(fetchCampaigns);
  }, [fetchCampaigns]);

  const connectFreighter = async () => {
    try {
      if (await isConnected()) {
        const accessObj = await requestAccess();
        if (accessObj.address) {
          setAccount(accessObj.address);
          setWalletType("freighter");
          fetchBalance(accessObj.address);
          toast.success("Freighter cüzdanı bağlandı.");
        } else {
          toast.error("Freighter cüzdan erişimi verilmedi.");
        }
      } else {
        toast.error("Freighter eklentisi bulunamadı.");
      }
    } catch (err) {
      console.error("Freighter connection error:", err);
      toast.error("Freighter cüzdanına bağlanılamadı.");
    }
  };

  const connectMetaMask = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setWalletType("metamask");
          const balanceWei = await provider.getBalance(accounts[0]);
          setBalance(parseFloat(ethers.formatEther(balanceWei)));
          toast.success("MetaMask cüzdanı bağlandı.");
        }
      } catch (err) {
        console.error("MetaMask connection error:", err);
        toast.error("MetaMask bağlantı isteği reddedildi.");
      }
    } else {
      toast.error("MetaMask tarayıcınızda yüklü değil.");
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      const res = await axios.get(`${API_URL}/wallet/balances/${address}`);
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Bakiye çekilemedi", err);
    }
  };

  const handleApplyCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyFormData.title || !applyFormData.target_amount || !applyFormData.recipient_address) {
      toast.error("Lütfen gerekli tüm alanları doldurun.");
      return;
    }

    const toastId = toast.loading("Başvurunuz gönderiliyor...");
    try {
      setLoading(true);
      await axios.post(`${API_URL}/campaigns/apply`, {
        title: applyFormData.title,
        category: applyFormData.category,
        token_type: applyFormData.token_type,
        target_amount: Number(applyFormData.target_amount),
        recipient_address: applyFormData.recipient_address,
        description: applyFormData.description,
        applicant_name: applyFormData.applicant_name,
      });

      toast.dismiss(toastId);
      toast.success("Başvurunuz alındı. Yönetici onayından sonra yayınlanacaktır.");
      setShowApplyModal(false);
      setApplyFormData({
        title: "",
        category: "education",
        token_type: "SPORTS",
        target_amount: "",
        recipient_address: "",
        description: "",
        applicant_name: "",
      });
    } catch (err) {
      console.error("Campaign application error:", err);
      toast.dismiss(toastId);
      toast.error("Başvuru gönderilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!account || !selectedCampaign || donateAmount <= 0) {
      toast.error("Destek olmak için cüzdanınızı bağlayıp geçerli bir tutar girin.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Destek işlemi gerçekleştiriliyor...");

    let currentTxHash = "mock_tx_hash_" + Date.now();

    try {
      if (walletType === "metamask") {
        const ethereum = window.ethereum;
        if (!ethereum) {
          throw new Error("MetaMask is not available.");
        }
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();

        const tx = await signer.sendTransaction({
          to: selectedCampaign.recipient_address.startsWith("0x")
            ? selectedCampaign.recipient_address
            : "0x0000000000000000000000000000000000000000",
          value: ethers.parseEther("0.001"),
        });
        const receipt = await tx.wait();
        if (receipt) {
          currentTxHash = receipt.hash;
        }
      }

      await axios.post(`${API_URL}/campaigns/support`, {
        campaign_id: selectedCampaign.id,
        donor_address: account,
        amount: Number(donateAmount),
        token_type: selectedCampaign.token_type || "SPORTS",
        tx_hash: currentTxHash,
        chain_type: walletType === "metamask" ? "evm" : "stellar"
      });

      toast.dismiss(toastId);
      toast.success(`${selectedCampaign.title} kampanyasına desteğiniz iletildi.`);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (err) {
      console.error("Support error:", err);
      toast.dismiss(toastId);
      toast.error("İşlem başarısız oldu veya cüzdan onayı verilmedi.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const totalRaised = campaigns.reduce((total, campaign) => total + campaign.raised_amount, 0);
  const completedCampaigns = campaigns.filter(
    (campaign) => campaign.target_amount > 0 && campaign.raised_amount >= campaign.target_amount
  ).length;
  const activeCampaigns = campaigns.length - completedCampaigns;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/35 via-slate-950 to-slate-950 px-4 pb-24 pt-5 text-white sm:px-6 sm:pt-8">
      <div className="pointer-events-none absolute -left-40 top-48 h-80 w-80 rounded-full bg-emerald-500/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-48 top-[28rem] h-96 w-96 rounded-full bg-indigo-500/[0.06] blur-3xl" />
      <div className="relative mx-auto max-w-7xl space-y-7 sm:space-y-9">
        <Header
          account={account}
          walletType={walletType}
          balance={balance}
          onOpenApplyModal={() => setShowApplyModal(true)}
          onConnectMetaMask={connectMetaMask}
          onConnectFreighter={connectFreighter}
        />

        <section
          aria-label="Platform istatistikleri"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {[
            {
              label: "Toplam toplanan fon",
              value: campaignsLoading
                ? "—"
                : totalRaised.toLocaleString("tr-TR", { maximumFractionDigits: 2 }),
              detail: "Listelenen projelerin varlık toplamı",
              accent: "text-emerald-300",
              glow: "bg-emerald-400/[0.07]",
              icon: "↗",
            },
            {
              label: "Aktif kampanyalar",
              value: campaignsLoading ? "—" : activeCampaigns.toLocaleString("tr-TR"),
              detail: "Destek kabul eden proje",
              accent: "text-cyan-300",
              glow: "bg-cyan-400/[0.06]",
              icon: "◉",
            },
            {
              label: "Başarılı tamamlanan",
              value: campaignsLoading ? "—" : completedCampaigns.toLocaleString("tr-TR"),
              detail: "Fonlama hedefine ulaşan",
              accent: "text-indigo-300",
              glow: "bg-indigo-400/[0.07]",
              icon: "✓",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative isolate overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/45 p-4 shadow-lg shadow-black/10 backdrop-blur-md transition hover:border-slate-700 sm:p-5"
            >
              <div className={`pointer-events-none absolute -right-8 -top-10 -z-10 h-28 w-28 rounded-full ${stat.glow} blur-2xl`} />
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-400 sm:text-sm">{stat.label}</p>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/40 text-sm ${stat.accent}`}>
                  {stat.icon}
                </span>
              </div>
              <p className={`mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{stat.detail}</p>
            </div>
          ))}
        </section>

        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div>
          <div className="mb-4 flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Topluluk etkisi</p>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Şeffaf destek projeleri</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs tabular-nums text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {filteredCampaigns.length} proje görüntüleniyor
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {campaignsLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30"
                >
                  <div className="flex justify-between gap-4">
                    <div className="h-6 w-28 rounded-full bg-slate-800" />
                    <div className="h-4 w-16 rounded bg-slate-800" />
                  </div>
                  <div className="mt-5 h-6 w-3/4 rounded-lg bg-slate-800" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-800/80" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-800/80" />
                  <div className="mt-7 h-3 w-full rounded-full bg-slate-800" />
                  <div className="mt-5 h-12 w-full rounded-xl bg-slate-800" />
                </div>
              ))
            ) : filteredCampaigns.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/50 px-6 py-12 text-center text-slate-400 shadow-xl shadow-slate-950/20 backdrop-blur-md sm:py-16">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-xl text-slate-500">⌕</span>
                <p className="font-semibold text-slate-200">Henüz eşleşen proje yok</p>
                <p className="mt-2 text-sm text-slate-500">Arama kriterlerinizi değiştirebilir veya yeni bir proje başlatabilirsiniz.</p>
              </div>
            ) : (
              filteredCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onSelect={setSelectedCampaign} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODALLAR */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="my-8 max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl sm:p-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-emerald-400">Yeni Kampanya Başvurusu</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleApplyCampaignSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Kampanya Başlığı *</label>
                <input
                  type="text"
                  placeholder="Örn: Mahalle kütüphanesi için kitap desteği"
                  value={applyFormData.title}
                  onChange={(e) => setApplyFormData({ ...applyFormData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kategori</label>
                  <select
                    value={applyFormData.category}
                    onChange={(e) => setApplyFormData({ ...applyFormData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  >
                    <option value="education">Eğitim</option>
                    <option value="solidarity">Dayanışma</option>
                    <option value="civil_society">Sivil toplum</option>
                    <option value="individual">Bireysel projeler</option>
                    <option value="talent">Genç yetenek</option>
                    <option value="club_infrastructure">Kulüp altyapısı</option>
                    <option value="martial_arts">Dövüş / bireysel sporlar</option>
                    <option value="tournament">Turnuva / seyahat</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fonlama varlığı *</label>
                  <select
                    value={applyFormData.token_type}
                    onChange={(e) => setApplyFormData({ ...applyFormData, token_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-bold text-emerald-300 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  >
                    <option value="SPORTS">$SPORTS — mevcut platform varlığı</option>
                    <option value="ATH">$ATH — mevcut platform varlığı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hedef Tutar (TL / $SPORTS) *</label>
                <input
                  type="number"
                  placeholder="Örn: 15000"
                  value={applyFormData.target_amount}
                  onChange={(e) => setApplyFormData({ ...applyFormData, target_amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Başvuran kişi / kurum *</label>
                <input
                  type="text"
                  placeholder="Örn: Eğitim dayanışma topluluğu"
                  value={applyFormData.applicant_name}
                  onChange={(e) => setApplyFormData({ ...applyFormData, applicant_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Fonun aktarılacağı cüzdan adresi (Stellar / EVM) *</label>
                <input
                  type="text"
                  placeholder="0x... veya G..."
                  value={applyFormData.recipient_address}
                  onChange={(e) => setApplyFormData({ ...applyFormData, recipient_address: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Açıklama & Detaylar</label>
                <textarea
                  rows={3}
                  placeholder="Toplanan fonun kullanım amacı ve detayları..."
                  value={applyFormData.description}
                  onChange={(e) => setApplyFormData({ ...applyFormData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 min-h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Başvuruyu Onaya Gönder"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-emerald-400">Doğrudan Fon Desteği</h3>
              <button onClick={() => setSelectedCampaign(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">{selectedCampaign.beneficiary_name}</p>
              <h4 className="text-lg font-bold text-white mt-1">{selectedCampaign.title}</h4>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Destek Miktarı</label>
              <input
                type="number"
                value={donateAmount}
                onChange={(e) => setDonateAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {!account && (
              <p className="text-xs text-amber-400 text-center">
                ⚠️ Bağış yapabilmek için lütfen önce cüzdanınızı bağlayın.
              </p>
            )}

            <button
              onClick={handleDonate}
              disabled={loading || !account}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              {loading ? "Cüzdandan Onay Bekleniyor..." : "Cüzdan İle İmzala ve Gönder"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}