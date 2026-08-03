import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaTelegram, FaVk } from 'react-icons/fa';
import { useNotificationContext } from '../NotificationProvider';

interface NavItem {
  href: string;
  label: string;
}

const Footer: React.FC = () => {
  const { showSuccess } = useNotificationContext();

  const navItems: NavItem[] = [
    { href: '/', label: 'Главная' },
    { href: '/beats', label: 'Биты' },
    { href: '/beats?free=true', label: '0 ₽' },
    { href: '/beatmakers', label: 'Битмейкеры' },
    { href: '/support', label: 'FAQ' },
  ];

  const legalItems: NavItem[] = [
    { href: '/terms', label: 'Пользовательское соглашение' },
    { href: '/privacy', label: 'Политика конфиденциальности' },
  ];

  const handleCopyEmail = async () => {
    const email = 'beatok_service@mail.ru';
    try {
      await navigator.clipboard.writeText(email);
      showSuccess('Почта скопирована в буфер обмена!');
    } catch (err) {
      console.error('Failed to copy email: ', err);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="page-shell pb-28 md:pb-10">
      <div className="section-shell px-5 py-8 md:px-8 md:py-10 mt-4">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="section-heading">
              <p className="section-kicker">Beatok</p>
              <h2 className="text-3xl font-black text-white md:text-4xl">
                Живой маркетплейс для битов
              </h2>
              <p className="section-summary">
                Площадка для артистов и битмейкеров СНГ. Каталог, покупки, продвижение,
                избранное и личный кабинет в одном рабочем пространстве.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="glass-pill text-sm transition hover:-translate-y-0.5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="grid gap-3 text-sm text-neutral-300">
              <div className="glass-panel p-4">
                ИП Репьев Евгений Алексеевич
                <br />
                ОГРН/ОГРНИП: 324508100488650
              </div>
              <div className="glass-panel p-4">
                Юридический адрес: 141060, Россия, Московская обл, г Королёв,
                мкр Болшево, проезд Бурковский, д 36, корп 1, кв 18
              </div>
              <div className="glass-panel p-4">
                ИНН: 592061978176
                <br />
                Почта: repiev.evgeny@yandex.ru
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel-strong p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-neutral-400">
                Контакты
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Быстрый выход на связь
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-300">
                Поддержка, партнерства, вопросы по платформе и платежам. Ответим там,
                где вам удобнее.
              </p>

              <div className="mt-5 flex gap-3">
                <a
                  href="https://t.me/beatok_service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill transition hover:-translate-y-0.5 hover:text-white"
                  title="Написать в Telegram"
                >
                  <FaTelegram className="h-5 w-5" />
                  Telegram
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="glass-pill transition hover:-translate-y-0.5 hover:text-white"
                  title="Скопировать почту"
                >
                  <FaEnvelope className="h-5 w-5" />
                  Email
                </button>
                <a
                  href="https://vk.com/beatok_service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill transition hover:-translate-y-0.5 hover:text-white"
                  title="Написать в VK"
                >
                  <FaVk className="h-5 w-5" />
                  VK
                </a>
              </div>
            </div>

            <div className="grid gap-2">
              {legalItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="glass-panel px-4 py-3 text-sm text-neutral-300 transition hover:-translate-y-0.5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="soft-divider my-6" />

        <div className="flex flex-col gap-2 text-sm text-neutral-400 md:flex-row md:items-center md:justify-between">
          <p>© БИТОК {currentYear} — все права защищены</p>
          <p>Сделано с упором на артистов, битмейкеров и чистый пользовательский опыт.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
