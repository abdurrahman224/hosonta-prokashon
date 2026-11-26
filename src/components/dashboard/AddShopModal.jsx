import { useState } from 'react';
import { FiShoppingBag, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { addStoredShop } from '../../data/shops';

const inputCls =
  'w-full rounded-lg border border-dark/15 px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none';

export default function AddShopModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    shopName: '',
    representative: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    district: 'Dhaka',
    category: 'Wholesale & Retail Bookshop',
    defaultCommission: 35,
    tradeLicense: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.shopName.trim()) {
      toast.error('Shop name is required');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    const newShop = addStoredShop({
      ...form,
      ownerName: form.representative || form.shopName,
      defaultCommission: Number(form.defaultCommission) || 30,
    });

    toast.success('New shop registered successfully!');
    if (onCreated) onCreated(newShop);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dark/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-dark">
              <FiShoppingBag className="text-lg" />
            </div>
            <h3 className="font-heading text-base font-bold text-dark sm:text-lg">
              Add New Shop / Bookshop
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-dark/50 hover:bg-dark/5 transition"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Batighar Bookshop"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-dark">
                  Owner / Representative Name
                </label>
                <input
                  type="text"
                  placeholder="Representative name"
                  value={form.representative}
                  onChange={(e) =>
                    setForm({ ...form, representative: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-dark">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="01711-XXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-dark">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="shop@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-dark">
                  District / Region
                </label>
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className={inputCls}
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barishal">Barishal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">
                Shop Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Market, street, area address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-dark">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  placeholder="35"
                  value={form.defaultCommission}
                  onChange={(e) =>
                    setForm({ ...form, defaultCommission: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-dark">
                  Trade License No.
                </label>
                <input
                  type="text"
                  placeholder="TRD-XXXXX"
                  value={form.tradeLicense}
                  onChange={(e) =>
                    setForm({ ...form, tradeLicense: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">
                Notes / Description
              </label>
              <textarea
                rows={2}
                placeholder="Notes about shop or partnership..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {/* Sticky footer actions */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-dark/10 bg-white p-4 sm:flex-row sm:justify-end sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-xs font-semibold text-dark/70 hover:bg-dark/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-dark shadow-2xs hover:bg-primary-hover transition"
            >
              Save Shop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
