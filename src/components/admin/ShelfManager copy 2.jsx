import React, { useEffect, useState } from 'react';
import useBmrStore from '../../store/bmr_store';
import { listStation } from '../../api/users/home';
import { getShelfDetail, getShelfRow, addShelfProduct } from '../../api/admin/detailStation No use';
import BranchSelector from './shelf/BranchSelector';
import ShelfOverview from './shelf/ShelfOverview';
import AddProductModal from './shelf/addProductModal';

const ShelfManager = () => {
  const token = useBmrStore((state) => state.token);
  const [branches, setBranches] = useState([]); //stations
  const [selectedBranchCode, setSelectedBranchCode] = useState(''); //  selectedStationId

  const [shelfData, setShelfData] = useState([]); // stationDetails

  const [shelfDetail, setShelfDetail] = useState([]);
  const [filteredShelfData, setFilteredShelfData] = useState([]); // filteredDetails

  const [visibleShelves, setVisibleShelves] = useState([]); //select checkbox-dorpdown
  // add product in row
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProductShelf, setNewProductShelf] = useState('');
  const [newProductData, setNewProductData] = useState({
    codeProduct: '', row: ''
  });


  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBranches();
      fetchShelfData(token); //fetchStationDetails
    }
  }, [token]);

  const fetchBranches = () => {
    listStation()
      .then((res) => setBranches(res.data))
      .catch((err) => console.error('Error fetching branches:', err));
  };

  const fetchShelfData = async (token) => {
    setLoading(true);
    try {
      const res = await getShelfRow(token);
      setShelfData(res); // get All Data Shelf 
    } catch (err) {
      console.error('❌ Error fetching shelf data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(selectedBranchCode)
    const matched = shelfData.filter(
      (item) => String(item.branchCode) === String(selectedBranchCode)
    );

    setFilteredShelfData(matched);
    if (!matched.length) {
      console.log(matched)
      setShelfDetail([]);
      setLoading(false);
      return;
    }

    const items = matched.map((item) => ({
      branchCode: item.branchCode,
      codeProduct: item.codeProduct,
    }));
    console.log(items)
    try {
      const res = await getShelfDetail(token, items);
      setShelfDetail(res);
    } catch (err) {
      console.error('❌ Error fetching shelf Detail:', err);
      setShelfDetail([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  const uniqueShelves = Array.from(
    new Set(filteredShelfData.map(item => item.codeShelf))
  ).filter(Boolean); // กัน undefined/null

  const handleAddRow = (shelfCode) => {
    setNewProductShelf(shelfCode);
    setNewProductData({ codeProduct: '', row: '' });
    setIsModalOpen(true);
  };


  const handleAddProductSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      branchCode: selectedBranchCode,
      codeShelf: newProductShelf,
      row: newProductData.row,
      codeProduct: newProductData.codeProduct,
    };

    try {
      await addShelfProduct(token, payload);
      setIsModalOpen(false);


      await refreshAllShelfData();

    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Error saving new product');
    }
  };


  const refreshAllShelfData = async () => {
    setLoading(true);
    try {
      // 1. ดึง shelf row ใหม่ทั้งหมด
      const newShelfData = await getShelfRow(token);
      setShelfData(newShelfData);

      // 2. กรองข้อมูลตาม branch ที่เลือก
      const matched = newShelfData.filter(
        (item) => String(item.branchCode) === String(selectedBranchCode)
      );
      setFilteredShelfData(matched);

      if (matched.length === 0) {
        setShelfDetail([]);
        setLoading(false);
        return;
      }

      // 3. ดึงรายละเอียด shelf detail ใหม่
      const items = matched.map((item) => ({
        branchCode: item.branchCode,
        codeProduct: item.codeProduct,
      }));

      const res = await getShelfDetail(token, items);
      setShelfDetail(res);

    } catch (err) {
      console.error('Error refreshing shelf data:', err);
      setShelfDetail([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (product) => {
    console.log(product)
  }



  return (
    <div className="container mx-auto p-6 space-y-6">
      <BranchSelector
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        setSelectedBranchCode={setSelectedBranchCode}
        handleSubmit={handleSubmit}

      />

      {loading && <p className="text-center mt-4 text-gray-600">⏳ Loading data...</p>}

      {filteredShelfData.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold mt-10">📂 Shelf Overview</h2>
          {filteredShelfData.length > 0 && (
            <div className="mt-4 border p-4 rounded bg-gray-50">
              <label className="font-semibold block mb-2">🗂️ Filter by Shelf:</label>

              <div className="flex flex-wrap gap-4">
                {uniqueShelves.map((shelf) => (
                  <label key={shelf} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={shelf}
                      checked={visibleShelves.includes(shelf)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setVisibleShelves(prev =>
                          checked
                            ? [...prev, shelf]
                            : prev.filter(s => s !== shelf)
                        );
                      }}
                    />
                    <span>{shelf}</span>
                  </label>
                ))}
              </div>

              {/* ปุ่ม select all / clear */}
              <div className="mt-3 space-x-2">
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                  onClick={() => setVisibleShelves(uniqueShelves)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-gray-400 text-white rounded"
                  onClick={() => setVisibleShelves([])}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          <ShelfOverview
            filteredShelfData={filteredShelfData}
            shelfDetail={shelfDetail}
            visibleShelves={visibleShelves}
            handleAddRow={handleAddRow}
            handleDeleteProduct={handleDeleteProduct}
          />


        </>

      ) : (
        !loading && <p className="text-center text-gray-500 mt-4">No matching shelf data found.</p>
      )}


      <AddProductModal
        isOpen={isModalOpen}
        shelf={newProductShelf}
        data={newProductData}
        onClose={() => setIsModalOpen(false)}
        onChange={setNewProductData}
        onSubmit={handleAddProductSubmit}
      />


    </div>

  );

}
export default ShelfManager;

