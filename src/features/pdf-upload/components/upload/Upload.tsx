"use client";

type UploadProps = {
    setPdfFile: (file: File | null) => void;
};

const Upload = ({ setPdfFile }: UploadProps) => {
    return (
        <section className="">
            <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setPdfFile(file);
                    }
                }}
                className="border border-gray-300 rounded p-2 mb-4 cursor-pointer"
            />
        </section>
    );
};

export default Upload;
