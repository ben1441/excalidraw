import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import React, { useState } from "react";

import { useAtom } from "../app-jotai";
import { authDialogOpenAtom, userAtom } from "../cloud-jotai";
import { supabase } from "../data/supabase";

import "./AuthDialog.scss";

export const AuthDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(authDialogOpenAtom);
  const [, setUser] = useAtom(userAtom);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const close = () => {
    setIsOpen(false);
    setError(null);
    setSuccessMsg(null);
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          throw error;
        }
        setSuccessMsg("Check your email for a confirmation link.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }
        setUser(data.user);
        close();
      }
    } catch (err: any) {
      setError(err.message ?? "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      onCloseRequest={close}
      title={mode === "signin" ? "Sign in to Cloud Sync" : "Create account"}
      size="small"
      className="auth-dialog"
    >
      <form className="auth-dialog__form" onSubmit={handleSubmit}>
        {successMsg ? (
          <p className="auth-dialog__success">{successMsg}</p>
        ) : (
          <>
            <label className="auth-dialog__label">
              Email
              <input
                type="email"
                className="auth-dialog__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="auth-dialog__label">
              Password
              <input
                type="password"
                className="auth-dialog__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={6}
              />
            </label>
            {error && <p className="auth-dialog__error">{error}</p>}
            <button
              type="submit"
              className="auth-dialog__submit"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </>
        )}
        <p className="auth-dialog__toggle">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className="auth-dialog__link"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have one?{" "}
              <button
                type="button"
                className="auth-dialog__link"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </form>
    </Dialog>
  );
};
