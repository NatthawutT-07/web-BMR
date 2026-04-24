import React, { useState } from "react";

const MultiSelect = ({ label, options, selected, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");

    const toggle = (val) => {
        if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
        else onChange([...selected, val]);
    };

    const filtered = q.trim()
        ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
        : options;

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="w-full text-left border rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 transition min-h-[38px]"
            >
                {selected.length === 0
                    ? <span className="text-gray-400">ทั้งหมด</span>
                    : <span className="text-gray-700">{selected.length} selected</span>}
            </button>
            {open && (
                <div className="absolute z-20 mt-1 min-w-[220px] sm:min-w-[260px] max-w-sm max-h-60 overflow-y-auto bg-white border rounded-lg shadow-lg font-normal text-gray-800">
                    <div className="sticky top-0 bg-white border-b p-1.5">
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs text-gray-800"
                        />
                    </div>
                    <div className="flex justify-between items-center px-3 py-1.5 border-b bg-gray-50">
                        <button
                            type="button"
                            onClick={() => onChange(options)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                        >
                            เลือกทั้งหมด
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange([]); setQ(""); }}
                            className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 transition"
                            title="ล้าง"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            ล้าง
                        </button>
                    </div>
                    {filtered.map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-800"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                onChange={() => toggle(opt)}
                                className="accent-blue-600"
                            />
                            <span className="whitespace-normal leading-tight break-words">{opt}</span>
                        </label>
                    ))}
                    {filtered.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">ไม่พบ</div>
                    )}
                </div>
            )}
            {open && (
                <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQ(""); }} />
            )}
        </div>
    );
};

export default MultiSelect;
