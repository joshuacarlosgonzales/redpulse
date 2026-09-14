// app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Database,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Trash2,
  RefreshCw,
  Clock,
  Users,
  Building,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    donorRequests: boolean;
    hospitalRegistrations: boolean;
    inventoryAlerts: boolean;
    systemUpdates: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    showBadges: boolean;
  };
  system: {
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    requireEmailVerification: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    supportEmail: string;
  };
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      donorRequests: true,
      hospitalRegistrations: true,
      inventoryAlerts: true,
      systemUpdates: false,
    },
    appearance: {
      theme: "light",
      compactMode: false,
      showBadges: true,
    },
    system: {
      maintenanceMode: false,
      allowNewRegistrations: true,
      requireEmailVerification: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
    },
    contact: {
      email: "admin@redpulse.com",
      phone: "+1 (555) 000-0000",
      address: "123 Blood Drive St, City, State 12345",
      supportEmail: "support@redpulse.com",
    },
  });

  const [systemStatus, setSystemStatus] = useState({
    serverStatus: "online",
    databaseStatus: "online",
    cacheStatus: "online",
    lastBackup: new Date().toISOString(),
    uptime: "99.9%",
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    fetchSettings();
    fetchSystemStatus();
    loadTheme();
  }, []);

  const loadTheme = () => {
    const savedTheme = localStorage.getItem("redpulse-theme");
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: isDark ? "dark" : "light"
      }
    }));
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      if (data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/admin/system/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.data || systemStatus);
      }
    } catch (error) {
      console.error("Error fetching system status:", error);
    }
  };

  /* =========================================================
     UPDATE SETTINGS
  ========================================================= */

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage({
          type: 'error',
          text: 'You must be logged in'
        });
        return;
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Apply theme if changed
      if (settings.appearance.theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("redpulse-theme", "dark");
        setIsDarkMode(true);
      } else if (settings.appearance.theme === "light") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("redpulse-theme", "light");
        setIsDarkMode(false);
      } else {
        // System theme - check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("redpulse-theme", "dark");
          setIsDarkMode(true);
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("redpulse-theme", "light");
          setIsDarkMode(false);
        }
      }

      setMessage({
        type: 'success',
        text: 'Settings saved successfully'
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: 'error',
        text: 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     UPDATE SYSTEM STATUS
  ========================================================= */

  const handleClearCache = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/admin/system/clear-cache", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to clear cache");
      }

      setMessage({
        type: 'success',
        text: 'Cache cleared successfully'
      });

      await fetchSystemStatus();
    } catch (error) {
      console.error("Error clearing cache:", error);
      setMessage({
        type: 'error',
        text: 'Failed to clear cache'
      });
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-red-600" />
          <p className="mt-4 text-sm text-zinc-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Configure and manage your RedPulse admin settings
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
            : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-600" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Server</span>
                <Badge
                  variant="outline"
                  className={
                    systemStatus.serverStatus === "online"
                      ? "border-green-500 text-green-600"
                      : "border-red-500 text-red-600"
                  }
                >
                  {systemStatus.serverStatus === "online" ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {systemStatus.serverStatus}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Database</span>
                <Badge
                  variant="outline"
                  className={
                    systemStatus.databaseStatus === "online"
                      ? "border-green-500 text-green-600"
                      : "border-red-500 text-red-600"
                  }
                >
                  {systemStatus.databaseStatus === "online" ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {systemStatus.databaseStatus}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Cache</span>
                <Badge
                  variant="outline"
                  className={
                    systemStatus.cacheStatus === "online"
                      ? "border-green-500 text-green-600"
                      : "border-red-500 text-red-600"
                  }
                >
                  {systemStatus.cacheStatus === "online" ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {systemStatus.cacheStatus}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Uptime</span>
                <span className="text-sm font-medium text-green-600">
                  {systemStatus.uptime}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            Last backup: {new Date(systemStatus.lastBackup).toLocaleString()}
          </div>
          <Button variant="outline" size="sm" onClick={handleClearCache}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Cache
          </Button>
        </CardFooter>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Channels</h4>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-zinc-500">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          email: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-zinc-500">
                        Receive in-app notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          push: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Events</h4>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">Donor Requests</p>
                      <p className="text-xs text-zinc-500">
                        When a donor submits a new request
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.donorRequests}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          donorRequests: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Hospital Registrations
                      </p>
                      <p className="text-xs text-zinc-500">
                        When a new hospital registers
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.hospitalRegistrations}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          hospitalRegistrations: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">Inventory Alerts</p>
                      <p className="text-xs text-zinc-500">
                        When blood inventory is low
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.inventoryAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          inventoryAlerts: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the admin interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Theme</Label>
                {/* FIXED: Handle null value from Select */}
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value) => {
                    // Handle null value from Select
                    if (value === null) return;
                    // Update theme state
                    setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        theme: value as "light" | "dark" | "system",
                      },
                    });
                    // Apply theme immediately
                    if (value === "dark") {
                      document.documentElement.classList.add("dark");
                      localStorage.setItem("redpulse-theme", "dark");
                      setIsDarkMode(true);
                    } else if (value === "light") {
                      document.documentElement.classList.remove("dark");
                      localStorage.setItem("redpulse-theme", "light");
                      setIsDarkMode(false);
                    } else {
                      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                      if (prefersDark) {
                        document.documentElement.classList.add("dark");
                        localStorage.setItem("redpulse-theme", "dark");
                        setIsDarkMode(true);
                      } else {
                        document.documentElement.classList.remove("dark");
                        localStorage.setItem("redpulse-theme", "light");
                        setIsDarkMode(false);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Compact Mode</p>
                  <p className="text-xs text-zinc-500">
                    Reduce spacing and make the interface more compact
                  </p>
                </div>
                <Switch
                  checked={settings.appearance.compactMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        compactMode: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Show Badges</p>
                  <p className="text-xs text-zinc-500">
                    Display status badges on items and notifications
                  </p>
                </div>
                <Switch
                  checked={settings.appearance.showBadges}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        showBadges: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Current Theme: {isDarkMode ? 'Dark' : 'Light'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {settings.appearance.theme === 'system' ? 'Following system preference' : `Manually set to ${settings.appearance.theme}`}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-medium">Maintenance Mode</p>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Put the system in maintenance mode (users will see a maintenance page)
                  </p>
                </div>
                <Switch
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        maintenanceMode: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Allow New Registrations</p>
                  <p className="text-xs text-zinc-500">
                    Allow new users to register on the platform
                  </p>
                </div>
                <Switch
                  checked={settings.system.allowNewRegistrations}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        allowNewRegistrations: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Require Email Verification</p>
                  <p className="text-xs text-zinc-500">
                    Require users to verify their email address
                  </p>
                </div>
                <Switch
                  checked={settings.system.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        requireEmailVerification: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.system.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        system: {
                          ...settings.system,
                          sessionTimeout: parseInt(e.target.value) || 60,
                        },
                      })
                    }
                    min={5}
                    max={480}
                  />
                  <p className="text-xs text-zinc-500">
                    Time after which inactive sessions expire
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.system.maxLoginAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        system: {
                          ...settings.system,
                          maxLoginAttempts: parseInt(e.target.value) || 5,
                        },
                      })
                    }
                    min={3}
                    max={20}
                  />
                  <p className="text-xs text-zinc-500">
                    Number of failed login attempts before account lockout
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="contactEmail"
                        value={settings.contact.email}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: {
                              ...settings.contact,
                              email: e.target.value,
                            },
                          })
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="supportEmail"
                        value={settings.contact.supportEmail}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: {
                              ...settings.contact,
                              supportEmail: e.target.value,
                            },
                          })
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="contactPhone"
                        value={settings.contact.phone}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: {
                              ...settings.contact,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="address"
                        value={settings.contact.address}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: {
                              ...settings.contact,
                              address: e.target.value,
                            },
                          })
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => {
                  // Reset to default settings
                  setSettings({
                    notifications: {
                      email: true,
                      push: true,
                      sms: false,
                      donorRequests: true,
                      hospitalRegistrations: true,
                      inventoryAlerts: true,
                      systemUpdates: false,
                    },
                    appearance: {
                      theme: "light",
                      compactMode: false,
                      showBadges: true,
                    },
                    system: {
                      maintenanceMode: false,
                      allowNewRegistrations: true,
                      requireEmailVerification: true,
                      sessionTimeout: 60,
                      maxLoginAttempts: 5,
                    },
                    contact: {
                      email: "admin@redpulse.com",
                      phone: "+1 (555) 000-0000",
                      address: "123 Blood Drive St, City, State 12345",
                      supportEmail: "support@redpulse.com",
                    },
                  });
                  // Reset theme to light
                  document.documentElement.classList.remove("dark");
                  localStorage.setItem("redpulse-theme", "light");
                  setIsDarkMode(false);
                  setMessage({
                    type: 'success',
                    text: 'Settings reset to default values'
                  });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset All Settings
              </Button>

              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}