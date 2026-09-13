import { getUserSettings } from "@/actions/budget";
import { getCategories } from "@/actions/budget";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const [settings, categories] = await Promise.all([
    getUserSettings(),
    getCategories(),
  ]);

  return <SettingsContent settings={settings} categories={categories} />;
}
