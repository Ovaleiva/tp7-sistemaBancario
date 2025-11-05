'use client';
import { useState } from 'react';

export default function TransactionForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    userId: 'usuario-123',
    fromAccount: 'CTA-001',
    toAccount: 'CTA-002',
    amount: '100.00',
    currency: 'USD',
    description: 'Pago por servicios'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User ID & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ID de Usuario
          </label>
          <input
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData({...formData, userId: e.target.value})}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Moneda
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({...formData, currency: e.target.value})}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
          >
            <option value="USD">USD - Dólar Americano</option>
            <option value="EUR">EUR - Euro</option>
            <option value="ARS">ARS - Peso Argentino</option>
            <option value="BRL">BRL - Real Brasileño</option>
          </select>
        </div>
      </div>
      
      {/* From Account */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cuenta de Origen
        </label>
        <input
          type="text"
          value={formData.fromAccount}
          onChange={(e) => setFormData({...formData, fromAccount: e.target.value})}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
          required
        />
      </div>

      {/* To Account */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cuenta de Destino
        </label>
        <input
          type="text"
          value={formData.toAccount}
          onChange={(e) => setFormData({...formData, toAccount: e.target.value})}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Monto
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400 pr-16"
            required
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
            {formData.currency}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Descripción
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
          placeholder="Ingresa la descripción de la transacción..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : 'shadow-2xl shadow-blue-500/25'
        }`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Procesando...</span>
          </div>
        ) : (
          '🚀 Iniciar Transacción'
        )}
      </button>
    </form>
  );
}