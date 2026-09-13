import { 
  getUserSettings, 
  getCategories,
  getIncomeSources,
  getFixedExpenses,
  getSavingsAllocations
} from "@/actions/budget";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const [
    settings, 
    categories, 
    incomeSources, 
    fixedExpenses, 
    savingsAllocations
  ] = await Promise.all([
    getUserSettings(),
    getCategories(),
    getIncomeSources(),
    getFixedExpenses(),
    getSavingsAllocations(),
  ]);

  return (
    <SettingsContent 
      settings={settings} 
      categories={categories} 
      incomeSources={incomeSources}
      fixedExpenses={fixedExpenses}
      savingsAllocations={savingsAllocations}
    />
  );
}
