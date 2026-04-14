"use client";

import { useFormStatus } from "react-dom";
import { rollSuffix } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-zinc-300 px-2 py-1 text-xs transition-opacity hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      Re-roll
    </button>
  );
}

export function RollButton({ suffix }: { suffix: string | undefined }) {
  return (
    <form
      action={rollSuffix}
      className="flex items-center gap-2 text-xs text-zinc-500"
    >
      <span>
        Random suffix: <code>{suffix ?? "(none)"}</code>
      </span>
      <SubmitButton />
    </form>
  );
}
