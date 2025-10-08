import React from 'react';

const AddProductModal = ({ isOpen, shelf, data, onClose, onChange, onSubmit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4">➕ Add Product to Shelf: {shelf}</h3>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Code Product</label>
                        <input
                            type="text"
                            className="border w-full p-2 rounded"
                            value={data.codeProduct}
                            onChange={(e) => onChange((prev) => ({ ...prev, codeProduct: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Row</label>
                        <input
                            type="text"
                            className="border w-full p-2 rounded"
                            value={data.row}
                            onChange={(e) => onChange((prev) => ({ ...prev, row: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1 bg-gray-400 text-white rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1 bg-blue-600 text-white rounded"
                        >
                            Add
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductModal;
