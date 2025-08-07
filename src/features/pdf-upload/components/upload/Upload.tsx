"use client";

type UploadProps = {
    setPdfFile: (file: File | null) => void;
};

const Upload = ({ setPdfFile }: UploadProps) => {
    return (
        <section className="w-80 flex flex-col items-center justify-center">
            <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setPdfFile(file);
                    }
                }}
                className="w-full border border-gray-300 p-2 cursor-pointer bg-gray-300 text-black hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
            />
        </section>
    );
};

export default Upload;
