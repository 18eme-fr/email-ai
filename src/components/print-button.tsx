"use client";

export function PrintButton({ label = "Imprimer / PDF", target }: { label?: string; target?: string }) {
  return (
    <button
      onClick={() => {
        if (target) window.open(target, "_blank");
        else window.print();
      }}
      className="text-sm bg-spot text-stage-950 rounded-lg px-3 py-2 font-medium"
    >
      🖨 {label}
    </button>
  );
}
