'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Footer, PatientShell, WorkspaceShell } from '@/components/layout/Shell';
import { usePharmacy, usePatient } from '@/lib/store/app-store';
import {
  Pill,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Package,
  Sparkles,
  ShoppingBag,
  Bell,
  Check,
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
    genericName: 'Amoxicillin + Clavulanate 625 mg (Jan Aushadhi)',
    brandedName: 'Augmentin 625 (GSK)',
    genericPrice: 80,
    brandedPrice: 210,
    mrp: 230,
    dosage: '1-0-1 with food',
    isRx: true,
  },
  {
    id: 'med-4',
    genericName: 'Oral Rehydration Salts (Jan Aushadhi)',
    brandedName: 'Electral Powder (FDC)',
    genericPrice: 8,
    brandedPrice: 22,
    mrp: 24,
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

export function PharmacyPage({ variant = 'landing' }: { variant?: 'landing' | 'patient' | 'workspace' }) {
  const { orders: pharmacyOrders, createOrder: createPharmacyOrder, updateStatus: updatePharmacyOrderStatus } = usePharmacy();
  const { patientData } = usePatient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'patient' | 'dispensary'>(
    variant === 'patient' ? 'patient' : tabParam === 'dispensary' ? 'dispensary' : 'patient'
  );

  const handleTabChange = (tab: 'patient' | 'dispensary') => {
    setActiveTab(tab);
    if (variant !== 'patient') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`/pharmacy?${params.toString()}`, { scroll: false });
    }
  };

  const [useGeneric, setUseGeneric] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<'counter' | 'delivery'>('counter');
  const [deliveryAddress, setDeliveryAddress] = useState(
    patientData.city ? `Near ${patientData.hospital || 'SmartCare Hospital'}, ${patientData.city}` : 'Flat 402, Aditya Towers, Gachibowli, Hyderabad'
  );
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

  const pageContent = (
    <div className="max-w-6xl w-full mx-auto px-2 sm:px-4 py-6 text-[var(--text)]">
      {/* Pharmacy Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)] mb-2">
            <Store className="w-3.5 h-3.5 text-[var(--teal)]" />
            SmartCare Hospital In-House Pharmacy Counter #02
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            Prescription Pharmacy &amp; Pickup
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Skip outpatient billing lines. Verified medications dispensed directly from hospital inventory.
          </p>
        </div>

        {/* Role Pill Switch */}
        <div className="w-full sm:w-auto inline-flex p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
          <button
            type="button"
            onClick={() => handleTabChange('patient')}
            className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Patient Order
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('dispensary')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer ${
              activeTab === 'dispensary'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Hospital Dispensary Queue
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--mint)] text-[var(--teal)] font-bold">
              {pharmacyOrders.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'patient' ? (
        <div className="space-y-6">
          {/* Auto-imported Prescription Banner */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--teal)] text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm sm:text-base font-bold text-[var(--text)] block">
                  Auto-Imported from Verified Prescription (RX-2026-DEMO01)
                </strong>
                <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                  Prescribed by Dr Meera Shah · 2 items pre-filled with Jan Aushadhi generic equivalent savings
                </span>
              </div>
            </div>
            <Link
              href="/verify-rx?id=RX-2026-DEMO01"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--mint)] transition shrink-0 min-h-[44px] no-underline"
            >
              <BadgeCheck className="w-4 h-4 text-[var(--teal)]" />
              Inspect Digital Rx
            </Link>
          </div>

          {/* Generic vs Branded Comparison Switcher Bar */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <strong className="text-sm font-bold text-[var(--text)]">
                  Jan Aushadhi Generic Drug Subsidy
                </strong>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Save up to 60%
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Pradhan Mantri Bhartiya Janaushadhi Pariyojana certified bio-equivalent generic formulations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold ${
                  !useGeneric ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)]'
                }`}
              >
                Branded
              </span>
              <button
                type="button"
                onClick={() => handleToggleGeneric(!useGeneric)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useGeneric ? 'bg-[var(--teal)]' : 'bg-[var(--line)]'
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
                  useGeneric ? 'text-[var(--teal)] font-bold' : 'text-[var(--text-muted)]'
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
              <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-[var(--teal)]" />
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
                      className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[var(--teal)] transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm sm:text-base font-bold text-[var(--text)]">
                            {displayName}
                          </strong>
                          {item.isRx && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Dosage: {item.dosage} · Brand alt:{' '}
                          <span className="font-medium text-[var(--text)]">{item.brandedName}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <strong className="text-base font-bold text-[var(--teal)]">
                            ₹{currentPrice}
                          </strong>
                          <del className="text-xs text-[var(--text-muted)]">₹{item.mrp}</del>
                          {savings > 0 && (
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                              Save ₹{savings}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-xl bg-[var(--mint)] text-[var(--teal)] text-xs font-bold border border-[var(--line)]">
                              Added ({inCart.qty})
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="p-2 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--mint)] text-[var(--text)] transition min-h-[44px] min-w-[44px] flex items-center justify-center border border-[var(--line)] cursor-pointer"
                              title="Add another"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white text-xs font-semibold transition shadow-xs min-h-[48px] cursor-pointer"
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
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-5 shadow-sm sticky top-20 transition-colors">
                <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2 pb-3 border-b border-[var(--line)] mb-4">
                  <Store className="w-4 h-4 text-[var(--teal)]" />
                  Dispensation Order Summary
                </h3>

                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-4">
                  {cart.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6">Your order cart is empty.</p>
                  ) : (
                    cart.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--line)]"
                      >
                        <div className="flex-1 pr-2">
                          <span className="font-semibold text-[var(--text)] block truncate">{c.name}</span>
                          <span className="text-[var(--text-muted)]">Qty: {c.qty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[var(--text)]">₹{c.price * c.qty}</strong>
                          <button
                            type="button"
                            onClick={() => removeFromCart(c.id)}
                            className="text-[var(--text-muted)] hover:text-rose-500 p-1 cursor-pointer"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Fulfillment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('counter')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[72px] cursor-pointer ${
                        fulfillmentType === 'counter'
                          ? 'border-[var(--teal)] bg-[var(--mint)] ring-2 ring-[var(--teal)]/20'
                          : 'border-[var(--line)] hover:border-[var(--teal)] bg-[var(--surface-sunken)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text)]">
                        <Store className="w-3.5 h-3.5 text-[var(--teal)]" />
                        Counter #02
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">Ready in 10 mins</div>
                      <span className="text-[11px] font-bold text-[var(--teal)]">FREE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentType('delivery')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[72px] cursor-pointer ${
                        fulfillmentType === 'delivery'
                          ? 'border-[var(--teal)] bg-[var(--mint)] ring-2 ring-[var(--teal)]/20'
                          : 'border-[var(--line)] hover:border-[var(--teal)] bg-[var(--surface-sunken)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text)]">
                        <Truck className="w-3.5 h-3.5 text-[var(--teal)]" />
                        Home Delivery
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">Within 45 mins</div>
                      <span className="text-[11px] font-bold text-[var(--text)]">₹30 fee</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Address if Selected */}
                {fulfillmentType === 'delivery' && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-xs text-[var(--text)] focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="border-t border-[var(--line)] pt-3 space-y-1.5 text-xs text-[var(--text-muted)] mb-4">
                  <div className="flex justify-between">
                    <span>Medicines Subtotal</span>
                    <strong className="text-[var(--text)]">₹{cartSubtotal}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispensation / Delivery</span>
                    <strong className="text-[var(--text)]">
                      {fulfillmentType === 'delivery' ? '₹30' : '₹0 (Free)'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[var(--text)] pt-2 border-t border-[var(--line)]">
                    <span>Grand Total</span>
                    <span className="text-[var(--teal)]">₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-xl bg-[var(--teal)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Place Pharmacy Order (₹{grandTotal})
                </button>

                <p className="text-[11px] text-[var(--text-muted)] text-center mt-2.5">
                  Pay at Counter #02 via UPI or Cash on fulfillment.
                </p>
              </div>
            </div>
          </div>

          {/* Live Pharmacy Orders Tracking History */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-5 shadow-xs mt-8 transition-colors">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[var(--teal)]" />
              Active Pharmacy Orders &amp; Fulfillment Tracker
            </h3>

            {pharmacyOrders.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">No previous orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--text-muted)] font-semibold uppercase text-[11px]">
                      <th className="pb-3 pr-4">Order Token</th>
                      <th className="pb-3 pr-4">Prescribed Items</th>
                      <th className="pb-3 pr-4">Fulfillment Mode</th>
                      <th className="pb-3 pr-4">Total</th>
                      <th className="pb-3">Live Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {pharmacyOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[var(--surface-sunken)]/50 transition-colors">
                        <td className="py-3 pr-4 font-mono font-bold text-[var(--text)]">
                          {order.id}
                          <span className="block text-[11px] font-normal text-[var(--text-muted)] font-sans">
                            {order.rxId}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[var(--text)]">
                          {order.items.map((it) => `${it.name} (x${it.qty})`).join(', ')}
                        </td>
                        <td className="py-3 pr-4 font-medium text-[var(--text)]">
                          {order.counterNo || order.fulfillmentType}
                        </td>
                        <td className="py-3 pr-4 font-bold text-[var(--text)]">₹{order.total}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              order.status === 'ready'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : order.status === 'completed'
                                ? 'bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)]'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {order.status === 'ready' && (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                Ready for Pickup
                              </>
                            )}
                            {order.status === 'placed' && (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                Being Packed
                              </>
                            )}
                            {order.status === 'completed' && (
                              <>
                                <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
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
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-5 sm:p-6 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)] mb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--teal)]" />
                Hospital Dispensary Fulfillment Queue
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Live queue for hospital pharmacists to prepare medicines, call tokens, and dispense Schedule H drugs.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)] self-start sm:self-auto">
              {pharmacyOrders.length} Prescriptions In Queue
            </span>
          </div>

          {pharmacyOrders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-12">No orders in dispensary queue.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--text-muted)] font-semibold uppercase text-[11px]">
                    <th className="pb-3 pr-4">Order &amp; Rx</th>
                    <th className="pb-3 pr-4">Patient</th>
                    <th className="pb-3 pr-4">Items &amp; Formulations</th>
                    <th className="pb-3 pr-4">Counter / Destination</th>
                    <th className="pb-3 pr-4">Current Status</th>
                    <th className="pb-3 text-right">Dispensary Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {pharmacyOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--surface-sunken)]/50 transition-colors">
                      <td className="py-4 pr-4">
                        <strong className="font-mono text-[var(--text)] block">{order.id}</strong>
                        <span className="text-xs text-[var(--teal)] font-mono font-medium">
                          {order.rxId}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <strong className="text-[var(--text)] block">{order.patientName}</strong>
                        <span className="text-xs text-[var(--text-muted)]">{order.patientPhone}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <ul className="list-disc pl-4 space-y-0.5 text-xs text-[var(--text)]">
                          {order.items.map((it, idx) => (
                            <li key={idx}>
                              {it.name} <span className="font-semibold text-[var(--teal)]">(x{it.qty})</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-semibold text-[var(--text)] block">
                          {order.counterNo || order.fulfillmentType}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">Total: ₹{order.total}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.status === 'ready'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : order.status === 'completed'
                              ? 'bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)]'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white font-semibold text-xs transition min-h-[44px] cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] hover:bg-[var(--mint)] text-[var(--text)] font-semibold text-xs transition min-h-[44px] cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Dispense &amp; Close
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <span className="text-xs text-[var(--text-muted)] font-medium">Completed</span>
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
    </div>
  );

  if (variant === 'patient') {
    return (
      <PatientShell subtitle="Pharmacy & Orders" backHref="/dashboard/patient" backLabel="Back to overview">
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        {pageContent}
      </PatientShell>
    );
  }

  if (variant === 'workspace') {
    return (
      <WorkspaceShell title="Pharmacy & Dispensary" subtitle="Jan Aushadhi Generic Formulary & Counter Dispensation">
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        {pageContent}
      </WorkspaceShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-sunken)] text-[var(--text)] transition-colors">
      <Topbar variant="landing" />

      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1">
        {pageContent}
      </main>

      <Footer />
    </div>
  );
}
