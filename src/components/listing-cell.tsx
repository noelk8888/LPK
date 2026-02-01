"use client";

import { useState } from "react";

interface Props {
  title: string;
  details: string;
}

export function ListingCell({ title, details }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="font-medium text-sm">{title || "(No title)"}</div>
      {details && (
        <>
          <button
            className="text-xs text-blue-600 hover:underline mt-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
          {expanded && (
            <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap font-sans max-w-[280px]">
              {details}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
