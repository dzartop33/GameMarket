"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    question: "Как купить товар?",
    answer:
      "Найдите нужный товар в каталоге, нажмите «Купить» или напишите продавцу через чат. Деньги спишутся с вашего баланса.",
  },
  {
    question: "Как пополнить баланс?",
    answer:
      "Зайдите в Кошелёк → нажмите «Пополнить» → введите сумму → переведите по реквизитам СБП. После подтверждения администратором баланс будет зачислен.",
  },
  {
    question: "Как продать товар?",
    answer:
      "Зарегистрируйтесь, нажмите «+ Продать» в меню, заполните форму и опубликуйте объявление.",
  },
  {
    question: "Как связаться с продавцом?",
    answer:
      "На странице товара нажмите кнопку «💬 Написать». Откроется чат с продавцом.",
  },
  {
    question: "Как вывести деньги?",
    answer:
      "Зайдите в Кошелёк → нажмите «Вывести» → укажите сумму и реквизиты. Администратор обработает заявку и переведёт деньги.",
  },
  {
    question: "Безопасно ли покупать?",
    answer:
      "Рекомендуем проверять рейтинг и отзывы продавца перед покупкой. Деньги хранятся на балансе сайта до подтверждения получения товара.",
  },
  {
    question: "Как оставить отзыв?",
    answer:
      "Откройте страницу продавца и напишите отзыв в разделе «Отзывы».",
  },
  {
    question: "Как удалить объявление?",
    answer:
      "Откройте своё объявление и нажмите кнопку «Удалить», или зайдите в «Мои объявления».",
  },
  {
    question: "Что делать если возник спор?",
    answer:
      "В разделе «Мои сделки» нажмите «Открыть спор». Администратор рассмотрит ситуацию и примет решение.",
  },
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Поддержка</h1>
        <p className="text-zinc-400 mb-8">Ответы на частые вопросы</p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between"
              >
                <h3 className="font-bold">{faq.question}</h3>
                <span className="text-zinc-400 ml-4 flex-shrink-0">
                  {openIndex === index ? "▲" : "▼"}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-zinc-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 mt-8">
          <h2 className="text-xl font-bold">Не нашли ответ?</h2>
          <p className="text-zinc-400 mt-2">
            Напишите нам — ответим в течение 24 часов
          </p>
          <p className="text-cyan-400 mt-1 font-semibold">
            support@gamemarket.ru
          </p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/messages"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              💬 Написать в чат
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}