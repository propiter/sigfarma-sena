import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { InventorySettings } from '@/components/settings/InventorySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { Settings as SettingsIcon, Building2, Package, Palette, Shield } from 'lucide-react';

export function Settings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<any>({});
  const [originalSettings, setOriginalSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if there are changes
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setOriginalSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        valor: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setOriginalSettings(settings);
        setHasChanges(false);
        // Show success message
      } else {
        throw new Error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const tabs = [
    {
      value: 'general',
      label: 'General',
      icon: Building2,
      component: GeneralSettings
    },
    {
      value: 'inventory',
      label: 'Inventario',
      icon: Package,
      component: InventorySettings
    },
    {
      value: 'appearance',
      label: 'Apariencia',
      icon: Palette,
      component: AppearanceSettings
    },
    {
      value: 'security',
      label: 'Seguridad',
      icon: Shield,
      component: SecuritySettings,
      adminOnly: true
    }
  ].filter(tab => !tab.adminOnly || user?.rol === 'administrador');

  return (
    <div className="container-responsive py-6 space-y-6">
      {/* Header */}
      <SettingsHeader
        hasChanges={hasChanges}
        isSaving={saving}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Settings Content */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-900/30"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-6">
              <Component
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}