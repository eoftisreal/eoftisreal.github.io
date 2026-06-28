import { fetchWithAuth } from "@/lib/apiClient";

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';
import * as XLSX from 'xlsx';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const token = getAuthToken();
  const payload = token ? parseJwt(token) : null;
  const isMasterAdmin = payload?.role === 'master_admin';

  useEffect(() => {
    if (isMasterAdmin) {
      fetchSettings();
    } else {
      setLoading(false);
      setError('Master Admin access required.');
    }
  }, [isMasterAdmin]);

  const fetchSettings = async () => {
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: value })
      });
      if (!res.ok) throw new Error('Failed to update setting');
      const data = await res.json();
      setSettings((prev: any) => ({ ...prev, ...data }));
      alert('Setting updated successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportOrders = async () => {
    try {
      setExporting(true);
      const query = new URLSearchParams();
      if (exportStartDate) query.append('startDate', new Date(exportStartDate).toISOString());
      if (exportEndDate) {
        const end = new Date(exportEndDate);
        end.setHours(23, 59, 59, 999);
        query.append('endDate', end.toISOString());
      }

      const res = await fetchWithAuth(`${apiBase}/admin/orders/export?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders for export');

      const orders = await res.json();
      if (!orders || orders.length === 0) {
        alert('No orders found for the selected date range.');
        return;
      }

      const exportData = orders.map((o: any) => {
        const customerName = o.shippingAddress?.name || o.userId?.name || 'N/A';
        const customerPhone = o.shippingAddress?.phone || o.userId?.phone || 'N/A';
        const customerEmail = o.userId?.email || 'N/A';
        const address = o.shippingAddress ? `${o.shippingAddress.line1 || ''} ${o.shippingAddress.line2 || ''}, ${o.shippingAddress.city || ''}, ${o.shippingAddress.state || ''} ${o.shippingAddress.postalCode || ''}, ${o.shippingAddress.country || ''}` : 'N/A';

        const products = o.items ? o.items.map((i: any) => `${i.title} (x${i.quantity})`).join(', ') : 'N/A';

        const orderIdStr = String(o._id);
        const formattedOrderId = orderIdStr.length > 6
          ? `${orderIdStr.slice(0, -6)}-${orderIdStr.slice(-6)}`
          : orderIdStr;

        return {
          'Order ID': formattedOrderId,
          'Date': new Date(o.createdAt).toLocaleString('en-GB'),
          'Customer Email': customerEmail,
          'Customer Phone': customerPhone,
          'Customer Name': customerName,
          'Address': address.trim(),
          'Products': products,
          'Subtotal': o.subtotal,
          'Tax': o.tax,
          'Delivery Charge': o.deliveryCharge,
          'Discount': o.discount,
          'Total': o.total,
          'Status': o.status,
          'Admin Remark': o.adminRemark || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-secondary-text">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Platform Settings</h1>

      <div className="rounded-lg bg-white p-6 border border-secondary-bg mb-6">
        <h2 className="text-lg font-semibold mb-4">Export Orders (Excel)</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <button
              onClick={handleExportOrders}
              disabled={exporting}
              className="rounded bg-green-600 px-6 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="rounded-lg bg-white p-6 border border-secondary-bg">
        <h2 className="text-lg font-semibold mb-4">Hero Banners</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image URLs</label>
            {(!settings?.heroBannerUrls || settings.heroBannerUrls.length === 0) && !settings?.heroBannerUrl && (
              <p className="text-sm text-slate-500 mb-2">No banners added yet.</p>
            )}
            {/* Legacy fallback */}
            {settings?.heroBannerUrl && (!settings?.heroBannerUrls || settings.heroBannerUrls.length === 0) && (
              <div className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={settings.heroBannerUrl}
                  disabled
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-500"
                />
                <button
                  onClick={() => {
                    const newUrls = [settings.heroBannerUrl];
                    setSettings({ ...settings, heroBannerUrls: newUrls, heroBannerUrl: '' });
                    handleUpdateSetting('heroBannerUrls', newUrls);
                    handleUpdateSetting('heroBannerUrl', '');
                  }}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Migrate
                </button>
              </div>
            )}

            {(settings?.heroBannerUrls || []).map((url: string, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...(settings.heroBannerUrls || [])];
                    newUrls[index] = e.target.value;
                    setSettings({ ...settings, heroBannerUrls: newUrls });
                  }}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="https://example.com/banner.jpg"
                />
                <button
                  onClick={() => {
                    const newUrls = (settings.heroBannerUrls || []).filter((_: any, i: number) => i !== index);
                    setSettings({ ...settings, heroBannerUrls: newUrls });
                    handleUpdateSetting('heroBannerUrls', newUrls);
                  }}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  X
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
               <button
                onClick={() => {
                  const newUrls = [...(settings?.heroBannerUrls || []), ''];
                  setSettings({ ...settings, heroBannerUrls: newUrls });
                }}
                className="rounded border border-foreground bg-transparent px-4 py-2 text-sm font-bold text-foreground hover:bg-slate-50"
              >
                + Add Banner
              </button>
              <button
                onClick={() => handleUpdateSetting('heroBannerUrls', settings?.heroBannerUrls || [])}
                className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90 ml-auto"
              >
                Save All Banners
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Add multiple image URLs to create a sliding hero banner (5-second intervals).</p>
          </div>
          {(settings?.heroBannerUrls || []).length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(settings?.heroBannerUrls || []).map((url: string, idx: number) => (
                url && <img key={idx} src={url} alt={`Banner Preview ${idx}`} className="w-full h-24 object-cover rounded border border-secondary-bg" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 border border-secondary-bg">
        <h2 className="text-lg font-semibold mb-4">Custom Feature Options</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Custom Feature Icon URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings?.customFeatureIconUrl || ''}
                onChange={(e) => setSettings({ ...settings, customFeatureIconUrl: e.target.value })}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://example.com/icon.png"
              />
              <button
                onClick={() => handleUpdateSetting('customFeatureIconUrl', settings?.customFeatureIconUrl)}
                className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
              >
                Save Icon
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Provide an image URL for the icon displayed next to custom products in the cart and checkout.</p>
          </div>
          {settings?.customFeatureIconUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Preview:</p>
              <img src={settings.customFeatureIconUrl} alt="Custom Feature Icon Preview" className="h-16 w-16 object-contain rounded border border-secondary-bg" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 border border-secondary-bg">
        <h2 className="text-lg font-semibold mb-4">Delivery Options</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.enableEmailDelivery !== false}
              onChange={(e) => handleUpdateSetting('enableEmailDelivery', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-700">Enable Email Delivery Updates</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.enableWhatsappDelivery !== false}
              onChange={(e) => handleUpdateSetting('enableWhatsappDelivery', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-700">Enable WhatsApp Delivery Updates</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 border border-secondary-bg md:col-span-2">
        <h2 className="text-lg font-semibold mb-4">Manual UPI Payment Configuration</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Store UPI ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings?.upiId || ''}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="merchant@upi"
                />
                <button
                  onClick={() => handleUpdateSetting('upiId', settings?.upiId)}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Save
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payee Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings?.payeeName || ''}
                  onChange={(e) => setSettings({ ...settings, payeeName: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="My Store Name"
                />
                <button
                  onClick={() => handleUpdateSetting('payeeName', settings?.payeeName)}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Save
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">QR Expiry (Minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings?.qrExpiryMinutes || 10}
                  onChange={(e) => setSettings({ ...settings, qrExpiryMinutes: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => handleUpdateSetting('qrExpiryMinutes', settings?.qrExpiryMinutes)}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Verification Timeout (Minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings?.verificationTimeoutMinutes || 60}
                  onChange={(e) => setSettings({ ...settings, verificationTimeoutMinutes: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => handleUpdateSetting('verificationTimeoutMinutes', settings?.verificationTimeoutMinutes)}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Save
                </button>
              </div>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings?.enableUtrSubmission !== false}
                onChange={(e) => handleUpdateSetting('enableUtrSubmission', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">Enable Customer UTR Submission</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings?.enableScreenshotUpload !== false}
                onChange={(e) => handleUpdateSetting('enableScreenshotUpload', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">Enable Customer Screenshot Upload</span>
            </label>
          </div>
        </div>
      </div>
      </div>

      <div className="rounded-lg bg-white p-6 border border-secondary-bg md:col-span-2">
        <h2 className="text-lg font-semibold mb-4">Pricing Configuration</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Tax Settings</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings?.enableTax !== false}
                onChange={(e) => handleUpdateSetting('enableTax', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">Enable Tax</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Percentage (%)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings?.taxPercentage ?? 18}
                  onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="18"
                />
                <button
                  onClick={() => handleUpdateSetting('taxPercentage', settings?.taxPercentage)}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Delivery Charge Settings</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings?.enableDeliveryCharge !== false}
                onChange={(e) => handleUpdateSetting('enableDeliveryCharge', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">Enable Delivery Charge</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Charge Amount (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings?.deliveryCharge ?? 0}
                  onChange={(e) => setSettings({ ...settings, deliveryCharge: Number(e.target.value) })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="0"
                />
                <button
                  onClick={() => handleUpdateSetting('deliveryCharge', settings?.deliveryCharge)}
                  className="rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 border border-secondary-bg">
        <h2 className="text-lg font-semibold mb-4">Other Configuration</h2>
        <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto text-slate-700">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}
