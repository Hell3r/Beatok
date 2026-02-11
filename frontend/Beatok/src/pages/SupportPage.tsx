import React, { useState } from 'react';
import { requestService } from '../services/requestService';
import { useNotificationContext } from '../components/NotificationProvider';

const SupportPage: React.FC = () => {
    const { showError } = useNotificationContext();
    const [formData, setFormData] = useState({
        problemType: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const faqItems = [
        {
            question: "Как восстановить доступ к аккаунту?",
            answer: 'Используйте функцию "Забыли пароль" на странице входа и восстановите пароль с вашим Email адресом.'
        },
        {
            question: "Что делать, если потерял доступ к почте?",
            answer: "Изменить или восстановить Email при его потере можно в индивидуальном порядке связавшись напрямую с администрацией. Такие проблемы решаются в приоритетной очереди."
        },
        {
            question: "Почему не приходит письмо для подтверждения?",
            answer: 'Проверьте папку "Спам". Если письма нет, запросите повторную отправку или напишите нам.'
        },
    ];

    const problemTypes = [
        "Изменение/Восстановление Email",
        "Техническая проблема",
        "Вопрос по функционалу", 
        "Проблема с оплатой",
        "Жалоба",
        "Предложение",
        "Другое"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const requestData = {
                problem_type: formData.problemType,
                title: formData.problemType,
                description: formData.description
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (isSubmitted) {
        return (
            <div className="max-w-4xl mx-auto px-4 select-none">
                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-lg">
                    <div className="flex justify-center">
                        <h2 className="text-white text-xl font-semibold mb-3">Сообщение отправлено!</h2>
                    </div>
                    <div className='flex justify-center'>
                        <p className="text-neutral-400">Мы получили ваше обращение и ответим в ближайшее время.</p>
                    </div>
                    </div>
                <div className='flex justify-center'>
                    <button 
                        onClick={() => setIsSubmitted(false)}
                        className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-6 py-3 rounded-lg transition-all duration-300 mt-6 shadow-md hover:shadow-lg transform ">
                        Отправить еще одну заявку
                    </button>
                </div>    
                
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 select-none">
            <section className="mb-8">
                <div className='flex justify-center'>
                    <h2 className="text-white text-2xl font-semibold mb-6">Свяжитесь с нами</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900 rounded-xl p-6 border border-neutral-900 shadow-lg">
                    <div>
                        <label htmlFor="problemType" className="block text-neutral-300 text-sm font-medium mb-3">
                            Тип проблемы
                        </label>
                        <select
                            id="problemType"
                            name="problemType"
                            value={formData.problemType}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        >
                            <option value="" className="text-neutral-400">Выберите тип проблемы</option>
                            {problemTypes.map((type, index) => (
                                <option key={index} value={type} className="text-white bg-neutral-800">{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-neutral-300 text-sm font-medium mb-3">
                            Описание проблемы
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={6}
                            placeholder="Подробно опишите вашу проблему или вопрос..."
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-vertical transition-all placeholder-neutral-500"
                        />
                    </div>
                    <div className='flex justify-center'>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-80 mx-auto bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-300 transform  cursor-pointer disabled:scale-100 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
                        </button>
                    </div>
                    
                </form>
            </section>

            <section className="mb-8">
                <div className='flex justify-center'>
                    <h2 className="text-white text-2xl font-semibold mb-6">Часто задаваемые вопросы</h2>
                </div>
                <div className="space-y-4">
                    {faqItems.map((item, index) => (
                        <div key={index} className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 hover:bg-neutral-800 transition-all duration-300 shadow-lg">
                            <h3 className="text-white font-semibold text-lg mb-3">{item.question}</h3>
                            <p className="text-neutral-400 leading-relaxed">{item.answer}</p>
                        </div>
                    ))}
                </div>
            </section>


        </div>
    );
};

export default SupportPage;