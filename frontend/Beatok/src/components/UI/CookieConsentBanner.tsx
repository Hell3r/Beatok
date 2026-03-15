import React from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { animated, useTransition } from '@react-spring/web';

const CookieConsentBanner: React.FC = () => {
  const { status, accept, reject, openSettings, showSettings, closeSettings, isLoaded } = useCookieConsent();

  const transitions = useTransition(showSettings, {
    from: { opacity: 0, transform: 'translateY(100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(100%)' }
  });

  if (!isLoaded) return null;
  if (status !== 'pending') return null;
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-neutral-900 to-neutral-800 border-t border-neutral-700 shadow-2xl p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-white text-sm md:text-base leading-relaxed">
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
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Принять все
              </button>
              <button
                onClick={openSettings}
                className="px-6 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-all duration-200"
              >
                Настройки
              </button>
              <button
                onClick={reject}
                className="px-6 py-2.5 bg-transparent hover:bg-neutral-800 border border-neutral-600 text-neutral-300 hover:text-white font-medium rounded-lg transition-all duration-200"
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end p-6"
            onClick={closeSettings}
          >
            <div className="bg-neutral-900 w-full max-w-md mx-auto border border-neutral-700 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-6">Настройки cookies</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-neutral-850 rounded-lg border border-neutral-700">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Необходимые</h4>
                    <p className="text-sm text-neutral-400">Сохранение настроек, авторизация</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 border-2 border-green-500/50 rounded-lg flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">✓</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-850 rounded-lg border border-neutral-700">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Аналитика</h4>
                    <p className="text-sm text-neutral-400">Google Analytics, статистика посещений</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      defaultChecked={true}
                      onChange={(e) => e.target.checked ? accept() : reject()} 
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800">
                <button
                  onClick={accept}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Принять все
                </button>
                <button
                  onClick={reject}
                  className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Отклонить
                </button>
                <button
                  onClick={closeSettings}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-all duration-200 border border-neutral-600"
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

