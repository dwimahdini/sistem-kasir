"use client";

import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-coffee-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-xl font-bold text-coffee-900">
            {title}
          </h2>
          <button
            aria-label="Tutup"
            className="grid size-9 place-items-center rounded-full bg-coffee-100 text-coffee-700 hover:bg-coffee-200"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
