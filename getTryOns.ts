import { supabase } from "./supabaseClient";

export async function getTryOns(userId: string) {
  const { data, error } = await supabase
    .from("tryons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching try-ons:", error);
    throw error;
  }

  return data;
}
