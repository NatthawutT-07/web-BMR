import React, { useState, useEffect, useRef } from "react";
import CameraBarcodeScannerModal from "../../../../../user/components/CameraBarcodeScannerModal";
import { getMasterItem } from "../../../../../../api/admin/template";

const AddProductModal = React.memo(
    ({
        isOpen,
        onClose,
        onSubmit,
        nextIndex,
        branchCode,
        shelfCode,
        rowNo,
        shelfProducts = [],
        onIncNextIndex,
    }) => {
        const inputRef = useRef(null);

        const [query, setQuery] = useState("");
        const [results, setResults] = useState([]);
        const [selected, setSelected] = useState(null);

        const [checking, setChecking] = useState(false);
        const [saving, setSaving] = useState(false);

        const [error, setError] = useState("");
        const [success, setSuccess] = useState("");

        // ✅ Camera scanner state
        const [cameraOpen, setCameraOpen] = useState(false);

        const [lastCheckedQuery, setLastCheckedQuery] = useState("");
        const isFreshChecked =
            query.trim().length >= 2 && query.trim() === lastCheckedQuery;

        const focusInput = () =>
            setTimeout(() => inputRef.current?.focus?.(), 0);

        useEffect(() => {
            if (isOpen) {
                setQuery("");
                setResults([]);
                setSelected(null);
                setChecking(false);
                setSaving(false);
                setError("");
                setSuccess("");
                setLastCheckedQuery("");
                setCameraOpen(false);
                focusInput();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isOpen]);

        const handleChangeQuery = (v) => {
            setQuery(v);
            setError("");
            setSuccess("");

            // ✅ เปลี่ยนข้อความแล้ว = ต้องเช็คใหม่
            setLastCheckedQuery("");
            setResults([]);
            setSelected(null);
        };

        const handleCheck = async () => {
            if (checking || saving) return;

            const q = query.trim();
            if (q.length < 2) {
                setError("พิมพ์อย่างน้อย 2 ตัวอักษร แล้วกด Check");
                setResults([]);
                setSelected(null);
                setLastCheckedQuery("");
                return;
            }

            setChecking(true);
            setError("");
            setSuccess("");

            try {
                const res = await getMasterItem(q);
                const items = Array.isArray(res?.items) ? res.items : [];

                setResults(items);
                setLastCheckedQuery(q);

                // ถ้าผลลัพธ์ไม่มี selected เดิม → เคลียร์
                if (
                    selected &&
                    !items.some(
                        (x) => Number(x.codeProduct) === Number(selected.codeProduct)
                    )
                ) {
                    setSelected(null);
                }

                if (items.length === 0) setError("ไม่พบรายการที่ตรงกัน");
            } catch (e) {
                console.error("Check master item failed:", e);
                setResults([]);
                setSelected(null);
                setLastCheckedQuery("");
                setError("❌ Check ไม่สำเร็จ (เช็ค server log)");
            } finally {
                setChecking(false);
                focusInput();
            }
        };

        const handlePick = (item) => {
            setSelected(item);
            setError("");
            setSuccess("");
        };

        const clearForNextScan = () => {
            setQuery("");
            setResults([]);
            setSelected(null);
            setError("");
            setLastCheckedQuery("");
            focusInput();
        };

        const handleAdd = async () => {
            if (saving || checking) return;

            if (!isFreshChecked) {
                setError("กรุณากด Check ก่อน (หรือข้อความเปลี่ยนแล้ว ต้องเช็คใหม่)");
                focusInput();
                return;
            }

            if (!selected?.codeProduct) {
                setError("กรุณาเลือกสินค้าจากรายการก่อน");
                return;
            }

            const codeNum = Number(selected.codeProduct);
            if (Number.isNaN(codeNum)) {
                setError("codeProduct ไม่ถูกต้อง");
                return;
            }

            const duplicate = shelfProducts.some(
                (p) => Number(p.codeProduct) === codeNum
            );
            if (duplicate) {
                setError("❌ สินค้านี้มีอยู่แล้วใน Shelf นี้");
                return;
            }

            const payload = {
                codeProduct: codeNum,
                barcode: selected.barcode ?? null,
                nameProduct: selected.nameProduct ?? null,
                nameBrand: selected.nameBrand ?? null,
                shelfLife: selected.shelfLife ?? null,
                salesPriceIncVAT: selected.salesPriceIncVAT ?? null,

                index: nextIndex,
                branchCode,
                shelfCode,
                rowNo,
            };

            setSaving(true);
            setError("");
            setSuccess("");

            try {
                await onSubmit?.(payload);
                setSuccess("✅ Added");

                // ✅ เหมือนตัวอย่าง: เพิ่ม nextIndex เพื่อยิงตัวถัดไป
                onIncNextIndex?.();

                clearForNextScan();
            } catch (err) {
                console.error("Add item failed:", err);
                setError("❌ Add ไม่สำเร็จ (เช็ค server log)");
                focusInput();
            } finally {
                setSaving(false);
            }
        };

        // ✅ Camera detected: set query and auto-check
        const onCameraDetected = React.useCallback((code) => {
            setCameraOpen(false);
            const trimmed = String(code || "").trim();
            if (trimmed.length >= 2) {
                setQuery(trimmed);
                setError("");
                setSuccess("");
                setLastCheckedQuery("");
                setResults([]);
                setSelected(null);
                // Auto trigger check
                setTimeout(async () => {
                    setChecking(true);
                    try {
                        const res = await getMasterItem(trimmed);
                        const items = Array.isArray(res?.items) ? res.items : [];
                        setResults(items);
                        setLastCheckedQuery(trimmed);
                        if (items.length === 0) setError("ไม่พบรายการที่ตรงกัน");
                    } catch (e) {
                        console.error("Check master item failed:", e);
                        setResults([]);
                        setLastCheckedQuery("");
                        setError("❌ Check ไม่สำเร็จ");
                    } finally {
                        setChecking(false);
                        focusInput();
                    }
                }, 100);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const onKeyDownInput = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleCheck();
            }
        };


        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                {/* Camera Scanner Modal */}
                <CameraBarcodeScannerModal
                    open={cameraOpen}
                    onClose={() => setCameraOpen(false)}
                    onDetected={onCameraDetected}
                />

                <div className="bg-white p-6 rounded-lg w-[98vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">➕ Add item</h2>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                            disabled={saving || checking}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                Barcode / Keyword
                            </label>

                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => handleChangeQuery(e.target.value)}
                                    onKeyDown={onKeyDownInput}
                                    placeholder="885xxxxxxxx / ชื่อสินค้า / แบรนด์"
                                    className={`flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 ${error ? "border-red-300" : "border-gray-300"
                                        }`}
                                    autoFocus
                                    disabled={saving || checking}
                                />

                                {/* ✅ Camera Scan Button */}
                                <button
                                    type="button"
                                    onClick={() => setCameraOpen(true)}
                                    disabled={saving || checking}
                                    className="px-3 py-2 rounded text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-500"
                                    title="สแกนบาร์โค้ดด้วยกล้อง"
                                >
                                    📷
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCheck}
                                    disabled={checking || saving || query.trim().length < 2}
                                    className={[
                                        "px-4 py-2 rounded text-sm font-semibold",
                                        checking || saving || query.trim().length < 2
                                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700",
                                    ].join(" ")}
                                >
                                    {checking ? "Checking..." : "Check"}
                                </button>
                            </div>

                            <div className="mt-1 text-[12px] text-gray-500 flex items-center gap-2">
                                <span>
                                    {query.trim().length < 2
                                        ? "พิมพ์อย่างน้อย 2 ตัวอักษร แล้วกด Check"
                                        : isFreshChecked
                                            ? `เช็คแล้ว • พบ ${results.length} รายการ`
                                            : "ยังไม่เช็ค / ข้อความเปลี่ยนแล้ว"}
                                </span>

                                {saving && (
                                    <span className="text-emerald-700 font-medium">
                                        • กำลังบันทึก...
                                    </span>
                                )}

                                {success && !saving && !checking && (
                                    <span className="text-emerald-700 font-medium">
                                        • {success}
                                    </span>
                                )}
                            </div>

                            {error && (
                                <div className="mt-2 text-red-600 text-sm">{error}</div>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="max-h-[280px] overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-2 py-2 text-left w-[160px]">Barcode</th>
                                            <th className="px-2 py-2 text-center w-[90px]">Code</th>
                                            <th className="px-2 py-2 text-left">Name</th>
                                            <th className="px-2 py-2 text-left w-[160px]">Brand</th>
                                            <th className="px-2 py-2 text-center w-[90px]">Select</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {results.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-2 py-4 text-center text-gray-500"
                                                >
                                                    {isFreshChecked
                                                        ? "ไม่พบรายการที่ตรงกัน"
                                                        : "กด Check เพื่อดึงรายการ"}
                                                </td>
                                            </tr>
                                        ) : (
                                            results.map((it) => {
                                                const isSelected =
                                                    Number(selected?.codeProduct) ===
                                                    Number(it.codeProduct);

                                                return (
                                                    <tr
                                                        key={it.codeProduct}
                                                        className={isSelected ? "bg-emerald-50" : "bg-white"}
                                                    >
                                                        <td className="px-2 py-2 whitespace-nowrap">
                                                            {it.barcode || "-"}
                                                        </td>
                                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                                            {String(it.codeProduct || "").padStart(5, "0")}
                                                        </td>
                                                        <td
                                                            className="px-2 py-2 max-w-[520px] whitespace-nowrap overflow-hidden text-ellipsis"
                                                            title={it.nameProduct || ""}
                                                        >
                                                            {it.nameProduct || "-"}
                                                        </td>
                                                        <td
                                                            className="px-2 py-2 max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis"
                                                            title={it.nameBrand || ""}
                                                        >
                                                            {it.nameBrand || "-"}
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePick(it)}
                                                                disabled={saving || checking}
                                                                className={`px-2 py-1 rounded text-[11px] ${isSelected
                                                                    ? "bg-emerald-600 text-white"
                                                                    : "bg-gray-100 hover:bg-gray-200"
                                                                    }`}
                                                            >
                                                                {isSelected ? "Selected" : "Choose"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t p-3 bg-white">
                                <div className="text-xs text-gray-600">
                                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                                        <span>
                                            Branch: <b>{branchCode}</b>
                                        </span>
                                        <span>
                                            Shelf: <b>{shelfCode}</b>
                                        </span>
                                        <span>
                                            Row: <b>{rowNo}</b>
                                        </span>
                                        <span>
                                            Index: <b>{nextIndex}</b>
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        Selected:{" "}
                                        <b>
                                            {selected?.nameProduct
                                                ? `${selected.nameProduct} (${String(
                                                    selected.codeProduct
                                                ).padStart(5, "0")})`
                                                : "-"}
                                        </b>
                                        {selected?.barcode ? (
                                            <span className="ml-2 text-gray-500">
                                                • {selected.barcode}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving || checking}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={
                                    !selected?.codeProduct || saving || checking || !isFreshChecked
                                }
                                className={`px-3 py-1.5 text-sm rounded ${selected?.codeProduct && !saving && !checking && isFreshChecked
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    }`}
                            >
                                {saving ? "Saving..." : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

export default AddProductModal;
