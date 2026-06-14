import { useEffect, useState, Fragment, useRef } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';
import { Search, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import html2canvas from 'html2canvas';

import { getAuthToken } from '@/lib/storage';
function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
}


const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [currentLabelOrder, setCurrentLabelOrder] = useState<any>(null);
  const [labelFrom, setLabelFrom] = useState("KK Crafted\nPatna, Bihar\nPhone: 9XXXXXXXXX");
  const [labelBlackText, setLabelBlackText] = useState("BLACK");
  const labelRef = useRef<HTMLDivElement>(null);

  const token = getAuthToken();
  const payload = token ? parseJwt(token) : null;
  const isMasterAdmin = payload?.role === 'master_admin';


  async function fetchOrders() {
    try {
      const res = await fetchWithAuth(`${apiBase}/orders`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch orders', e);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const generateLabelImage = async () => {
    if (!labelRef.current || !currentLabelOrder) return;
    try {
      const canvas = await html2canvas(labelRef.current, { scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Label_${currentLabelOrder._id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate label image", err);
      alert("Failed to generate label image.");
    }
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchSearch = o._id.toLowerCase().includes(term) ||
                        (o.guestEmail && o.guestEmail.toLowerCase().includes(term)) ||
                        (o.userId && o.userId.email && o.userId.email.toLowerCase().includes(term));
    const matchStatus = statusFilter === '' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Manage Orders</h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-md border border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Order ID or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded text-sm focus:outline-none focus:border-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded px-4 py-2 text-sm focus:outline-none focus:border-foreground bg-white sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="awaiting_verification">Awaiting Verification</option>
          <option value="payment_verified">Payment Verified</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-md border border-secondary-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary-bg">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expected Amount</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-bg">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <Fragment key={order._id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedRowId(expandedRowId === order._id ? null : order._id)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {expandedRowId === order._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">#{order._id.slice(-6)}</td>
                    <td className="px-4 py-3 text-secondary-text">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-secondary-text">
                      {order.guestEmail || (order.userId && order.userId.email) || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded border border-border bg-secondary-bg text-secondary-text">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ₹{order.uniquePaymentAmount?.toFixed(2) || order.total}
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary-text">
                      {order.utr && <div>UTR: {order.utr}</div>}
                      {order.screenshotUrl && <div><a href={order.screenshotUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Screenshot</a></div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.status === 'awaiting_verification' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetchWithAuth(`${apiBase}/admin/orders/${order._id}/approve`, {
                                  method: 'POST'
                                });
                                if (res.ok) {
                                  setOrders(orders.map(o => o._id === order._id ? { ...o, status: 'payment_verified' } : o));
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetchWithAuth(`${apiBase}/admin/orders/${order._id}/reject`, {
                                  method: 'POST'
                                });
                                if (res.ok) {
                                  setOrders(orders.map(o => o._id === order._id ? { ...o, status: 'rejected' } : o));
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedRowId === order._id && order.items && order.items.length > 0 && (
                    <tr className="bg-slate-50 border-t border-slate-100">
                      <td colSpan={8} className="px-10 py-4">
                        <div className="text-xs font-semibold text-slate-500 mb-2">Order Items:</div>
                        <div className="space-y-3">
                          {order.items.map((item: any, idx: number) => {
                            const imageUrl = item.image || (typeof item.productId === 'object' && item.productId?.images?.[0]) || '';
                            return (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="flex gap-2 shrink-0 bg-white rounded border border-slate-200 p-1">
                                  {imageUrl && (
                                    <img src={imageUrl} alt={item.title} className="h-16 w-16 object-cover rounded" />
                                  )}
                                  {item.customImage && (
                                    <img src={item.customImage} alt="Custom upload" className="h-16 w-16 object-contain bg-slate-100 rounded border border-dashed border-slate-300" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">{item.title}</div>
                                  <div className="text-slate-500 mt-1">
                                    Qty: {item.quantity} &times; ₹{item.unitPrice} = <span className="font-medium text-slate-700">₹{item.quantity * item.unitPrice}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="text-xs font-semibold text-slate-500 mb-2">Admin Remark (Special Note):</div>
                          <div className="flex gap-2">
                            <textarea
                              className="w-full sm:w-1/2 p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500"
                              rows={2}
                              placeholder="Add an admin remark..."
                              defaultValue={order.adminRemark || ''}
                              onBlur={async (e) => {
                                const newRemark = e.target.value;
                                if (newRemark === order.adminRemark) return;
                                try {
                                  const res = await fetchWithAuth(`${apiBase}/admin/orders/${order._id}/remark`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ remark: newRemark })
                                  });
                                  if (res.ok) {
                                    setOrders(orders.map(o => o._id === order._id ? { ...o, adminRemark: newRemark } : o));
                                  }
                                } catch (err) {
                                  console.error('Failed to update remark', err);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t border-slate-200 pt-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500">Shipping Status:</span>
                            <select
                              disabled={!['payment_verified', 'processing', 'shipped', 'delivered', 'cancelled'].includes(order.status)}
                              value={['processing', 'shipped', 'delivered', 'cancelled'].includes(order.status) ? order.status : ''}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                if (!newStatus) return;
                                try {
                                  const res = await fetchWithAuth(`${apiBase}/admin/orders/${order._id}/status`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  });
                                  if (res.ok) {
                                    setOrders(orders.map(o => o._id === order._id ? { ...o, status: newStatus } : o));
                                  }
                                } catch (err) {
                                  console.error('Failed to update status', err);
                                }
                              }}
                              className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-foreground bg-white"
                            >
                              <option value="" disabled>Select Shipping Status</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          {isMasterAdmin && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-slate-500">Payment Status:</span>
                              <select
                                value={['pending_payment', 'awaiting_verification', 'payment_verified', 'rejected'].includes(order.status) ? order.status : ''}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  if (!newStatus) return;
                                  try {
                                    const res = await fetchWithAuth(`${apiBase}/admin/orders/${order._id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus })
                                    });
                                    if (res.ok) {
                                      setOrders(orders.map(o => o._id === order._id ? { ...o, status: newStatus } : o));
                                    }
                                  } catch (err) {
                                    console.error('Failed to update status', err);
                                  }
                                }}
                                className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-foreground bg-white"
                              >
                                <option value="" disabled>Select Payment Status</option>
                                <option value="pending_payment">Pending Payment</option>
                                <option value="awaiting_verification">Awaiting Verification</option>
                                <option value="payment_verified">Payment Verified</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          )}

                          <div className="ml-auto">
                            <button
                              onClick={() => {
                                setCurrentLabelOrder(order);
                                setLabelModalOpen(true);
                              }}
                              className="rounded bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                            >
                              Generate Label
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-secondary-text">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {labelModalOpen && currentLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold">Generate Label</h2>
              <button onClick={() => setLabelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Top Right Text</label>
                  <input
                    type="text"
                    value={labelBlackText}
                    onChange={e => setLabelBlackText(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">From Address</label>
                  <textarea
                    rows={4}
                    value={labelFrom}
                    onChange={e => setLabelFrom(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  />
                </div>
                <button
                  onClick={generateLabelImage}
                  className="w-full rounded bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90 mt-4"
                >
                  Download Label Image
                </button>
              </div>

              <div className="flex-1 flex justify-center items-start bg-slate-100 p-4 rounded border border-slate-200 overflow-x-auto">
                {/* The actual label to be captured */}
                <div
                  ref={labelRef}
                  className="bg-white border border-black p-6 w-full max-w-sm text-sm font-mono text-black shadow-sm"
                  style={{ minWidth: '320px' }}
                >
                  <div className="flex justify-between items-center border-b border-black pb-2 mb-4">
                    <div className="font-bold text-lg">ORD-{currentLabelOrder._id.slice(-6).toUpperCase()}</div>
                    <div className="font-bold text-lg uppercase">{labelBlackText}</div>
                  </div>

                  <div className="mb-4 border-b border-black pb-4">
                    <div className="font-bold mb-1">TO:</div>
                    <div>{currentLabelOrder.shippingAddress?.name || currentLabelOrder.userId?.name || currentLabelOrder.guestEmail || 'Customer'}</div>
                    {currentLabelOrder.shippingAddress?.line1 && <div>{currentLabelOrder.shippingAddress.line1}</div>}
                    {currentLabelOrder.shippingAddress?.line2 && <div>{currentLabelOrder.shippingAddress.line2}</div>}
                    <div>
                      {currentLabelOrder.shippingAddress?.city || ''}{currentLabelOrder.shippingAddress?.state ? `, ${currentLabelOrder.shippingAddress.state}` : ''}
                      {currentLabelOrder.shippingAddress?.postalCode ? ` - ${currentLabelOrder.shippingAddress.postalCode}` : ''}
                    </div>
                    {(currentLabelOrder.shippingAddress?.phone || currentLabelOrder.userId?.phone) && (
                      <div className="mt-1">Phone: {currentLabelOrder.shippingAddress?.phone || currentLabelOrder.userId?.phone}</div>
                    )}
                  </div>

                  <div>
                    <div className="font-bold mb-1">FROM:</div>
                    <div className="whitespace-pre-wrap">{labelFrom}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
