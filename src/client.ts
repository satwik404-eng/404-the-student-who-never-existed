import { createClient, type User } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { flowType: "pkce", detectSessionInUrl: false },
      })
    : null;
export const supportedIdentity = (user: User | null) =>
  !!user &&
  !user.is_anonymous &&
  !!user.identities?.some(
    (i) => i.provider === "google" || i.provider === "apple",
  );
export function browserSlot() {
  let slot = localStorage.getItem("404-browser-slot");
  if (!slot || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(slot)) {
    slot = crypto.randomUUID();
    localStorage.setItem("404-browser-slot", slot);
  }
  return slot;
}
