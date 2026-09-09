'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';
import { usePharmacy, useAppStore } from '@/lib/store/app-store';
import { DemoDB } from '@/lib/db/demo-db';
import type { PharmacyOrder } from '@smartcare/types';
import {
  Pill,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  Bell,
  Check,
  Building2,
  BadgeCheck,
} from 'lucide-react';

interface MedicineCatalogItem {
  id: string;
  genericName: string;
  brandedName: string;
  genericPrice: number;
  brandedPrice: number;
  mrp: number;
  dosage: string;
  isRx: boolean;
}

const CATALOG_ITEMS: MedicineCatalogItem[] = [
  {
    id: 'med-1',
    genericName: 'Paracetamol 650 mg (Jan Aushadhi)',
    brandedName: 'Dolo 650 (Micro Labs)',
    genericPrice: 15,
    brandedPrice: 35,
    mrp: 35,
    dosage: '1-0-1',
    isRx: true,
  },
  {
    id: 'med-2',
    genericName: 'Salbutamol Inhaler 100 mcg (Jan Aushadhi)',
    brandedName: 'Asthalin Inhaler (Cipla)',
    genericPrice: 65,
    brandedPrice: 145,
    mrp: 175,
    dosage: '2 puffs PRN',
    isRx: true,
  },
  {
    id: 'med-3',
    genericName: 'Pantoprazole 40 mg (Jan Aushadhi)',
    brandedName: 'Pan-40 (Alkem Labs)',
    genericPrice: 28,
    brandedPrice: 65,
    mrp: 95,
    dosage: '1-0-0 (Before Food)',
    isRx: true,
  },
  {
    id: 'med-4',
    genericName: 'ORS Electrolyte Salts (Jan Aushadhi)',
    brandedName: 'Electral Sachet (FDC)',
    genericPrice: 12,
    brandedPrice: 24,
    mrp: 25,
    dosage: 'Dissolve in 1L water',
    isRx: false,
  },
  {
    id: 'med-5',
    genericName: 'Cetirizine 10 mg (Jan Aushadhi)',
    brandedName: 'Cetzine 10 (Dr. Reddy)',
    genericPrice: 10,
    brandedPrice: 25,
    mrp: 32,
    dosage: '0-0-1',
    isRx: false,
  },
];

