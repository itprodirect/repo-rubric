"use client";

import { useRouter } from "next/navigation";
import { AssessmentPicker } from "./AssessmentPicker";

interface CompareButtonProps {
  currentId: string;
}

export function CompareButton({ currentId }: CompareButtonProps) {
  const router = useRouter();

  const handleSelect = (selectedId: string) => {
    router.push(`/compare?a=${currentId}&b=${selectedId}`);
  };

  return <AssessmentPicker excludeId={currentId} onSelect={handleSelect} />;
}
