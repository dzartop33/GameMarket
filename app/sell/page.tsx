"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { games } from "@/lib/games";
import { categories } from "@/lib/categories";

export default function SellPage() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    game: "",
    category: "",
    price: "",
    description: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Необходимо войти в аккаунт");
      setLoading(false);
      return;
    }

    let imageUrl = "";

    if (image) {
      const fileName = `${Date.now()}-${image.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from("product-image")
          .upload(fileName, image);

      if (uploadError) {
        alert(uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("product-image")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("products")
      .insert([
        {
          title: formData.title,
          game: formData.game,
          category: formData.category,
          price: formData.price,
          description: formData.description,
          seller: user.email,
          user_id: user.id,
          image_url: imageUrl,
        },
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Объявление опубликовано");

    setFormData({
      title: "",
      game: "",
      category: "",
      price: "",
      description: "",
    });

    setImage(null);
    setPreview(null);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Разместить объявление
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="block mb-2">
              Название товара
            </label>

            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Аккаунт CS2 Prime"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            />
          </div>

          <div>
            <label className="block mb-2">
              Игра
            </label>

            <select
              name="game"
              value={formData.game}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            >
              <option value="">
                Выберите игру
              </option>

              {games.map((game) => (
                <option
                  key={game.name}
                  value={game.name}
                >
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">
              Категория
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            >
              <option value="">
                Выберите категорию
              </option>

              {categories
                .filter((c) => c.name !== "Все")
                .map((cat) => (
                  <option
                    key={cat.name}
                    value={cat.name}
                  >
                    {cat.icon} {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">
              Цена
            </label>

            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Например: 2500 ₽"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            />
          </div>

          <div>
            <label className="block mb-2">
              Описание
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Подробное описание товара"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            />
          </div>

          <div>
            <label className="block mb-2">
              Изображение товара
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            />

            {preview && (
              <div className="relative h-64 w-full rounded-xl overflow-hidden mt-4 border border-zinc-800">
                <Image
                  src={preview}
                  alt="Предпросмотр"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 text-black font-bold px-8 py-4 rounded-xl"
          >
            {loading
              ? "Публикация..."
              : "Опубликовать"}
          </button>
        </form>
      </div>
    </main>
  );
}