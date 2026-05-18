"use client";

import { useState, useTransition } from "react";

type Segment = "weekly" | "monthly" | "both" | "all";

export type CampaignEditorProps = {
  campaign: {
    id: string;
    postSlug: string;
    postType: "musing" | "short";
    subject: string;
    preheader: string;
    personalNote: string | null;
    bodySnapshot: string;
    segment: Segment;
    scheduledFor: number | null;
    status: string;
    sentAt: number | null;
    sentCount: number;
    openCount: number;
  };
  previewHtml: string;
  actions: {
    save: (form: FormData) => Promise<void>;
    schedule: () => Promise<void>;
    sendNow: () => Promise<void>;
    sendTest: (to: string) => Promise<void>;
  };
};

export function CampaignEditor({ campaign, previewHtml, actions }: CampaignEditorProps) {
  const [pending, startTransition] = useTransition();
  const [scheduledIso, setScheduledIso] = useState(
    campaign.scheduledFor ? toLocalIso(campaign.scheduledFor) : "",
  );
  const [preheaderLen, setPreheaderLen] = useState(campaign.preheader.length);
  const [testEmail, setTestEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function handleSave(form: FormData) {
    startTransition(async () => {
      await actions.save(form);
      setStatus("saved.");
    });
  }

  function handleSchedule() {
    if (!scheduledIso) {
      setStatus("pick a date first.");
      return;
    }
    startTransition(async () => {
      await actions.schedule();
      setStatus("scheduled.");
    });
  }

  function handleSendNow() {
    if (
      !window.confirm(
        "send to every active subscriber in this segment? it's going out the door.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await actions.sendNow();
      setStatus("sent. now go for a walk.");
    });
  }

  function handleSendTest() {
    if (!testEmail) return;
    startTransition(async () => {
      await actions.sendTest(testEmail);
      setStatus(`test sent to ${testEmail}.`);
    });
  }

  const readonly = campaign.status === "sent" || campaign.status === "sending";

  return (
    <div>
      <h1>
        Campaign · <em>{campaign.subject || "(untitled)"}</em>
      </h1>
      <p className="admin-sub">
        from{" "}
        <code className="admin-path">
          {campaign.postType}/{campaign.postSlug}
        </code>{" "}
        · status <strong>{campaign.status}</strong>
        {campaign.sentAt
          ? ` · sent to ${campaign.sentCount} on ${new Date(campaign.sentAt).toLocaleString()}`
          : null}
      </p>

      <div className="admin-campaign-grid">
        <form
          action={handleSave}
          style={{ display: "grid", gap: 14 }}
          onChange={() => setStatus(null)}
        >
          <Field
            label="subject"
            input={
              <input
                name="subject"
                defaultValue={campaign.subject}
                className="input"
                disabled={readonly}
                required
              />
            }
          />
          <Field
            label={`preheader (${preheaderLen}/90)`}
            input={
              <input
                name="preheader"
                defaultValue={campaign.preheader}
                className="input"
                disabled={readonly}
                maxLength={90}
                onChange={(e) => setPreheaderLen(e.target.value.length)}
              />
            }
          />
          <Field
            label="personal note (italic, top of email — optional)"
            input={
              <textarea
                name="personalNote"
                defaultValue={campaign.personalNote ?? ""}
                className="input"
                rows={3}
                disabled={readonly}
              />
            }
          />
          <Field
            label="body (markdown — same marks as posts: ==hand==, >>> quote, [[aside]])"
            input={
              <textarea
                name="bodySnapshot"
                defaultValue={campaign.bodySnapshot}
                className="input admin-body-snapshot"
                rows={22}
                disabled={readonly}
                required
              />
            }
          />
          <Field
            label="segment"
            input={
              <select
                name="segment"
                defaultValue={campaign.segment}
                className="input"
                disabled={readonly}
              >
                <option value="weekly">weekly only</option>
                <option value="monthly">monthly only</option>
                <option value="both">both-tier only</option>
                <option value="all">all active</option>
              </select>
            }
          />
          <Field
            label="schedule for (local time)"
            input={
              <input
                type="datetime-local"
                name="scheduledFor"
                className="input"
                value={scheduledIso}
                onChange={(e) => setScheduledIso(e.target.value)}
                disabled={readonly}
              />
            }
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={pending || readonly}
            >
              {pending ? "saving…" : "save draft"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSchedule}
              disabled={pending || readonly}
            >
              schedule
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleSendNow}
              disabled={pending || readonly}
            >
              send now →
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <input
              type="email"
              placeholder="send a test to…"
              className="input"
              style={{ maxWidth: 280 }}
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleSendTest}
              disabled={pending || !testEmail}
            >
              send test
            </button>
          </div>

          {status && (
            <p
              style={{
                color: "var(--ink-2)",
                fontStyle: "italic",
                fontSize: 13,
                marginTop: 4,
              }}
              role="status"
            >
              ↳ {status}
            </p>
          )}
        </form>

        <div className="admin-campaign-preview">
          <div className="admin-sub" style={{ margin: 0 }}>
            preview · what subscribers see
          </div>
          <iframe
            title="campaign preview"
            srcDoc={previewHtml}
            style={{
              width: "100%",
              height: 720,
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "#fff",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, input }: { label: string; input: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="admin-sub" style={{ margin: 0 }}>
        {label}
      </span>
      {input}
    </label>
  );
}

function toLocalIso(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
