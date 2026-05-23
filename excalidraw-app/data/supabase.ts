import { createClient } from "@supabase/supabase-js";

import type {
  ExcalidrawElement,
  FileId,
} from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export const supabase = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL ?? "",
  import.meta.env.VITE_APP_SUPABASE_ANON_KEY ?? "",
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudDrawing {
  id: string;
  user_id: string;
  name: string;
  elements: ExcalidrawElement[];
  app_state: Partial<AppState>;
  files: BinaryFiles;
  created_at: string;
  updated_at: string;
}

export interface CloudComment {
  id: string;
  drawing_id: string;
  user_id: string;
  content: string;
  x: number | null;
  y: number | null;
  resolved: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Drawings CRUD
// ---------------------------------------------------------------------------

export async function saveDrawing(
  name: string,
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): Promise<CloudDrawing> {
  const { data, error } = await supabase
    .from("drawings")
    .insert({
      name,
      elements: JSON.parse(JSON.stringify(elements)),
      app_state: sanitiseAppState(appState),
      files: JSON.parse(JSON.stringify(files)),
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as CloudDrawing;
}

export async function updateDrawing(
  id: string,
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): Promise<void> {
  const { error } = await supabase
    .from("drawings")
    .update({
      elements: JSON.parse(JSON.stringify(elements)),
      app_state: sanitiseAppState(appState),
      files: JSON.parse(JSON.stringify(files)),
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function renameDrawing(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("drawings")
    .update({ name })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listDrawings(): Promise<CloudDrawing[]> {
  const { data, error } = await supabase
    .from("drawings")
    .select("id,user_id,name,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as CloudDrawing[];
}

export async function loadDrawing(id: string): Promise<CloudDrawing> {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as CloudDrawing;
}

export async function deleteDrawing(id: string): Promise<void> {
  const { error } = await supabase.from("drawings").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// Comments CRUD
// ---------------------------------------------------------------------------

export async function addComment(
  drawingId: string,
  content: string,
  x: number | null,
  y: number | null,
): Promise<CloudComment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ drawing_id: drawingId, content, x, y })
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as CloudComment;
}

export async function listComments(drawingId: string): Promise<CloudComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as CloudComment[];
}

export async function resolveComment(id: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .update({ resolved: true })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitiseAppState(appState: Partial<AppState>): Record<string, unknown> {
  // Strip non-serialisable / per-session fields
  const {
    collaborators,
    isLoading,
    errorMessage,
    openDialog,
    openSidebar,
    ...rest
  } = appState as any;
  return rest;
}
