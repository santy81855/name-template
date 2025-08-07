"use client";

import React, { useState } from "react";
import { Upload, Display } from "@/features/pdf-upload";
import { NameUpload } from "@/features/name-list-upload";

const Wrapper = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [studentNames, setStudentNames] = useState<string[][]>([]);
    const [inputVersion, setInputVersion] = useState(0);

    return (
        <section className="w-full flex flex-col justify-start items-center max-w-6xl">
            <h1 className="text-2xl font-bold mb-4">Mada's Helper</h1>
            {(pdfFile || studentNames.length > 0) && (
                <button
                    className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    onClick={() => {
                        setStudentNames([]);
                        setPdfFile(null);
                        setInputVersion((v) => v + 1); // force re-render of NameUpload
                    }}
                >
                    RESTART
                </button>
            )}
            <section className="w-full flex flex-col justify-center items-start pt-8 pb-8 pl-4 pr-4 gap-4">
                <section className="flex flex-row gap-8 justify-start items-center w-full max-w-3xl">
                    {studentNames.length > 0 ? (
                        <span className="text-green-500 text-4xl">✓</span>
                    ) : (
                        <span className="text-red-500 text-4xl">✗</span>
                    )}
                    <h2 className="font-bold">1. Upload Student Names</h2>
                </section>
                <NameUpload
                    setStudentNames={setStudentNames}
                    inputVersion={inputVersion}
                />
            </section>
            {studentNames.length > 0 && (
                <section className="w-full flex flex-col justify-center items-start pt-8 pb-8 pl-4 pr-4 gap-4">
                    <section className="flex flex-row gap-8 justify-start items-center w-full max-w-3xl">
                        {pdfFile ? (
                            <span className="text-green-500 text-4xl">✓</span>
                        ) : (
                            <span className="text-red-500 text-4xl">✗</span>
                        )}
                        <h2 className="font-bold">2. Upload PDF Worksheet</h2>
                    </section>
                    {!pdfFile && <Upload setPdfFile={setPdfFile} />}
                </section>
            )}
            {pdfFile && (
                <section className="w-full flex flex-col justify-center items-start pt-8 pb-8 pl-4 pr-4 gap-4">
                    <section className="flex flex-row gap-8 justify-start items-center w-full max-w-3xl">
                        {pdfFile ? (
                            <span className="text-green-500 text-4xl">✓</span>
                        ) : (
                            <span className="text-red-500 text-4xl">✗</span>
                        )}
                        <h2 className="font-bold">3. Place Name</h2>
                    </section>

                    <section className="w-full mx-auto px-4">
                        <Display file={pdfFile} list={studentNames} />
                    </section>
                </section>
            )}
        </section>
    );
};

export default Wrapper;
