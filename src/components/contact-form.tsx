"use client";
import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { ApiError } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Field, Select } from "./ui";

const TOPICS = [{ value: "pilot", label: "Start a pilot" }, { value: "sales", label: "Pricing and plans" }, { value: "support", label: "Support" }, { value: "press", label: "Press" }, { value: "other", label: "Something else" }];

export function ContactForm() {
  const [topic, setTopic] = useState("pilot");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (v("message").length < 10) return setError("Tell us a little more, at least a sentence.");
    setState("sending");
    setError(null);
    try {
      await sk.public.contact({ name: v("name"), email: v("email"), company: v("company") || undefined, topic: topic as "pilot", message: v("message"), website: v("website") || undefined });
      setState("done");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? "Too many messages from this connection. Please try again shortly." : err instanceof ApiError && err.status === 400 ? "Please check your details and try again." : "We could not send that. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="contact-card glass" role="status">
        <h2 className="section-title">Message received</h2>
        <p className="muted">Thank you. We will reply by email.</p>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="contact-card glass form-grid" noValidate>
      <div className="form-grid two">
        <Field label="Your name" htmlFor="c-name"><input id="c-name" name="name" className="input" autoComplete="name" required /></Field>
        <Field label="Work email" htmlFor="c-email"><input id="c-email" name="email" type="email" className="input" autoComplete="email" required /></Field>
        <Field label="Company" htmlFor="c-company"><input id="c-company" name="company" className="input" autoComplete="organization" /></Field>
        <Field label="Topic" htmlFor="c-topic"><Select id="c-topic" value={topic} onValueChange={setTopic} options={TOPICS} /></Field>
      </div>
      <Field label="How can we help?" htmlFor="c-message"><textarea id="c-message" name="message" className="input area" rows={6} required minLength={10} maxLength={4000} /></Field>
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="btn primary lg shine" disabled={state === "sending"}><Send size={16} />{state === "sending" ? "Sending" : "Send message"}</button>
    </form>
  );
}