export function PharmacyPage() {
  const { orders: pharmacyOrders, createOrder: createPharmacyOrder, updateStatus: updatePharmacyOrderStatus } = usePharmacy();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'patient' | 'dispensary'>(
    tabParam === 'dispensary' ? 'dispensary' : 'patient'
  );

  const handleTabChange = (tab: 'patient' | 'dispensary') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/pharmacy?${params.toString()}`, { scroll: false });
  };

  const [useGeneric, setUseGeneric] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<'counter' | 'delivery'>('counter');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Aditya Towers, Gachibowli, Hyderabad');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default pre-filled cart from active prescription
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; qty: number }>>([
    { id: 'med-1', name: 'Paracetamol 650 mg (Jan Aushadhi)', price: 15, qty: 1 },
    { id: 'med-2', name: 'Salbutamol Inhaler 100 mcg (Jan Aushadhi)', price: 65, qty: 1 },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleToggleGeneric = (checked: boolean) => {
    setUseGeneric(checked);
    // Update existing items in cart to generic or branded
    setCart((prev) =>
      prev.map((item) => {
        const found = CATALOG_ITEMS.find((c) => c.id === item.id);
        if (!found) return item;
        return {
          ...item,
          name: checked ? found.genericName : found.brandedName,
          price: checked ? found.genericPrice : found.brandedPrice,
        };
      })
    );
  };

  const addToCart = (item: MedicineCatalogItem) => {
    const existingIndex = cart.findIndex((c) => c.id === item.id);
    const itemName = useGeneric ? item.genericName : item.brandedName;
    const itemPrice = useGeneric ? item.genericPrice : item.brandedPrice;

    if (existingIndex > -1) {
      setCart((prev) =>
        prev.map((c, i) => (i === existingIndex ? { ...c, qty: c.qty + 1 } : c))
      );
    } else {
      setCart((prev) => [...prev, { id: item.id, name: itemName, price: itemPrice, qty: 1 }]);
    }
    showToast(`Added ${itemName} to your pharmacy cart.`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = fulfillmentType === 'delivery' ? 30 : 0;
  const grandTotal = cartSubtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (!cart.length) return;
    const order = createPharmacyOrder({
      rxId: 'RX-2026-DEMO01',
      patientName: 'Maya Singh',
      patientPhone: '+91 98490 22334',
      items: cart.map((c) => ({
        name: c.name,
        isGeneric: useGeneric,
        price: c.price,
        quantity: c.qty,
        qty: c.qty,
      })),
      total: grandTotal,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
    });

    setCart([]);
    showToast(`Order #${order.id} placed! Token ready for fulfillment.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Topbar variant="landing" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Pharmacy Header & View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              SmartCare Hospital In-House Pharmacy Counter #02
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Prescription Pharmacy &amp; Pickup
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Skip outpatient billing lines. Verified medications dispensed directly from hospital inventory.
            </p>
          </div>

          {/* Role Pill Switch */}
          <div className="w-full sm:w-auto inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/80">
            <button
              type="button"
              onClick={() => handleTabChange('patient')}
              className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer ${
                activeTab === 'patient'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Patient Order
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('dispensary')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer ${
                activeTab === 'dispensary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hospital Dispensary Queue
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                {pharmacyOrders.length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'patient' ? (
          <div className="space-y-6">
            {/* Auto-imported Prescription Banner */}
            <div className="bg-gradient-to-r from-blue-50 via-teal-50/50 to-emerald-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm sm:text-base font-bold text-slate-900 block">
                    Auto-Imported from Verified Prescription (RX-2026-DEMO01)
                  </strong>
                  <span className="text-xs text-slate-600 mt-0.5 block">
                    Prescribed by Dr Meera Shah · 2 items pre-filled with Jan Aushadhi generic equivalent savings
                  </span>
                </div>
              </div>
              <Link
                href="/verify-rx?id=RX-2026-DEMO01"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shrink-0 min-h-[44px]"
              >
                <BadgeCheck className="w-4 h-4 text-teal-600" />
                Inspect Digital Rx
              </Link>
            </div>

            {/* Generic vs Branded Comparison Switcher Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <strong className="text-sm font-bold text-slate-900">
                    Jan Aushadhi Generic Drug Subsidy
                  </strong>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Save up to 60%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pradhan Mantri Bhartiya Janaushadhi Pariyojana certified bio-equivalent generic formulations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold ${
                    !useGeneric ? 'text-slate-900 font-bold' : 'text-slate-400'
                  }`}
                >
                  Branded
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleGeneric(!useGeneric)}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    useGeneric ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={useGeneric}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      useGeneric ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-semibold ${
                    useGeneric ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  Generic (Jan Aushadhi)
                </span>
              </div>
            </div>

            {/* Two Column Layout: Medicines Catalog & Checkout Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Medicines Catalog (2 cols) */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-teal-600" />
                  Hospital Formulary &amp; Prescribed Medications
                </h2>

                <div className="space-y-3">
                  {CATALOG_ITEMS.map((item) => {
                    const inCart = cart.find((c) => c.id === item.id);
                    const currentPrice = useGeneric ? item.genericPrice : item.brandedPrice;
                    const displayName = useGeneric ? item.genericName : item.brandedName;
                    const savings = item.mrp - currentPrice;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm sm:text-base font-bold text-slate-900">
                              {displayName}
                            </strong>
                            {item.isRx && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Rx Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Dosage: {item.dosage} · Brand alt:{' '}
                            <span className="font-medium text-slate-700">{item.brandedName}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <strong className="text-base font-bold text-teal-700">
                              ₹{currentPrice}
                            </strong>
                            <del className="text-xs text-slate-400">₹{item.mrp}</del>
                            {savings > 0 && (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                Save ₹{savings}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                                Added ({inCart.qty})
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Add another"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs min-h-[48px]"
                            >
                              <Plus className="w-4 h-4" />
                              Add to Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Checkout & Fulfillment Card (1 col) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <Store className="w-4 h-4 text-teal-600" />
                    Dispensation Order Summary
                  </h3>

                  {/* Cart Items List */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-4">
                    {cart.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Your order cart is empty.</p>
                    ) : (
                      cart.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs py-1 border-b border-slate-50"
                        >
                          <div className="flex-1 pr-2">
                            <span className="font-semibold text-slate-800 block truncate">{c.name}</span>
                            <span className="text-slate-400">Qty: {c.qty}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">₹{c.price * c.qty}</strong>
                            <button
                              type="button"
                              onClick={() => removeFromCart(c.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Fulfillment Mode Choice */}
                  <div className="space-y-2 mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Fulfillment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('counter')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[72px] ${
                          fulfillmentType === 'counter'
                            ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Store className="w-3.5 h-3.5 text-teal-600" />
                          Counter #02
                        </div>
                        <div className="text-[11px] text-slate-500">Ready in 10 mins</div>
                        <span className="text-[11px] font-bold text-emerald-700">FREE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFulfillmentType('delivery')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[72px] ${
                          fulfillmentType === 'delivery'
                            ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Truck className="w-3.5 h-3.5 text-teal-600" />
                          Home Delivery
                        </div>
                        <div className="text-[11px] text-slate-500">Within 45 mins</div>
                        <span className="text-[11px] font-bold text-slate-700">₹30 fee</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Address if Selected */}
                  {fulfillmentType === 'delivery' && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  )}

                  {/* Bill Breakdown */}
                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex justify-between">
                      <span>Medicines Subtotal</span>
                      <strong className="text-slate-800">₹{cartSubtotal}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispensation / Delivery</span>
                      <strong className="text-slate-800">
                        {fulfillmentType === 'delivery' ? '₹30' : '₹0 (Free)'}
                      </strong>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Grand Total</span>
                      <span className="text-teal-700">₹{grandTotal}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={handlePlaceOrder}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Check className="w-4 h-4" />
                    Place Pharmacy Order (₹{grandTotal})
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mt-2.5">
                    Pay at Counter #02 via UPI or Cash on fulfillment.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Pharmacy Orders Tracking History */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mt-8">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-teal-600" />
                Active Pharmacy Orders &amp; Fulfillment Tracker
              </h3>

              {pharmacyOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No previous orders placed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                        <th className="pb-3 pr-4">Order Token</th>
                        <th className="pb-3 pr-4">Prescribed Items</th>
                        <th className="pb-3 pr-4">Fulfillment Mode</th>
                        <th className="pb-3 pr-4">Total</th>
                        <th className="pb-3">Live Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pharmacyOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/60">
                          <td className="py-3 pr-4 font-mono font-bold text-slate-900">
                            {order.id}
                            <span className="block text-[11px] font-normal text-slate-400 font-sans">
                              {order.rxId}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {order.items.map((it) => `${it.name} (x${it.qty})`).join(', ')}
                          </td>
                          <td className="py-3 pr-4 font-medium text-slate-700">
                            {order.counterNo || order.fulfillmentType}
                          </td>
                          <td className="py-3 pr-4 font-bold text-slate-900">₹{order.total}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                order.status === 'ready'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'completed'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.status === 'ready' && (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  Ready for Pickup
                                </>
                              )}
                              {order.status === 'placed' && (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  Being Packed
                                </>
                              )}
                              {order.status === 'completed' && (
                                <>
                                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                  Dispensed
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* DISPENSARY STAFF VIEW */
          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  Hospital Dispensary Fulfillment Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live queue for hospital pharmacists to prepare medicines, call tokens, and dispense Schedule H drugs.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 self-start sm:self-auto">
                {pharmacyOrders.length} Prescriptions In Queue
              </span>
            </div>

            {pharmacyOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">No orders in dispensary queue.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                      <th className="pb-3 pr-4">Order &amp; Rx</th>
                      <th className="pb-3 pr-4">Patient</th>
                      <th className="pb-3 pr-4">Items &amp; Formulations</th>
                      <th className="pb-3 pr-4">Counter / Destination</th>
                      <th className="pb-3 pr-4">Current Status</th>
                      <th className="pb-3 text-right">Dispensary Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pharmacyOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/60">
                        <td className="py-4 pr-4">
                          <strong className="font-mono text-slate-900 block">{order.id}</strong>
                          <span className="text-xs text-teal-700 font-mono font-medium">
                            {order.rxId}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <strong className="text-slate-800 block">{order.patientName}</strong>
                          <span className="text-xs text-slate-500">{order.patientPhone}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700">
                            {order.items.map((it, idx) => (
                              <li key={idx}>
                                {it.name} <span className="font-semibold text-slate-900">(x{it.qty})</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-semibold text-slate-800 block">
                            {order.counterNo || order.fulfillmentType}
                          </span>
                          <span className="text-xs text-slate-500">Total: ₹{order.total}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              order.status === 'ready'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'completed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status === 'ready' && 'Ready for Counter #02'}
                            {order.status === 'placed' && 'Packing In Progress'}
                            {order.status === 'completed' && 'Dispensed'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {order.status === 'placed' && (
                            <button
                              type="button"
                              onClick={() => {
                                updatePharmacyOrderStatus(order.id, 'ready');
                                showToast(`Order ${order.id} marked READY for Counter #02.`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition min-h-[44px]"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              Call to Counter
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              type="button"
                              onClick={() => {
                                updatePharmacyOrderStatus(order.id, 'completed');
                                showToast(`Order ${order.id} marked DISPENSED.`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition min-h-[44px]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Dispense &amp; Close
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <span className="text-xs text-slate-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
