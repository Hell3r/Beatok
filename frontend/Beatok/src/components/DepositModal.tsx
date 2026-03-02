import React, { useState } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { paymentService } from '../services/paymentService';
import { useNotificationContext } from './NotificationProvider';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { showError } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');

  const COMMISSION_RATE = 0.025;

  const getCommission = (value: number): number => {
    return Math.round(value * COMMISSION_RATE * 100) / 100;
  };

  const getFinalAmount = (value: number): number => {
    return Math.round((value - getCommission(value)) * 100) / 100;
  };

  const amountNum = parseFloat(amount) || 0;
  const commission = getCommission(amountNum);
  const finalAmount = getFinalAmount(amountNum);

  const modalTransition = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    config: { tension: 300, friction: 30 }
  });

  const overlayTransition = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum)) {
      setError('Введите сумму');
      return;
    }
    
    if (amountNum < 10) {
      setError('Минимальная сумма пополнения 10 ₽');
      return;
    }
    
    if (amountNum > 100000) {
      setError('Максимальная сумма пополнения 100 000 ₽');
      return;
    }

    try {
      setLoading(true);
      
      const response = await paymentService.createPayment({
        amount: amountNum,
        description: 'Пополнение баланса Beatok'
      });

      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        showError('Не удалось получить ссылку для оплаты');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании платежа');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
            onClick={onClose}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-neutral-900 rounded-lg w-full max-w-md border border-neutral-800 shadow-2xl select-none">
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white select-none">
                      Пополнить баланс
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-900/80 border border-red-700 rounded text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Сумма пополнения (₽)
                    </label>
                    <input
                      type="number"
                      placeholder="Введите сумму"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-lg focus:outline-none focus:border-red-500 transition-colors"
                      min="10"
                      max="100000"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(100)}
                      className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors cursor-pointer border border-neutral-700"
                    >
                      100₽
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(300)}
                      className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors cursor-pointer border border-neutral-700"
                    >
                      300₽
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(500)}
                      className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors cursor-pointer border border-neutral-700"
                    >
                      500₽
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(1000)}
                      className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors cursor-pointer border border-neutral-700"
                    >
                      1000₽
                    </button>
                  </div>

                  {amountNum > 0 && (
                    <div className="pt-2 bg-neutral-800 rounded-lg p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-400">Внесено:</span>
                        <span className="text-white">{amountNum.toFixed(2)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-neutral-400">Комиссия (2.5%):</span>
                        <span className="text-red-400">-{commission.toFixed(2)} ₽</span>
                      </div>
                      <div className="border-t border-neutral-700 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-neutral-300 font-medium">Вы получите:</span>
                        <span className="text-green-400 font-bold text-lg">{finalAmount.toFixed(2)} ₽</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {loading ? 'Создание платежа...' : 'Пополнить'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-neutral-500 select-none">
                    Минимальная сумма: 10 ₽<br />
                    Максимальная сумма: 100 000 ₽
                  </p>
                </div>
              </div>
            </div>
          </animated.div>
        )
      )}
    </>
  );
};

export default DepositModal;
