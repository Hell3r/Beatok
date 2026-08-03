import React, { useState, useEffect } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { withdrawalService } from '../services/withdrawalService';
import { useNotificationContext } from './NotificationProvider';
import { useModal } from '../hooks/useModal';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, currentBalance }) => {
  const { showSuccess } = useNotificationContext();
  const { openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      openModal();
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

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
    
    if (amountNum < 100) {
      setError('Минимальная сумма вывода 100 ₽');
      return;
    }
    
    if (amountNum > 100000) {
      setError('Максимальная сумма вывода 100 000 ₽');
      return;
    }

    if (amountNum > currentBalance) {
      setError('Недостаточно средств на балансе');
      return;
    }

    const cardDigits = cardNumber.replace(/\s/g, '');
    
    if (cardDigits.length !== 16) {
      setError('Введите полный номер карты (16 цифр)');
      return;
    }

    if (!/^\d+$/.test(cardDigits)) {
      setError('Номер карты должен содержать только цифры');
      return;
    }

    try {
      setLoading(true);
      
      await withdrawalService.createWithdrawal({
        amount: amountNum,
        card_number: cardDigits,
        description: 'Вывод средств'
      });

      onClose();
      showSuccess(`Запрос на вывод ${amountNum} ₽ успешно создан!`);
      
      setAmount('');
      setCardNumber('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании запроса на вывод');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const amountNum = parseFloat(amount) || 0;
  
  // Получаем количество цифр для отображения
  const cardDigits = cardNumber.replace(/\s/g, '');

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="modal-backdrop z-40"
            onClick={onClose}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none"
          >
            <div className="modal-shell w-full max-w-md">
              <div className="modal-divider border-b p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white select-none">
                      Вывод средств
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
                      Сумма вывода (₽)
                    </label>
                    <input
                      type="number"
                      placeholder="Введите сумму"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-lg focus:outline-none focus:border-red-500 transition-colors"
                      min="100"
                      max="100000"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(100)}
                      className="action-button-secondary action-button-slim"
                    >
                      100₽
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(300)}
                      className="action-button-secondary action-button-slim"
                    >
                      300₽
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(500)}
                      className="action-button-secondary action-button-slim"
                    >
                      500₽
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(Math.floor(currentBalance))}
                      className="action-button-secondary action-button-slim"
                    >
                      Всё
                    </button>
                  </div>

                  {amountNum > 0 && (
                    <div className="modal-subpanel p-3 pt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-400">Доступно:</span>
                        <span className="text-white">{currentBalance.toFixed(2)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-neutral-400">К выводу:</span>
                        <span className="text-white font-medium">{amountNum.toFixed(2)} ₽</span>
                      </div>
                      <div className="modal-divider mt-2 flex items-center justify-between border-t pt-2">
                        <span className="text-neutral-300">После вывода:</span>
                        <span className="text-green-400 font-bold">
                          {(currentBalance - amountNum).toFixed(2)} ₽
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Номер карты
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-lg focus:outline-none focus:border-red-500 transition-colors"
                      maxLength={19}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !amount || cardDigits.length !== 16}
                    className="action-button-primary action-button-block"
                  >
                    {loading ? 'Создание запроса...' : 'Вывести средства'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-neutral-500 select-none">
                    Минимальная сумма: 100 ₽<br />
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

export default WithdrawalModal;
