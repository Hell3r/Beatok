import React from 'react';

interface HeaderProps {
  isAuthenticated?: boolean;
}

interface NavItem {
  href: string;
  label: string;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated = false }) => {
  const navItems: NavItem[] = [
    { href: '/', label: 'Главная' },
    { href: '/library', label: 'Каталог' },
    { href: '/search', label: 'Поиск' },
  ];

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log('Logo clicked');
    window.location.href = '/';
  };

  const handleAuthClick = () => {
    console.log('Auth button clicked');
  };

  return (
    <header className="bg-neutral-900 border-b border-neutral-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-10">
          <a
            href="/"
            onClick={handleLogoClick}
            className="text-2xl font-bold hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 rounded-md"
            aria-label="BEATOK - переход на главную"
          >
            <span className="text-white">BEAT</span>
            <span className="text-red-600">OK</span>
          </a>

          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-600 rounded-md px-2 py-1"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleAuthClick}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={isAuthenticated ? 'Выйти из аккаунта' : 'Войти в аккаунт'}
          >
            {isAuthenticated ? 'Выйти' : 'Войти'}
          </button>
        </div>
      </nav>
      <div className="md:hidden bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium py-2 px-2 focus:outline-none focus:ring-2 focus:ring-red-600 rounded-md"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;