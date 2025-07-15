import React, { useState } from 'react';
import { X } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import NotificationBanner from './NotificationBanner';
import { useNotification } from '../../hooks/useNotification';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  productPrice?: string;
  apiSlug?: string;
  showNotification?: (msg: string, type?: any) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  productTitle = "2025 Wayne Enterprises Batmobile",
  productPrice = "Call for Price",
  apiSlug = "rent_a_product",
  showNotification: externalShowNotification,
}: ContactModalProps) {
  const { notification, showNotification, clearNotification } = useNotification();

  const [formData, setFormData] = useState({
    mainOption: '',
    rentPeriod: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    comment: '',
    consent: true
  });

  const [showCommonFields, setShowCommonFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMainOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, mainOption: value, rentPeriod: '' }));
    setShowCommonFields(!!value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mainOption) {
      notify('Please select Buy or Rent first.', 'error');
      return;
    }
    if (formData.mainOption === 'rent' && !formData.rentPeriod) {
      notify('Please select a rental period.', 'error');
      return;
    }
    try {
      const response = await fetch(`/api/${apiSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productTitle,
          productPrice,
          formType: formData.mainOption === 'buy' ? 'contact_us' : 'rent_a_product'
        }),
      });
      if (!response.ok) throw new Error('Failed');
      if (formData.mainOption === 'buy') {
        notify('Purchase request submitted! The Dark Knight will contact you soon to finalize your Batmobile purchase.', 'success');
      } else {
        notify(`${formData.rentPeriod.charAt(0).toUpperCase() + formData.rentPeriod.slice(1)} rental request submitted! Wayne Enterprises will contact you soon to arrange your Batmobile rental.`, 'success');
      }
      onClose();
    } catch (err) {
      notify('Failed to send your request. Please try again.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />
      {/* Sidebar modal */}
      <div className={`relative bg-white w-full max-w-md h-full ml-auto shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
            <NotificationBanner
              type={notification.type}
              message={notification.message}
              onClose={clearNotification}
            />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 text-2xl"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="p-6">
          <h2 className="contact-modal-header text-2xl font-semibold text-gray-900 mb-4 font-inter">Get {productTitle.split(' ').pop()}</h2>
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="w-16 h-12 bg-black rounded flex items-center justify-center">
              <OptimizedImage
                src="/logo.png"
                alt="Product"
                size="thumbnail"
                className="w-full h-full object-contain"
                fallback={<span className="text-yellow-500 text-xs font-bold">PRODUCT</span>}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 font-inter">{productTitle}</h3>
            </div>
            <div className="text-lg font-bold text-gray-900 font-inter">{productPrice}</div>
            {typeof productPrice === 'string' && productPrice === 'Call for Price' && (
              <div className="text-xs text-gray-500 font-inter mt-1">Contact us for pricing details</div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="contact-modal-form space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  Select Option<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="mainOption"
                  value={formData.mainOption}
                  onChange={handleMainOptionChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                >
                  <option value="">Choose an option...</option>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
              {formData.mainOption === 'rent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                    Rental Period<span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="rentPeriod"
                    value={formData.rentPeriod}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                  >
                    <option value="">Choose rental period...</option>
                    <option value="daily">Daily - $5,000/day</option>
                    <option value="weekly">Weekly - $30,000/week</option>
                    <option value="monthly">Monthly - $100,000/month</option>
                    <option value="yearly">Yearly - $1,000,000/year</option>
                  </select>
                </div>
              )}
              {showCommonFields && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                        First Name<span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                      Email<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                      Phone<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                      Comments
                    </label>
                    <textarea
                      name="comment"
                      rows={3}
                      value={formData.comment}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inter"
                      placeholder="Tell us about your event or inquiry..."
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={formData.consent}
                      onChange={handleInputChange}
                      className="mr-2"
                      required
                    />
                    <label className="text-sm text-gray-700 font-inter">
                      I consent to being contacted about my inquiry.
                    </label>
                  </div>
                </>
              )}
              <button
                type="submit"
                className="w-full bg-yellow-600 text-white px-8 py-4 rounded-lg hover:bg-yellow-500 transition-colors font-inter font-medium text-lg"
              >
                SEND MESSAGE
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}