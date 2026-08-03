import { supabase } from "./supabaseClient.js";

export async function getFavoriteIds(userId) {
  const { data, error } = await supabase.from("favorites").select("frog_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((row) => row.frog_id));
}

export async function addFavorite(userId, frogId) {
  const { error } = await supabase.from("favorites").insert({ user_id: userId, frog_id: frogId });
  if (error) throw error;
}

export async function removeFavorite(userId, frogId) {
  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("frog_id", frogId);
  if (error) throw error;
}
