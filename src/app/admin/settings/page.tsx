'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save,
  Bell,
  Shield,
  Database,
  Mail,
  CreditCard,
  Loader2
} from 'lucide-react';

interface SettingsData {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointments: boolean;
    payments: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
  };
  system: {
    maintenanceMode: boolean;
    registrationOpen: boolean;
    autoBackup: boolean;
    backupTime: string;
  };
  payment: {
    currency: string;
    consultationFee: number;
    platformFee: number;
    paymentMethods: string;
    refundPolicy: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    fromEmail: string;
    replyEmail: string;
    enableSSL: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data: SettingsData = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SettingsData, key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure platform settings and preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input 
                id="siteName" 
                value={settings.general.siteName}
                onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea 
                id="siteDescription" 
                value={settings.general.siteDescription}
                onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input 
                id="contactEmail" 
                type="email" 
                value={settings.general.contactEmail}
                onChange={(e) => updateSettings('general', 'contactEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input 
                id="supportPhone" 
                value={settings.general.supportPhone}
                onChange={(e) => updateSettings('general', 'supportPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Send notifications via email</p>
              </div>
              <Switch 
                checked={settings.notifications.email}
                onCheckedChange={(checked) => updateSettings('notifications', 'email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-600">Send notifications via SMS</p>
              </div>
              <Switch 
                checked={settings.notifications.sms}
                onCheckedChange={(checked) => updateSettings('notifications', 'sms', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-600">Send push notifications</p>
              </div>
              <Switch 
                checked={settings.notifications.push}
                onCheckedChange={(checked) => updateSettings('notifications', 'push', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-gray-600">Automatic appointment reminders</p>
              </div>
              <Switch 
                checked={settings.notifications.appointments}
                onCheckedChange={(checked) => updateSettings('notifications', 'appointments', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
              </div>
              <Switch 
                checked={settings.security.twoFactorAuth}
                onCheckedChange={(checked) => updateSettings('security', 'twoFactorAuth', checked)}
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input 
                id="sessionTimeout" 
                type="number" 
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="passwordPolicy">Password Policy</Label>
              <Textarea 
                id="passwordPolicy" 
                value={settings.security.passwordPolicy}
                onChange={(e) => updateSettings('security', 'passwordPolicy', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-600">Put system in maintenance mode</p>
              </div>
              <Switch 
                checked={settings.system.maintenanceMode}
                onCheckedChange={(checked) => updateSettings('system', 'maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Open Registration</Label>
                <p className="text-sm text-gray-600">Allow new user registrations</p>
              </div>
              <Switch 
                checked={settings.system.registrationOpen}
                onCheckedChange={(checked) => updateSettings('system', 'registrationOpen', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-gray-600">Automatic daily backups</p>
              </div>
              <Switch 
                checked={settings.system.autoBackup}
                onCheckedChange={(checked) => updateSettings('system', 'autoBackup', checked)}
              />
            </div>
            <div>
              <Label htmlFor="backupTime">Backup Time</Label>
              <Input 
                id="backupTime" 
                type="time" 
                value={settings.system.backupTime}
                onChange={(e) => updateSettings('system', 'backupTime', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Default Currency</Label>
                <Input id="currency" defaultValue="NGN" />
              </div>
              <div>
                <Label htmlFor="consultationFee">Base Consultation Fee</Label>
                <Input id="consultationFee" type="number" defaultValue="5000" />
              </div>
              <div>
                <Label htmlFor="platformFee">Platform Fee (%)</Label>
                <Input id="platformFee" type="number" defaultValue="10" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentMethods">Accepted Payment Methods</Label>
                <Textarea 
                  id="paymentMethods" 
                  defaultValue="Credit Card, Debit Card, Bank Transfer, Mobile Money"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Textarea 
                  id="refundPolicy" 
                  defaultValue="Full refund available up to 24 hours before appointment"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" defaultValue="smtp.gmail.com" />
              </div>
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" type="number" defaultValue="587" />
              </div>
              <div>
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input id="smtpUser" defaultValue="noreply@dfcmedical.com" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input id="fromEmail" defaultValue="DFC Medical <noreply@dfcmedical.com>" />
              </div>
              <div>
                <Label htmlFor="replyEmail">Reply-To Email</Label>
                <Input id="replyEmail" defaultValue="support@dfcmedical.com" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable SSL</Label>
                  <p className="text-sm text-gray-600">Use SSL encryption</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}