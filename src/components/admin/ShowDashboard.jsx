import React, { useEffect, useState } from 'react';
import useBmrStore from '../../store/bmr_store';
import './loading.css';
import { Fullscreen } from 'lucide-react';

// Helper function to open IndexedDB // ฟังก์ชันในการเปิด IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dashboardDataDB', 1);

        request.onerror = () => reject('Error opening database');
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'id' }); // Create object store for data // สร้าง object store สำหรับข้อมูล
            }
        };
    });
};

// Helper function to get data from IndexedDB // ฟังก์ชันในการดึงข้อมูลจาก IndexedDB
const getDataFromDB = (db) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['data'], 'readonly');
        const store = transaction.objectStore('data');
        const request = store.get(1); // Assuming data is stored with id = 1  // สมมุติว่าเราบันทึกข้อมูลไว้ที่ id = 1

        request.onerror = () => reject('Error fetching data');
        request.onsuccess = () => resolve(request.result);
    });
};

// Helper function to save data to IndexedDB
const saveDataToDB = (db, data) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        const request = store.put({ id: 1, ...data }); // Store data with id = 1

        request.onerror = () => reject('Error saving data');
        request.onsuccess = () => resolve();
    });
};

const ShowDashboard = () => {
    const token = useBmrStore((s) => s.token);
    const [data, setData] = useState({ sales: [], withdraw: [], stock: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // States for month and year filter   // สถานะสำหรับกรองเดือนและปี
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('2024'); // Set default year to 2024  // โหลดจาก IndexedDB ถ้ามี

    // Use effect to fetch data (with IndexedDB check) 
    useEffect(() => {
        if (!token) return;

        // Open IndexedDB and check if data exists
        openDB()  // เปิด IndexedDB และตรวจสอบข้อมูลที่เก็บไว้
            .then((db) => {
                // Try to get data from IndexedDB  // ลองดึงข้อมูลจาก IndexedDB
                return getDataFromDB(db)
                    .then((storedData) => {
                        if (storedData) {
                            setData(storedData); // Load from IndexedDB if available // โหลดจาก IndexedDB ถ้ามี
                            return;
                        }
                        // If no data in IndexedDB, fetch from API // ถ้าไม่มีข้อมูลใน IndexedDB ให้ดึงจาก API

                        setLoading(true);
                        getData(token)
                            .then((res) => {
                                setData(res);
                                saveDataToDB(db, res); // Store data in IndexedDB // บันทึกข้อมูลลงใน IndexedDB
                                setLoading(false);
                            })
                            .catch(() => {
                                setError('Failed to load dashboard data');
                                setLoading(false);
                            });
                    })
                    .catch((err) => {
                        setError(err);
                        setLoading(false);
                    });
            })
            .catch(() => {
                setError('Failed to open IndexedDB');
                setLoading(false);
            });
    }, [token]);

    // Handle month and year filter change // ฟังก์ชันในการเปลี่ยนเดือน
    const handleMonthChange = (e) => setSelectedMonth(e.target.value);
    const handleYearChange = (e) => setSelectedYear(e.target.value);

    // ฟังก์ชันสำหรับรีเฟรชข้อมูล
    const refreshData = () => {
        setLoading(true);
        openDB()
            .then((db) => {
                getData(token)
                    .then((res) => {
                        setData(res);
                        saveDataToDB(db, res); // อัปเดตข้อมูลใน IndexedDB
                        setLoading(false);
                    })
                    .catch(() => {
                        setError('ไม่สามารถโหลดข้อมูลจากแดชบอร์ดได้');
                        setLoading(false);
                    });
            })
            .catch(() => {
                setError('ไม่สามารถเปิด IndexedDB ได้');
                setLoading(false);
            });
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className='px-4'>  Loading Data...</p>
        </div>
    );
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    // Filter sales data based on selected month and year // กรองข้อมูลการขายตามเดือนและปีที่เลือก
    let filteredSales = [];

    if (Array.isArray(data?.sales)) {
        filteredSales = data.sales.filter((sale) => {
            const saleMonth = sale.month;
            const saleYear = sale.year;

            return (
                (selectedMonth === '' || selectedMonth === 'ALL' || saleMonth === parseInt(selectedMonth)) &&
                (selectedYear ? saleYear === parseInt(selectedYear) : true)
            );
        });
    }

    // Summary calculations based on filtered sales data // การคำนวณสรุปข้อมูลตามสาขาและช่องทางการขาย
    const summaryByBranchAndChannel = filteredSales.reduce((acc, sale) => {
        const { branchCode, channelSales, totalPrice } = sale;
        if (!acc[branchCode]) acc[branchCode] = {};
        if (!acc[branchCode][channelSales]) acc[branchCode][channelSales] = 0;
        acc[branchCode][channelSales] += Number(totalPrice || 0);
        return acc;
    }, {});

    const totalSalesAllBranches = filteredSales.reduce((sum, sale) => sum + Number(sale.totalPrice || 0), 0);

    const totalSalesByChannel = filteredSales.reduce((acc, sale) => {
        const { channelSales, totalPrice } = sale;
        if (!acc[channelSales]) acc[channelSales] = 0;
        acc[channelSales] += Number(totalPrice || 0);
        return acc;
    }, {});

    const channels = [
        { name: 'หน้าร้าน', color: '#4caf50' },
        { name: 'Grab Mart', color: '#2196f3' },
        { name: 'Lineman', color: '#ff9800' },
        { name: 'BM Delivery', color: '#ff9999' },
    ];

    // Get list of months and years from the data
    const months = [
        { value: 'ALL', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    // Get unique years from the data // ดึงปีที่ไม่ซ้ำจากข้อมูล
    const uniqueYears = [...new Set((data?.sales || []).map((sale) => sale.year))];


    // Ensure '2024' is included, but only if it's not already present // ตรวจสอบว่า 2024 มีหรือไม่ ถ้าไม่มีให้เพิ่ม
    const years = uniqueYears.includes(2024) ? uniqueYears : [2024, ...uniqueYears];

    return (
        <div style={{
            padding: 20,
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            backgroundColor: '#f5f7fa',
            minHeight: '100vh'
        }}>
            {/* Refresh */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                    onClick={refreshData}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        color: '#fff',
                        backgroundColor: '#4caf50',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                    }}
                >
                    Refresh Data
                </button>
            </div>
            {/* Month and Year filter */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    style={{
                        padding: '8px 12px',
                        borderRadius: 4,
                        marginRight: 10,
                        border: '1px solid #ddd',
                    }}
                >
                    {months.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    style={{
                        padding: '8px 12px',
                        borderRadius: 4,
                        border: '1px solid #ddd',
                    }}
                >
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>



            <div style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 20,
                marginBottom: 30,
                width: '100%', // ใช้ความกว้างเต็มของคอนเทนเนอร์
                maxWidth: '720px', // จำกัดความกว้างไม่เกิน 630px
                boxSizing: 'border-box', // คำนวณ padding ในการคำนวณขนาด
                fontWeight: '700',
                marginLeft: 'auto', // จัดให้อยู่กลาง
                marginRight: 'auto',
            }}>
                <div style={{ marginBottom: 10, fontSize: 18, textAlign: 'center' }}>
                    Total Sales (All Branches, All Channels): <span style={{ color: '#2196f3' }}>
                        {String(totalSalesAllBranches?.toFixed(2) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ฿
                    </span>
                </div>

                {/* Sales by Channel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    {channels.map(({ name, color }) => (
                        <div key={name} style={{
                            backgroundColor: color + '22',
                            color: color,
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontWeight: '600',
                            flex: '1 1 120px', // ขยายได้ตามขนาดของหน้าจอ แต่มีขนาดขั้นต่ำ 120px
                            margin: '5px',
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        }}>
                            <div>{name}</div>
                            <div style={{ fontSize: 16 }}>
                                {String(totalSalesByChannel[name]?.toFixed(2) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ฿
                            </div>
                        </div>
                    ))}
                </div>
            </div>



            {/* Sales summary by Branch and Channel */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
            }}>
                {Object.entries(summaryByBranchAndChannel).map(([branchCode, channelsData]) => (
                    <div key={branchCode} style={{
                        backgroundColor: 'white',
                        borderRadius: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 180,
                    }}>
                        <h2 style={{ marginBottom: 15, color: '#333' }}>Branch: {branchCode}</h2>
                        {channels.map(({ name, color }) => (
                            <div key={name} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 8,
                                padding: '6px 10px',
                                borderRadius: 6,
                                backgroundColor: color + '22',
                                color: color,
                                fontWeight: '600',
                                fontSize: 14,
                            }}>
                                <span>{name}</span>
                                <span>
                                    {(channelsData[name] !== undefined ? channelsData[name].toFixed(2) : '0.00')
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ฿'}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShowDashboard;
