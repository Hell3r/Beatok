import React from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { animated, useTransition } from '@react-spring/web';

const CookieConsentBanner: React.FC = () => {
  const { status, accept, reject, openSettings, showSettings, closeSettings, isLoaded, consents, updateConsent } = useCookieConsent();

  const transitions = useTransition(showSettings, {
    from: { opacity: 0, transform: 'translateY(100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(100%)' }
  });

  if (!isLoaded) return null;
  if (status !== 'pending') return null;
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03)_18%,transparent_58%),linear-gradient(180deg,rgba(10,13,19,0.88),rgba(8,11,17,0.94))] p-4 shadow-[0_-24px_60px_rgba(0,0,0,0.26)] backdrop-blur-xl md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-white text-sm md:text-base leading-relaxed select-none">
            <p className="mb-3">
              Мы используем <span className="font-semibold text-red-400">cookies</span> для персонализации контента, 
              аналитики и улучшения работы сайта.
            </p>
            <p className="mb-4 text-neutral-300">
              Нажимая "Принять", вы соглашаетесь с использованием cookies в соответствии с нашей{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-400 transition-colors">
                политикой конфиденциальности
              </a>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={accept}
                className="action-button-primary action-button-compact"
              >
                Принять все
              </button>
              <button
                onClick={openSettings}
                className="action-button-secondary action-button-compact"
              >
                Настройки
              </button>
              <button
                onClick={reject}
                className="action-button-ghost action-button-compact"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      </div>

      {transitions((style, item) =>
        item && (
          <animated.div
            style={style}
            className="modal-backdrop z-[60] flex items-end p-6"
            onClick={closeSettings}
          >
            <div className="modal-shell mx-auto w-full min-w-130 max-w-md select-none overflow-y-auto rounded-t-[28px] p-6 max-h-[80vh]"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-6">Настройки cookies</h3>
              
              <div className="space-y-4 mb-8">
                <div className="modal-subpanel flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Необходимые</h4>
                    <p className="text-sm text-neutral-400">Сохранение настроек, авторизация</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 border-2 border-green-500/50 rounded-lg flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">✓</span>
                  </div>
                </div>

                <div className="modal-subpanel flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Аналитика</h4>
                    <p className="text-sm text-neutral-400">Google Analytics, статистика посещений</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={consents.analytics}
                      onChange={(e) => updateConsent('analytics', e.target.checked)} 
                    />
                    <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>

              <div className="modal-divider flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <button
                  onClick={accept}
                  className="action-button-primary action-button-compact flex-1"
                >
                  Принять все
                </button>
                <button
                  onClick={reject}
                  className="action-button-secondary action-button-compact flex-1"
                >
                  Отклонить
                </button>
                <button
                  onClick={closeSettings}
                  className="action-button-ghost action-button-compact flex-1"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </animated.div>
        )
      )}
    </>
  );
};

export default CookieConsentBanner;

