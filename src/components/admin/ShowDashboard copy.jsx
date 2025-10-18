import React, { useEffect, useState } from 'react';
import useBmrStore from '../../store/bmr_store';
import { getData } from '../../api/admin/dashboard';
import { CircularProgress } from '@mui/material';  // Importing Material UI Circular Progress (spinner)

const ShowDashboard = () => {
    const token = useBmrStore((s) => s.token);
    const [data, setData] = useState({ sales: [], withdraw: [], stock: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // States for month and year filter
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('2024'); // Set default year to 2024

    // Use effect to fetch data
    useEffect(() => {
        if (!token) return;

        setLoading(true);
        getData(token)
            .then((res) => {
                setData(res);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load dashboard data');
                setLoading(false);
            });
    }, [token]);

    // Handle month and year filter change
    const handleMonthChange = (e) => setSelectedMonth(e.target.value);
    const handleYearChange = (e) => setSelectedYear(e.target.value);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />  {/* Loading spinner */}
            </div>
        );
    }
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    // Filter sales data based on selected month and year
    const filteredSales = data.sales.filter((sale) => {
        const saleMonth = sale.month;
        const saleYear = sale.year;

        return (
            (selectedMonth === '' || selectedMonth === 'ALL' || saleMonth === parseInt(selectedMonth)) &&
            (selectedYear ? saleYear === parseInt(selectedYear) : true)
        );
    });

    // Summary calculations based on filtered sales data
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

    const years = ['2024', ...new Set(data.sales.map((sale) => sale.year))];

    return (
        <div style={{
            padding: 20,
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            backgroundColor: '#f5f7fa',
            minHeight: '100vh'
        }}>
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
                    {years.map((year, index) => (
                        <option key={`${year}-${index}`} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            {/* Total sales summary */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 20,
                marginBottom: 30,
                maxWidth: 600,
                marginLeft: 'auto',
                marginRight: 'auto',
                fontWeight: '700',
                color: '#333',
            }}>
                <div style={{ marginBottom: 10, fontSize: 18, textAlign: 'center' }}>
                    Total Sales (All Branches, All Channels): <span style={{ color: '#2196f3' }}> {String(totalSalesByChannel[name]?.toFixed(2) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ฿</span>
                </div>

                {/* Sales by Channel */}
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                    {channels.map(({ name, color }) => (
                        <div key={name} style={{
                            backgroundColor: color + '22',
                            color: color,
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontWeight: '600',
                            minWidth: 120,
                            margin: '5px',
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        }}>
                            <div>{name}</div>
                            <div style={{ fontSize: 16 }}>{(totalSalesByChannel[name]?.toFixed(2) || 0).toLocaleString()} ฿</div>
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
