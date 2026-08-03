import React from 'react';

const SecuritySection: React.FC = () => {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">🛡️ Наша безопасность</h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-300">
            Ваши биты в полной безопасности. Мы заботимся о защите вашего творчества от
            несанкционированного использования.
          </p>
          <hr className="mx-auto my-4 max-w-[800px] border text-red-500" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="glass-panel-strong rounded-[34px] border border-white/12 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-10">
            <div className="mb-6 text-center">
              <div className="mb-4 text-4xl">🔒</div>
              <h3 className="mb-4 text-2xl font-semibold text-white">Защита от кражи и копирования</h3>
            </div>

            <p className="mb-6 text-lg leading-relaxed text-gray-300">
              Не беспокойтесь, если кто-то скачает ваш бит и попытается продать его за деньги или
              использовать без вашего разрешения. У нас есть собственная система защиты, которая
              предотвращает такие случаи.
            </p>

            <p className="mb-6 text-lg leading-relaxed text-gray-300">
              Наша технология анализирует каждый загруженный файл: каждый бит преобразуется в
              компактный цифровой "паспорт". Этот процесс происходит мгновенно и позволяет быстро
              сравнивать биты между собой.
            </p>

            <p className="text-lg leading-relaxed text-gray-300">
              Благодаря этой системе мы гарантируем оригинальность контента и защищаем права
              создателей. Ваше творчество остается вашим, и мы не позволим его использовать без
              вашего согласия.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
