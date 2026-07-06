import React, { createContext, useContext, useEffect, useState } from "react";
import { getSchoolSettings } from "../lib/api";
import { hasSupabaseConfig } from "../lib/supabase";

// Sensible fallbacks so the app never looks broken, even before settings load
// or when running without a backend.
const DEFAULTS = {
  school_name: "SchoolBridge",
  tagline: "Parent Portal",
  logo_url: null,
  primary_color: "#12233B",
  accent_color: "#C69A3C",
  currency_symbol: "₵",
  staff_platform_url: null,
  staff_platform_label: "Staff Tools",
  contact_email: null,
};

const SettingsCtx = createContext({ settings: DEFAULTS, refresh: () => {} });
export const useSettings = () => useContext(SettingsCtx);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  async function refresh() {
    if (!hasSupabaseConfig) return;
    try {
      const s = await getSchoolSettings();
      if (s) setSettings({ ...DEFAULTS, ...s });
    } catch { /* keep defaults */ }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <SettingsCtx.Provider value={{ settings, refresh }}>
      {children}
    </SettingsCtx.Provider>
  );
}
