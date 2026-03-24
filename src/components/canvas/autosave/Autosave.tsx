"use client";

import { useAppSelector } from "@/redux/store";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function Autosave() {
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "error" | "idle" | "saving"
  >("idle");
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const user = useAppSelector((s) => s.profile);
  const shapesState = useAppSelector((s) => s.shapes);
  const viewportState = useAppSelector((s) => s.viewport);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const isReady = Boolean(projectId && user?.id);

  switch (saveStatus) {
    case "saved":
      return (
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4" />
        </div>
      );
    case "error":
      return (
        <div className="flex items-center">
          <AlertCircle className="w-4 h-4" />
        </div>
      );
    default:
      return null;
  }
}
