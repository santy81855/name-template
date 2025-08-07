"use client";

import { Upload, Display } from "@/features/pdf-upload";
import React, { useState } from "react";

const Wrapper = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    return (
        <section className="w-full">
            {!pdfFile && <Upload setPdfFile={setPdfFile} />}
            {pdfFile && (
                <section className="w-full mx-auto px-4">
                    <Display file={pdfFile} />
                </section>
            )}
            {pdfFile && (
                <button className="" onClick={() => setPdfFile(null)}>
                    new
                </button>
            )}
        </section>
    );
};

export default Wrapper;
