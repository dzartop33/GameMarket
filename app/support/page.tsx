export default function SupportPage() {
  const faqs = [
    {
      question: "Как купить товар?",
      answer:
        "Найдите нужный товар в каталоге, нажмите 'Купить' или напишите продавцу через чат.",
    },
    {
      question: "Как продать товар?",
      answer:
        "Зарегистрируйтесь, нажмите 'Продать' в меню, заполните форму и опубликуйте объявление.",
    },
    {
      question: "Как связаться с продавцом?",
      answer:
        "На странице товара нажмите кнопку 'Написать'. Откроется чат с продавцом.",
    },
    {
      question: "Безопасно ли покупать?",
      answer:
        "Мы рекомендуем проверять рейтинг и отзывы продавца перед покупкой.",
    },
    {
      question: "Как оставить отзыв?",
      answer:
        "Откройте страницу товара или продавца и напишите отзыв в разделе 'Отзывы'.",
    },
    {
      question: "Как удалить объявление?",
      answer:
        "Откройте своё объявление и нажмите кнопку 'Удалить'.",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">
          Поддержка
        </h1>

        <p className="text-zinc-400 mb-8">
          Ответы на частые вопросы
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition"
            >
              <h3 className="font-bold text-lg">
                {faq.question}
              </h3>

              <p className="text-zinc-400 mt-3">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 mt-8">
          <h2 className="text-xl font-bold">
            Не нашли ответ?
          </h2>

          <p className="text-zinc-400 mt-2">
            Напишите нам на почту:
          </p>

          <p className="text-cyan-400 mt-1">
            support@gamemarket.com
          </p>
        </div>
      </div>
    </main>
  );
}