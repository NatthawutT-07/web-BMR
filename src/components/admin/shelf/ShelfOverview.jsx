import ShelfTable from './ShelfTable';

const ShelfOverview = ({ filteredShelfData, shelfDetail, visibleShelves,handleAddRow ,handleDeleteProduct }) => {
    // 👉 กรองเฉพาะ shelf ที่ผู้ใช้เลือกไว้
    const filtered = visibleShelves.length > 0
        ? filteredShelfData.filter(item => visibleShelves.includes(item.codeShelf))
        : filteredShelfData;

    // 👉 จัดกลุ่มตาม shelf และ row
    const groupedData = filtered.reduce((acc, cur) => {
        const shelf = cur.codeShelf;
        if (!acc[shelf]) acc[shelf] = { rows: {} };
        if (!acc[shelf].rows[cur.row]) acc[shelf].rows[cur.row] = [];
        acc[shelf].rows[cur.row].push(cur);
        return acc;
    }, {});

    return (
        <div className="grid grid-cols-1 gap-4 mt-4">
            {Object.entries(groupedData).map(([shelf, shelfData]) => (
                <div key={shelf} className="border rounded shadow p-4 bg-white w-full">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">
                            Shelf: {shelf} ({filtered.filter(p => p.codeShelf === shelf).length})
                        </h3>
                        <button
                            onClick={() => handleAddRow(shelf)}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm px-2 py-1 rounded"
                        >
                            + Product
                        </button>
                    </div>
                    <ShelfTable rows={shelfData.rows} shelfDetail={shelfDetail} handleDeleteProduct={handleDeleteProduct}/>
                </div>
            ))}
        </div>
    );
};

export default ShelfOverview;
