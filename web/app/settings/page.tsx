'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";
import { useAuth } from "../../lib/useAuth";
import { useI18n } from "../../src/i18n/I18nProvider";
import { api } from "../../lib/api";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { logout, token, user } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const confirmationWord = "DELETE";

  const downloadJson = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taskup-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.get("/api/auth/account/export", token || undefined);
      setExportData(data);
      downloadJson(data);
      alert(t("gdpr.exportSuccess"));
    } catch (err) {
      const parsed = parseApiError(err);
      alert(getUserFriendlyMessage(parsed, t) || t("gdpr.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== confirmationWord) {
      alert(t("gdpr.deleteWarning"));
      return;
    }
    setDeleting(true);
    try {
      await api.post("/api/auth/account/delete", {}, token || undefined);
      alert(t("gdpr.deleteSuccess"));
      logout();
      router.push("/");
    } catch (err) {
      const parsed = parseApiError(err);
      alert(getUserFriendlyMessage(parsed, t) || t("gdpr.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Protected>
      <DashboardShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-white/5 border-white/10 space-y-3">
            <div className="font-semibold text-white">{t("settings.profileTitle")}</div>
            <Input placeholder={t("auth.fullName")} defaultValue={user?.full_name} />
            <Input placeholder={t("auth.email")} defaultValue={user?.email} />
            <Button size="sm">{t("settings.saveProfile")}</Button>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10 space-y-3">
            <div className="font-semibold text-white">{t("settings.preferencesTitle")}</div>
            <label className="text-sm text-gray-300">{t("settings.language")}</label>
            <select
              className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
            >
              <option value="en">English</option>
              <option value="nb">Norsk</option>
              <option value="sv">Svenska</option>
              <option value="da">Dansk</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
            <Input placeholder={`${t("settings.currency")} (NOK)`} />
            <Button size="sm" variant="outline">
              {t("settings.savePreferences")}
            </Button>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{t("gdpr.exportTitle")}</div>
                <div className="text-sm text-gray-300">{t("gdpr.exportDesc")}</div>
              </div>
              <Button size="sm" onClick={handleExport} disabled={exporting}>
                {exporting ? t("wallet.loading") : t("gdpr.exportCta")}
              </Button>
            </div>
            {exportData ? (
              <pre className="text-xs bg-black/60 border border-white/10 rounded-xl p-3 max-h-64 overflow-auto text-gray-200">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            ) : null}
          </Card>
          <Card className="p-4 bg-red-900/30 border border-red-500/40 space-y-3 md:col-span-2">
            <div className="font-semibold text-red-200">{t("gdpr.deleteTitle")}</div>
            <div className="text-sm text-red-100/80">{t("gdpr.deleteDesc")}</div>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("gdpr.deletePlaceholder")}
              className="border-red-500/40"
            />
            <Button variant="outline" className="border-red-500/60 text-red-200 hover:bg-red-900/30" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("wallet.loading") : t("gdpr.deleteCta")}
            </Button>
          </Card>
          <Button variant="outline" onClick={logout} className="w-fit">
            {t("auth.logout")}
          </Button>
        </div>
      </DashboardShell>
    </Protected>
  );
}
