import React, { useState, useEffect } from "react";

const DeleteConfirmModal = React.memo(
    ({ isOpen, onClose, onConfirm, productName }) => {
        const [deleting, setDeleting] = useState(false);
        const [deleted, setDeleted] = useState(false);

        // Reset states when modal opens/closes
        useEffect(() => {
            if (isOpen) {
                setDeleting(false);
                setDeleted(false);
            }
        }, [isOpen]);

        const handleConfirm = async () => {
            setDeleting(true);
            try {
                await onConfirm?.();
                setDeleted(true);
                // Auto close after showing success
                setTimeout(() => {
                    onClose?.();
                }, 1000);
            } catch (e) {
                console.error("Delete failed:", e);
                setDeleting(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
                    {deleted ? (
                        // ✅ Success state
                        <div className="text-center py-4">
                            <div className="text-4xl mb-3">✅</div>
                            <h3 className="text-lg font-semibold text-emerald-700">
                                ลบสำเร็จแล้ว
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                "{productName || "-"}" ถูกลบออกแล้ว
                            </p>
                        </div>
                    ) : (
                        // ✅ Confirm state
                        <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Confirm Delete
                            </h3>

                            <p className="text-gray-600 mb-6">
                                Delete{" "}
                                <span className="font-semibold">"{productName || "-"}"</span>?
                                <br />
                                <span className="text-red-600 text-sm">
                                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                                </span>
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={deleting}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={deleting}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <span className="animate-spin">⏳</span> กำลังลบ...
                                        </>
                                    ) : (
                                        "Delete"
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
);

export default DeleteConfirmModal;
