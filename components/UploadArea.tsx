"use client";

import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";

interface Props {
  onFile: (file: File) => void;
}

export default function UploadArea({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl px-8 py-12 text-center cursor-pointer transition-all
        ${dragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50/30"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={handleChange}
      />
      <UploadSimple
        className={`w-8 h-8 mx-auto mb-3 transition-colors ${dragging ? "text-blue-500" : "text-gray-300"}`}
        weight="thin"
      />
      <p className="text-gray-600 text-sm font-medium">
        Arraste o relatório do ERP aqui ou{" "}
        <span className="text-blue-600 underline">clique para selecionar</span>
      </p>
      <p className="text-gray-400 text-xs mt-1">Formatos aceitos: .csv, .xls, .xlsx</p>
    </div>
  );
}
