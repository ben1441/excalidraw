import type { User } from "@supabase/supabase-js";

import { atom } from "./app-jotai";

import type { CloudComment } from "./data/supabase";

export const userAtom = atom<User | null>(null);
export const currentDrawingIdAtom = atom<string | null>(null);
export const currentDrawingNameAtom = atom<string>("Untitled");
export const cloudSyncStatusAtom = atom<
  "idle" | "saving" | "saved" | "error"
>("idle");

export const commentsAtom = atom<CloudComment[]>([]);
export const commentModeAtom = atom<boolean>(false);
export const pendingCommentPosAtom = atom<{ x: number; y: number } | null>(
  null,
);

export const authDialogOpenAtom = atom<boolean>(false);
export const drawingsManagerOpenAtom = atom<boolean>(false);
