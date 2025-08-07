"use client";

import * as XLSX from "xlsx";
import React, { useEffect } from "react";

const NameUpload = ({
    setStudentNames,
    inputVersion,
}: {
    inputVersion: number;
    setStudentNames: (names: string[][]) => void;
}) => {
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const sheetData: string[][] = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                blankrows: false,
            });

            // Transpose rows to columns
            const columns: string[][] = [];
            const numCols = Math.max(...sheetData.map((row) => row.length));
            for (let col = 0; col < numCols; col++) {
                const columnData = sheetData
                    .map((row) => row[col])
                    .filter(Boolean);
                if (columnData.length > 0) {
                    columns.push(columnData.map(String)); // ensure all strings
                }
            }

            setStudentNames(columns);
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="w-80 flex flex-col items-center justify-center">
            <input
                key={inputVersion} // force re-render when inputVersion changes
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUpload}
                className="w-full border border-gray-300 p-2 cursor-pointer bg-gray-300 text-black hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
            />
        </div>
    );
};

export default NameUpload;
