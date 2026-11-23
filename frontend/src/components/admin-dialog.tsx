"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function AdminDialog({ label, onClose, className, children }: {
  label: string;
  onClose?: () => void;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={ref} aria-label={label} className={className} onCancel={(event) => {
      event.preventDefault();
      onClose?.();
    }}>
      {children}
    </dialog>
  );
}
