import { config } from "@/lib/config";
import { inMemoryDal } from "./inMemory";
import { supabaseDal } from "./supabase";
import type { Dal } from "./types";

/**
 * Selektor — en enda plats där test/live-DAL byts.
 * Routes anropar `dal()` och slipper veta vilken implementation som körs.
 */
export function dal(): Dal {
  return config.mode === "live" ? supabaseDal : inMemoryDal;
}

export type { Dal } from "./types";
