"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { games } from "@/lib/games";
import { categories } from "@/lib/categories";

export default function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    game: "",
    category: "",
    price: "",
    quantity: "1",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    loadProduct();
  }, []);

  async function loadProduct() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("Необходимо войти в аккаунт");
      setLoading(false);
      return;
    }

    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", Number(id))
      .eq("user_id", session.user.id)
      .single();

    if (!product) {
      alert("Объявление не найдено или у вас нет доступа");
      setLoading(false);
      return;
    }

    setFormData({
      title: product.title || "",
      game: product.game || "",
      category: product.category || "",
      price: product.price || "",
      quantity: product.quantity?.toString() || "1",
      description: product.description || "",
      image_url: product.image_url || "",
    });

    if (product.image_url) {
      setPreview(product.image_url);
    }

    setLoading(false);
  }

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

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const quantity = parseInt(formData.quantity);

    if (isNaN(quantity) || quantity < 1) {
      alert("Количество должно быть не меньше 1");
      return;
    }

    setSaving(true);

    let imageUrl = formData.image_url;

    if (image) {
      const fileName = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-image")
        .upload(fileName, image);

      if (uploadError) {
        alert(uploadError.message);
        setSaving(false);
        return;
      }

      const { data } = supabase.storage
        .from("product-image")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("products")
      .update({
        title: formData.title,
        game: formData.game,
        category: formData.category,
        price: formData.price,
        quantity: quantity,
        description: formData.description,
        image_url: imageUrl,
      })
      .eq("id", Number(id));

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.assign(`/listing/${id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        Загрузка...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Редактировать объявление
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2">Название товара</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Игра</label>
            <select
              name="game"
              value={formData.game}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            >
              <option value="">Выберите игру</option>
              {games.map((game) => (
                <option key={game.name} value={game.name}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Категория</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            >
              <option value="">Выберите категорию</option>
              {categories
                .filter((c) => c.name !== "Все")
                .map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Цена (₽)</label>
            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            />
          </div>

          {/* НОВОЕ ПОЛЕ — КОЛИЧЕСТВО */}
          <div>
            <label className="block mb-2">Количество</label>
            <input
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              required
            />
            <p className="text-zinc-500 text-sm mt-1">
              Укажите сколько единиц товара вы продаёте
            </p>
          </div>

          <div>
            <label className="block mb-2">Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            />
          </div>

          <div>
            <label className="block mb-2">Изображение</label>
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

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold px-8 py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>

            <button
              type="button"
              onClick={() => window.location.assign(`/listing/${id}`)}
              className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-500 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}