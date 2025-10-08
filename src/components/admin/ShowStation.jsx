import React, { useState, useEffect } from 'react';
import { fetchStationsData } from '../../api/admin/upload';

const ShowPartner = () => {
    const [stations, setStations] = useState([]);

    const fetchStations = async () => {
        try {
            const data = await fetchStationsData();
            setStations(data);
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    };

    useEffect(() => {
        fetchStations();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mt-8 mb-4">📋 Station Data</h2>
            {stations.length === 0 ? (
                <p className="text-gray-600 text-sm">No station data available.</p>
            ) : (
                <table className="min-w-full border border-gray-300 text-xs ">
                    <thead className="bg-gray-200 text-left">
                        <tr>
                            <th className="border border-gray-300 px-2 py-1">ID</th>
                            <th className="border border-gray-300 px-2 py-1">codeSAP</th>
                            <th className="border border-gray-300 px-2 py-1">codeADA</th>
                            <th className="border border-gray-300 px-2 py-1">codeBMX</th>
                            <th className="border border-gray-300 px-2 py-1 w-[200px] truncate">nameTH</th>
                            <th className="border border-gray-300 px-2 py-1">adaStore</th>
                            <th className="border border-gray-300 px-2 py-1 w-[200px] truncate">nameEng</th>
                            <th className="border border-gray-300 px-2 py-1">WhCodeSAP</th>
                            <th className="border border-gray-300 px-2 py-1">storeNameTH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stations.map((station, i) => (
                            <tr key={station.id} className="even:bg-white odd:bg-gray-50 hover:bg-blue-50">
                                <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.codeSAP}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.codeADA}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.codeBMX}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.nameTH}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.adaStore}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.nameEng}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.WhCodeSAP}</td>
                                <td className="border border-gray-300 px-2 py-1">{station.storeNameTH}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            )}
        </div>
    );
};

export default ShowPartner;
