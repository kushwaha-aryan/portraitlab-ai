import { AlertTriangle } from "lucide-react";
import type { ProviderSetupStatus } from "@/types/photo";

export function ProviderSetupNotice({
  status,
}: {
  status: ProviderSetupStatus;
}) {
  if (status.configured) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <div className="min-w-0 text-xs leading-relaxed text-amber-900">
        <p className="text-sm font-semibold">Photo editing is not set up yet</p>
        <p className="mt-1">
          The active provider is{" "}
          <span className="font-medium">{status.label}</span>
          {status.free ? " (free tier)" : ""} and it needs{" "}
          {status.requiredEnvVars.map((name, index) => (
            <span key={name}>
              {index > 0 ? " and " : ""}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                {name}
              </code>
            </span>
          ))}
          . Add{" "}
          {status.requiredEnvVars.length > 1 ? "them" : "it"} to{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
            .env.local
          </code>{" "}
          and restart{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
            npm run dev
          </code>
          .
        </p>
        <p className="mt-1">
          Get a key:{" "}
          <a
            href={status.setupUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            {status.setupUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
