import { supabase } from "./supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, game, category, price, quantity, seller, image_url, user_id, status")
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export async function getProductById(id: number) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}