import React, { useState } from "react";

import { useAtom, useAtomValue } from "../app-jotai";
import {
  commentModeAtom,
  commentsAtom,
  currentDrawingIdAtom,
  pendingCommentPosAtom,
  userAtom,
} from "../cloud-jotai";
import {
  addComment,
  deleteComment,
  resolveComment,
} from "../data/supabase";

import "./CommentsPanel.scss";

export const CommentsPanel: React.FC = () => {
  const user = useAtomValue(userAtom);
  const currentDrawingId = useAtomValue(currentDrawingIdAtom);
  const [commentMode, setCommentMode] = useAtom(commentModeAtom);
  const [pendingPos, setPendingPos] = useAtom(pendingCommentPosAtom);
  const [comments, setComments] = useAtom(commentsAtom);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  if (!user) {
    return (
      <div className="comments-panel comments-panel--empty">
        <p>Sign in to use comments.</p>
      </div>
    );
  }

  if (!currentDrawingId) {
    return (
      <div className="comments-panel comments-panel--empty">
        <p>Save this drawing to the cloud first to add comments.</p>
      </div>
    );
  }

  const handleStartPlacement = () => {
    setCommentMode(true);
  };

  const handleCancelPlacement = () => {
    setCommentMode(false);
    setPendingPos(null);
    setDraftText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim() || !currentDrawingId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const comment = await addComment(
        currentDrawingId,
        draftText.trim(),
        pendingPos?.x ?? null,
        pendingPos?.y ?? null,
      );
      setComments((prev) => [...prev, comment]);
      setDraftText("");
      setPendingPos(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveComment(id);
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
      );
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="comments-panel">
      {error && <p className="comments-panel__error">{error}</p>}

      {commentMode ? (
        <div className="comments-panel__placement-hint">
          <p>Click on the canvas to place your comment.</p>
          <button
            className="comments-panel__btn"
            onClick={handleCancelPlacement}
          >
            Cancel
          </button>
        </div>
      ) : pendingPos ? (
        <form className="comments-panel__draft" onSubmit={handleSubmit}>
          <p className="comments-panel__draft-label">New comment</p>
          <textarea
            className="comments-panel__textarea"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Write your comment…"
            rows={3}
            autoFocus
          />
          <div className="comments-panel__draft-actions">
            <button
              type="submit"
              className="comments-panel__btn comments-panel__btn--primary"
              disabled={submitting || !draftText.trim()}
            >
              {submitting ? "Saving…" : "Add"}
            </button>
            <button
              type="button"
              className="comments-panel__btn"
              onClick={handleCancelPlacement}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="comments-panel__toolbar">
          <button
            className="comments-panel__btn comments-panel__btn--primary"
            onClick={handleStartPlacement}
          >
            + Add Comment
          </button>
        </div>
      )}

      {unresolvedComments.length === 0 && resolvedComments.length === 0 && (
        <p className="comments-panel__empty">No comments yet.</p>
      )}

      {unresolvedComments.length > 0 && (
        <ul className="comments-panel__list">
          {unresolvedComments.map((c) => (
            <li key={c.id} className="comments-panel__item">
              <p className="comments-panel__content">{c.content}</p>
              <span className="comments-panel__date">
                {formatDate(c.created_at)}
              </span>
              <div className="comments-panel__item-actions">
                <button
                  className="comments-panel__btn"
                  onClick={() => handleResolve(c.id)}
                >
                  Resolve
                </button>
                <button
                  className="comments-panel__btn comments-panel__btn--danger"
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {resolvedComments.length > 0 && (
        <>
          <p className="comments-panel__section-label">Resolved</p>
          <ul className="comments-panel__list comments-panel__list--resolved">
            {resolvedComments.map((c) => (
              <li key={c.id} className="comments-panel__item">
                <p className="comments-panel__content">{c.content}</p>
                <span className="comments-panel__date">
                  {formatDate(c.created_at)}
                </span>
                <div className="comments-panel__item-actions">
                  <button
                    className="comments-panel__btn comments-panel__btn--danger"
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
