"use client";
export default function CopyLinkButton() {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert("Link copiado"))}
      className="w-full border rounded-xl py-2.5 text-sm font-medium"
    >
      Copiar link
    </button>
  );
}
