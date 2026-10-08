"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  category: string;
  target_amount: number;
  recipient_address: string;
  description: string;
  applicant_name: string;
  status: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const API_URL = "http://127.0.0.1:8000";

  const getAdminHeaders = useCallback((token?: string) => {
    const activeToken = token || localStorage.getItem("admin_token") || "";
    return {
      headers: {
        "X-Admin-Token": activeToken,
      },
    };
  }, []);

  const fetchPendingCampaigns = useCallback(async (token?: string) => {
    try {
      const res = await axios.get(`${API_URL}/admin/pending-campaigns`, getAdminHeaders(token));
      setPendingCampaigns(res.data);
    } catch (err) {
      console.error("Bekleyen başvurular çekilemedi", err);
    }
  }, [API_URL, getAdminHeaders]);

  const fetchAllCampaigns = useCallback(async (token?: string) => {
    try {
      const res = await axios.get(`${API_URL}/admin/all-campaigns`, getAdminHeaders(token));
      setAllCampaigns(res.data);
    } catch (err) {
      console.error("Admin campaign fetch failed; trying the public list.", err);
      try {
        const resPublic = await axios.get(`${API_URL}/campaigns`);
        setAllCampaigns(resPublic.data);
      } catch (fallbackError) {
        console.error("Tüm kampanyalar çekilemedi", fallbackError);
      }
    }
  }, [API_URL, getAdminHeaders]);

  const fetchAllData = useCallback(async (token?: string) => {
    setDataLoading(true);
    await Promise.all([
      fetchPendingCampaigns(token),
      fetchAllCampaigns(token)
    ]);
    setDataLoading(false);
  }, [fetchAllCampaigns, fetchPendingCampaigns]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      void Promise.resolve().then(() => setIsAuthenticated(true));
      void Promise.resolve().then(() => fetchAllData(token));
    }
  }, [fetchAllData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/login`, {
        username: username,
        password: password,
      });

      const token = res.data.access_token;
      localStorage.setItem("admin_token", token);
      setIsAuthenticated(true);
      toast.success("Yönetici girişi başarılı!");
      fetchAllData(token);
    } catch (err) {
      console.error("Admin login error:", err);
      toast.error("Hatalı Kullanıcı Adı veya Şifre!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    toast.info("Oturum kapatıldı.");
  };

  const handleAction = async (campaignId: string, action: "approve" | "reject") => {
    setLoading(true);
    const toastId = toast.loading("İşlem gerçekleştiriliyor...");
    try {
      await axios.post(
        `${API_URL}/admin/approve-campaign`,
        {
          campaign_id: campaignId,
          action: action,
        },
        getAdminHeaders()
      );
      
      toast.dismiss(toastId);
      if (action === "approve") {
        toast.success("Kampanya ONAYLANDI ve yayına alındı!");
      } else {
        toast.error("Kampanya REDDEDİLDİ!");
      }
      
      fetchAllData();
    } catch (err) {
      console.error("Campaign moderation error:", err);
      toast.dismiss(toastId);
      toast.error("İşlem sırasında hata oluştu veya yetkiniz yok.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    setLoading(true);
    const toastId = toast.loading("Kampanya siliniyor...");
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`${API_URL}/admin/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": token,
        },
      });

      toast.dismiss(toastId);
      if (res.ok) {
        toast.success("Kampanya başarıyla silindi.");
        fetchAllData();
      } else {
        toast.error("Silme işlemi başarısız oldu veya yetkiniz bulunmuyor.");
      }
    } catch (err) {
      console.error("Campaign deletion error:", err);
      toast.dismiss(toastId);
      toast.error("Silme sırasında bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // GİRİŞ EKRANI
  if (!isAuthenticated) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/50 via-slate-950 to-slate-950 p-4 text-white">
        <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative w-full max-w-sm space-y-5 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 text-center shadow-2xl shadow-indigo-950/30 backdrop-blur-xl sm:p-8">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-3xl">🔒</div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">FundFlow</p>
          <h1 className="text-xl font-bold text-emerald-400">Yönetici Doğrulaması</h1>
          <p className="text-sm leading-6 text-slate-400">Fonlama başvurularını yönetmek için yönetici bilgilerinizi girin.</p>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-center text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
              required
            />
            <input
              type="password"
              placeholder="Admin Şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-center font-mono text-sm text-emerald-300 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Giriş Yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const displayedCampaigns = activeTab === "pending" ? pendingCampaigns : allCampaigns;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/35 via-slate-950 to-slate-950 px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">FundFlow</p>
            <h1 className="flex items-center gap-2 text-2xl font-black text-emerald-300">
              🛡️ Yönetim Paneli
            </h1>
            <p className="mt-1 text-sm text-slate-400">Gelen proje ve fonlama başvurularını yönetin</p>
          </div>
          <button
            onClick={handleLogout}
            className="min-h-11 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
          >
            Çıkış Yap
          </button>
        </div>

        {/* SEKMELER (TABS) */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/35 p-1.5 backdrop-blur-lg">
          <button
            onClick={() => setActiveTab("pending")}
            className={`min-h-11 rounded-xl px-4 py-2 text-sm font-bold transition whitespace-nowrap ${
              activeTab === "pending"
                ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-[inset_0_-2px_0_rgb(52_211_153)]"
                : "border border-transparent bg-transparent text-slate-500 hover:text-white"
            }`}
          >
            ⏳ Onay Bekleyenler ({pendingCampaigns.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`min-h-11 rounded-xl px-4 py-2 text-sm font-bold transition whitespace-nowrap ${
              activeTab === "all"
                ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-[inset_0_-2px_0_rgb(52_211_153)]"
                : "border border-transparent bg-transparent text-slate-500 hover:text-white"
            }`}
          >
            ⭐ Tüm / Yayındaki Kampanyalar ({allCampaigns.length})
          </button>
        </div>

        <div>
          {/* SKELETON / LOADING DURUMU */}
          {dataLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="flex animate-pulse flex-col items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/20 md:flex-row"
                >
                  <div className="space-y-3 w-full max-w-xl">
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-slate-800 rounded-full"></div>
                      <div className="h-5 w-24 bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-slate-800 rounded-lg"></div>
                    <div className="h-4 w-full bg-slate-800/60 rounded-lg"></div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="h-10 w-20 bg-slate-800 rounded-xl"></div>
                    <div className="h-10 w-24 bg-slate-800 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 shadow-xl shadow-slate-950/20">
              {activeTab === "pending"
                ? "Şu an onay bekleyen herhangi bir başvuru bulunmuyor."
                : "Sistemde kayıtlı kampanya bulunamadı."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedCampaigns.map((c) => (
                <div
                  key={c.id}
                  className="group flex flex-col items-start justify-between gap-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-emerald-950/20 md:flex-row md:items-center md:p-6"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {c.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID: {c.id}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                          c.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : c.status === "pending"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{c.title}</h3>
                    <p className="text-sm text-slate-400">{c.description}</p>
                    <div className="text-xs text-slate-500 pt-2 flex flex-wrap gap-4">
                      <span>
                        👤 Başvuran: <b className="text-slate-300">{c.applicant_name}</b>
                      </span>
                      <span>
                        🎯 Hedef: <b className="text-emerald-400">{c.target_amount.toLocaleString("tr-TR")} TL</b>
                      </span>
                      <span>
                        👛 Cüzdan: <b className="font-mono text-slate-300">{c.recipient_address}</b>
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-2 md:w-auto">
                    <button
                      onClick={() => setCampaignToDelete(c.id)}
                      disabled={loading}
                      className="min-h-11 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                      title="Sistemden Tamamen Sil"
                    >
                      🗑️ Sil
                    </button>
                    {c.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(c.id, "reject")}
                          disabled={loading}
                          className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50 md:flex-none"
                        >
                          Reddet
                        </button>
                        <button
                          onClick={() => handleAction(c.id, "approve")}
                          disabled={loading}
                          className="min-h-11 flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-50 md:flex-none"
                        >
                          Onayla
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {campaignToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
        >
          <section
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            aria-modal="true"
            role="dialog"
            className="w-full max-w-md rounded-t-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40 sm:rounded-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-xl">!</div>
            <h2 id="delete-dialog-title" className="text-lg font-bold text-white">Projeyi kalıcı olarak sil?</h2>
            <p id="delete-dialog-description" className="mt-2 text-sm leading-6 text-slate-400">
              Bu işlem geri alınamaz. Proje ve başvuru bilgileri sistemden kaldırılacaktır.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="min-h-12 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 sm:min-h-11"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  const campaignId = campaignToDelete;
                  setCampaignToDelete(null);
                  void handleDelete(campaignId);
                }}
                className="min-h-12 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50 sm:min-h-11"
              >
                Evet, sil
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}