import React, { useEffect, useState } from "react";
import { api } from "../app/api";
import { useSessionStore } from "../app/store";
import { Button, Field, GlassPanel, HeroPanel, MessageBanner } from "../components/ui";

export function AdminLoginPage() {
  const { adminToken, setAdminSession, logout } = useSessionStore();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminToken) return;

    api("/api/question-sets", { token: adminToken })
      .then(() => {
        window.location.hash = "#/admin/create";
      })
      .catch(() => {
        logout();
      });
  }, [adminToken, logout]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
      setAdminSession(data);
      window.location.hash = "#/admin/create";
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <div className="grid flex-1 place-items-center py-6">
      <div className="w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <HeroPanel
            eyebrow="Admin access"
            title="Coordinate a premium live cyber exercise."
            description="Launch sessions, manage participants, and steer each round from a clean control surface built for real-time facilitation."
          >
            <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Control</p>
                <p className="mt-3 text-sm text-zinc-300">Start, lock, reveal, and close rounds without losing pace.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Recovery</p>
                <p className="mt-3 text-sm text-zinc-300">Reconnect-safe participant and admin flows stay intact.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Clarity</p>
                <p className="mt-3 text-sm text-zinc-300">High-contrast panels and restrained motion keep the room readable.</p>
              </div>
            </div>
          </HeroPanel>

          <GlassPanel className="self-center">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Secure login</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Admin console</h2>
            <p className="mt-3 text-zinc-400">Authenticate to create a session and manage the live drill.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
              />
              {error && <MessageBanner>{error}</MessageBanner>}
              <Button className="w-full">Log in</Button>
            </form>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
