import React, { useState } from 'react';
import { requestService } from '../services/requestService';
import { useNotificationContext } from '../components/NotificationProvider';
import SEO, { generateBreadcrumbSchema, generateFAQSchema } from '../components/SEO';

const SupportPage: React.FC = () => {
  const { showError } = useNotificationContext();
  const [formData, setFormData] = useState({
    problemType: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const faqItems = [
    {
      question: 'Как восстановить доступ к аккаунту?',
      answer:
        'Используйте функцию "Забыли пароль" на странице входа и восстановите пароль с вашим Email адресом.',
    },
    {
      question: 'Что делать, если потерял доступ к почте?',
      answer:
        'Изменить или восстановить Email при его потере можно в индивидуальном порядке, связавшись напрямую с администрацией. Такие проблемы решаются в приоритетной очереди.',
    },
    {
      question: 'Почему не приходит письмо для подтверждения?',
      answer:
        'Проверьте папку "Спам". Если письма нет, запросите повторную отправку или напишите нам.',
    },
  ];

  const problemTypes = [
    'Изменение/Восстановление Email',
    'Техническая проблема',
    'Вопрос по функционалу',
    'Проблема с оплатой',
    'Жалоба',
    'Предложение',
    'Другое',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestData = {
        problem_type: formData.problemType,
        title: formData.problemType,
        description: formData.description,
      };

      await requestService.createSupportRequest(requestData);
      setIsSubmitted(true);
      setFormData({ problemType: '', description: '' });
    } catch (error: any) {
      console.error('Failed to create support request:', error);
      if (error.response?.status !== 401) {
        showError('Произошла ошибка при отправке. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isSubmitted) {
    return (
      <>
        <SEO
          title="Сообщение отправлено"
          description="Ваше обращение в службу поддержки БИТОК успешно отправлено. Мы ответим вам в ближайшее время."
          url="/support"
          noIndex
        />

        <div className="section-shell p-8 text-center select-none">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="glass-pill mx-auto w-fit">Заявка отправлена</div>
            <h2 className="text-3xl font-bold text-white">Сообщение отправлено</h2>
            <p className="text-neutral-300">
              Мы получили ваше обращение и ответим вам на почту и в раздел заявок в
              профиле в ближайшее время.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="action-button-primary px-6"
            >
              Отправить еще одну заявку
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="РџРѕРґРґРµСЂР¶РєР°"
        description="РЎР»СѓР¶Р±Р° РїРѕРґРґРµСЂР¶РєРё Р‘РРўРћРљ. Р§Р°СЃС‚Рѕ Р·Р°РґР°РІР°РµРјС‹Рµ РІРѕРїСЂРѕСЃС‹, РїРѕРјРѕС‰СЊ СЃ Р°РєРєР°СѓРЅС‚РѕРј, С‚РµС…РЅРёС‡РµСЃРєР°СЏ РїРѕРґРґРµСЂР¶РєР°, РІРѕРїСЂРѕСЃС‹ РїРѕ РѕРїР»Р°С‚Рµ. РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё."
        keywords="РїРѕРґРґРµСЂР¶РєР°, help, FAQ, РїРѕРјРѕС‰СЊ, С‚РµС…РЅРёС‡РµСЃРєР°СЏ РїРѕРґРґРµСЂР¶РєР°, СЃР»СѓР¶Р±Р° РїРѕРґРґРµСЂР¶РєРё, РІРѕРїСЂРѕСЃС‹ РїРѕ Р°РєРєР°СѓРЅС‚Сѓ"
        url="/support"
        schema={[
          generateBreadcrumbSchema([
            { name: 'Р“Р»Р°РІРЅР°СЏ', url: '/' },
            { name: 'РџРѕРґРґРµСЂР¶РєР°', url: '/support' },
          ]),
          generateFAQSchema(faqItems),
        ]}
      />

      <div className="space-y-6 select-none">
        <section className="page-hero">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="section-heading">
              <div className="glass-pill w-fit">Центр поддержки</div>
              <div>
                <p className="section-kicker mb-3">Аккаунт, оплата, заявки</p>
                <h1 className="text-4xl font-black text-white md:text-6xl">Поддержка</h1>
              </div>
              <p className="section-summary">
                Вопросы по аккаунту, оплате, функционалу и техническим проблемам.
                Пишите подробно, чтобы мы быстрее помогли.
              </p>
            </div>

            <div className="page-metrics">
              <div className="metric-card">
                <span className="metric-value">FAQ</span>
                <span className="metric-label">частые вопросы</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">Заявка</span>
                <span className="metric-label">обращение в поддержку</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="section-shell p-6">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">
                Форма обращения
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Свяжитесь с нами</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="problemType"
                  className="mb-2 block text-sm font-medium text-neutral-300"
                >
                  Тип проблемы
                </label>
                <select
                  id="problemType"
                  name="problemType"
                  value={formData.problemType}
                  onChange={handleChange}
                  required
                  className="field-shell cursor-pointer px-4 py-3"
                >
                  <option value="">Выберите тип проблемы</option>
                  {problemTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-neutral-300"
                >
                  Описание проблемы
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={7}
                  placeholder="Подробно опишите вашу проблему или вопрос..."
                  className="field-shell w-full resize-y px-4 py-3"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="action-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="section-shell p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">FAQ</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Частые вопросы</h2>
            </div>

            {faqItems.map((item, index) => (
              <div key={index} className="glass-panel p-5 transition hover:-translate-y-0.5">
                <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                <p className="mt-3 leading-7 text-neutral-400">{item.answer}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
};

export default SupportPage;
