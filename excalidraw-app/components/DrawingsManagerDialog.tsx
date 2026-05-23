import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { restoreElements, restoreAppState } from "@excalidraw/excalidraw/data/restore";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import React, { useCallback, useEffect, useState } from "react";

import { useAtom, useAtomValue } from "../app-jotai";
import {
  commentsAtom,
  currentDrawingIdAtom,
  currentDrawingNameAtom,
  drawingsManagerOpenAtom,
  userAtom,
} from "../cloud-jotai";
import {
  deleteDrawing,
  listDrawings,
  loadDrawing,
  listComments,
  renameDrawing,
  saveDrawing,
  type CloudDrawing,
} from "../data/supabase";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import "./DrawingsManagerDialog.scss";

interface Props {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const DrawingsManagerDialog: React.FC<Props> = ({ excalidrawAPI }) => {
  const [isOpen, setIsOpen] = useAtom(drawingsManagerOpenAtom);
  const user = useAtomValue(userAtom);
  const [, setCurrentDrawingId] = useAtom(currentDrawingIdAtom);
  const [, setCurrentDrawingName] = useAtom(currentDrawingNameAtom);
  const [, setComments] = useAtom(commentsAtom);

  const [drawings, setDrawings] = useState<CloudDrawing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listDrawings();
      setDrawings(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  if (!isOpen) {
    return null;
  }

  const close = () => setIsOpen(false);

  const handleLoad = async (drawing: CloudDrawing) => {
    if (!excalidrawAPI) {
      return;
    }
    try {
      const full = await loadDrawing(drawing.id);
      const elements = restoreElements(full.elements, null, {
        repairBindings: true,
        deleteInvisibleElements: true,
      });
      const appState = restoreAppState(full.app_state, null);
      excalidrawAPI.updateScene({
        elements,
        appState: { ...appState, isLoading: false },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      if (full.files) {
        const fileDataArray = Object.values(full.files);
        if (fileDataArray.length > 0) {
          excalidrawAPI.addFiles(fileDataArray as any);
        }
      }
      setCurrentDrawingId(full.id);
      setCurrentDrawingName(full.name);
      // Load comments for this drawing
      const comments = await listComments(full.id);
      setComments(comments);
      close();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this drawing? This cannot be undone.")) {
      return;
    }
    try {
      await deleteDrawing(id);
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleStartRename = (drawing: CloudDrawing) => {
    setRenamingId(drawing.id);
    setRenameValue(drawing.name);
  };

  const handleRename = async (id: string) => {
    const name = renameValue.trim() || "Untitled";
    try {
      await renameDrawing(id, name);
      setDrawings((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name } : d)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRenamingId(null);
    }
  };

  const handleNewDrawing = async () => {
    if (!excalidrawAPI) {
      return;
    }
    excalidrawAPI.resetScene();
    setCurrentDrawingId(null);
    setCurrentDrawingName("Untitled");
    setComments([]);
    close();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Dialog
      onCloseRequest={close}
      title="My Cloud Drawings"
      size="wide"
      className="drawings-manager"
    >
      <div className="drawings-manager__toolbar">
        <button
          className="drawings-manager__btn drawings-manager__btn--primary"
          onClick={handleNewDrawing}
        >
          + New Drawing
        </button>
      </div>
      {error && <p className="drawings-manager__error">{error}</p>}
      {loading ? (
        <p className="drawings-manager__empty">Loading…</p>
      ) : drawings.length === 0 ? (
        <p className="drawings-manager__empty">No cloud drawings yet.</p>
      ) : (
        <ul className="drawings-manager__list">
          {drawings.map((d) => (
            <li key={d.id} className="drawings-manager__item">
              <div className="drawings-manager__info">
                {renamingId === d.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRename(d.id);
                    }}
                    className="drawings-manager__rename-form"
                  >
                    <input
                      className="drawings-manager__rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="drawings-manager__btn">
                      Save
                    </button>
                    <button
                      type="button"
                      className="drawings-manager__btn"
                      onClick={() => setRenamingId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="drawings-manager__name">{d.name}</span>
                    <span className="drawings-manager__date">
                      {formatDate(d.updated_at)}
                    </span>
                  </>
                )}
              </div>
              <div className="drawings-manager__actions">
                <button
                  className="drawings-manager__btn drawings-manager__btn--primary"
                  onClick={() => handleLoad(d)}
                >
                  Open
                </button>
                <button
                  className="drawings-manager__btn"
                  onClick={() => handleStartRename(d)}
                >
                  Rename
                </button>
                <button
                  className="drawings-manager__btn drawings-manager__btn--danger"
                  onClick={() => handleDelete(d.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
};
