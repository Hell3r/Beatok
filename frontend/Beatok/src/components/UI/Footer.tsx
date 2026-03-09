import React from 'react';
import { Link } from 'react-router-dom';
import { FaTelegram, FaEnvelope, FaVk } from 'react-icons/fa';
import { useNotificationContext } from '../NotificationProvider';

interface NavItem {
  href: string;
  label: string;
}

const Footer: React.FC = () => {
  const { showSuccess } = useNotificationContext();

  const navItems: NavItem[] = [
    { href: '/', label: 'ГЛАВНАЯ' },
    { href: '/beats', label: 'БИТЫ' },
    { href: '/beats?free=true', label: 'БЕСПЛАТНЫЕ' },
    { href: '/beatmakers', label: 'БИТМЕЙКЕРЫ' },
    { href: '/about', label: 'О НАС' },
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

  const getCurrentYear = () => {
    const currentDate = new Date;
    const currentYear = currentDate.getFullYear()
    
    return currentYear
  }

  return (
    <footer className="bg-neutral-950 border-t w-full border-neutral-700 py-16 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-8">
          <div className="flex flex-wrap justify-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className='justify-center spacw-x-8 text-center'>
            <p className='text-gray-400 text-sm'>
              ИП Репьев Евгений Алексеевич
            </p>
            <p className='text-gray-400 text-sm'>
              ОГРН/ОГРНИП: 324508100488650 
            </p>
            <p className='text-gray-400 text-sm'>
              ЮРИДИЧЕСКИЙ АДРЕС: 141060, РОССИЯ, МОСКОВСКАЯ ОБЛ, Г КОРОЛЁВ,<br /> МКР БОЛШЕВО, ПРОЕЗД БУРКОВСКИЙ, Д 36, КОРП 1, КВ 18 
            </p>
            <p className='text-gray-400 text-sm'>
              ИНН: 592061978176 
            </p>
            <p className='text-gray-400 text-sm'>
              ПОЧТА: repiev.evgeny@yandex.ru  
            </p>
          </div>
          <div className="flex justify-center space-x-8">
            <a
              href="https://t.me/beatok_service"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center transition-all duration-300 hover:scale-110"
              title="Написать в Telegram"
            >
              <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/10">
                <FaTelegram className="w-10 h-10 text-white/80 transition-all duration-300 group-hover:text-red-500 group-hover:scale-110" />
              </div>
            </a>

            <button
              onClick={handleCopyEmail}
              className="group flex flex-col items-center transition-all duration-300 hover:scale-110 cursor-pointer"
              title="Скопировать почту"
            >
              <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/10">
                <FaEnvelope className="w-10 h-10 text-white/80 transition-all duration-300 group-hover:text-red-500 group-hover:scale-110" />
              </div>
            </button>

            <a
              href="https://vk.com/beatok_service"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center transition-all duration-300 hover:scale-110"
              title="Написать в VK"
            >
              <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/10">
                <FaVk className="w-10 h-10 text-white/80 transition-all duration-300 group-hover:text-red-500 group-hover:scale-110" />
              </div>
            </a>
          </div>
        </div>
        <div className="flex flex-wrap justify-center space-x-6 mt-4">
          {legalItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-gray-500 hover:text-gray-400 transition-colors duration-200 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="text-center mt-8 mb-20">
          <p className="text-gray-400 text-sm">
            © БИТОК {getCurrentYear()}  - Все права защищены
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
