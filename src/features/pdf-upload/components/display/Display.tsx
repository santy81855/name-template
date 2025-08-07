"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

type DisplayProps = {
    file: File | null;
};

const rotations = [0, 90, 180, 270];

const Display = ({ file }: DisplayProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [rotationIndex, setRotationIndex] = useState(0); // index in rotations array
    const rotation = rotations[rotationIndex];

    // Position state of the text overlay (in px)
    const [textPos, setTextPos] = useState({ x: 50, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // To store the PDF viewport size for overlay sizing
    const [viewportSize, setViewportSize] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });

    const names = ["Alice", "Bob", "Charlie", "Diana"];

    useEffect(() => {
        if (!file) return;

        const url = URL.createObjectURL(file);

        const loadPdf = async () => {
            const PDFJS = await import("pdfjs-dist/build/pdf");
            await import("pdfjs-dist/build/pdf.worker.min");

            PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

            const loadingTask = PDFJS.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const pageRotation = page.rotate ?? 0;
            console.log(page);
            const viewport = page.getViewport({
                scale: 1,
                rotation: (pageRotation + rotation) % 360,
            });
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d");
            if (!context) return;

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            console.log(canvas.clientWidth);

            setViewportSize({ width: viewport.width, height: viewport.height });

            await page.render({
                canvasContext: context,
                viewport,
            }).promise;
        };

        loadPdf();

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file, rotation]);

    // Reset text position when rotation changes (optional)
    useEffect(() => {
        setTextPos({ x: 50, y: 100 });
    }, [rotation]);

    // Drag handlers for the text overlay
    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        e.preventDefault();
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        let newX = e.clientX - containerRect.left - dragOffset.current.x;
        let newY = e.clientY - containerRect.top - dragOffset.current.y;

        newX = Math.max(0, Math.min(newX, viewportSize.width - 50));
        newY = Math.max(0, Math.min(newY, viewportSize.height - 20));

        setTextPos({ x: newX, y: newY });
        e.preventDefault();
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const rotateClockwise = () => {
        setRotationIndex((prev) => (prev + 1) % rotations.length);
    };

    async function generateNamedPdf(
        originalFile: File,
        names: string[],
        namePosition: { x: number; y: number }
    ) {
        // Read the original PDF as ArrayBuffer
        const arrayBuffer = await originalFile.arrayBuffer();

        // Load the original PDF
        const originalPdfDoc = await PDFDocument.load(arrayBuffer);

        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();

        // Embed a font for the names
        const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);

        for (const name of names) {
            // Get the first page of original PDF (assuming single page for example)
            const [originalPage] = await newPdfDoc.copyPages(originalPdfDoc, [
                0,
            ]);
            // Add a fresh copy of the original page for each name
            const page = newPdfDoc.addPage(originalPage);
            page.setRotation(degrees(rotation));

            // PDF coordinate system origin is bottom-left, so convert y
            const text = document.getElementById("text-overlay");
            console.log(text?.getBoundingClientRect());
            if (!text) continue;
            const width = text.getBoundingClientRect().width;
            const height = text.getBoundingClientRect().height;
            let textX = namePosition.x;
            let textY = namePosition.y;
            const pdfWidth = viewportSize.width - width / 2;
            const pdfHeight = viewportSize.height - height;

            switch (rotation) {
                case 0:
                    textY = pdfHeight - namePosition.y;
                    break;
                case 90:
                    [textX, textY] = [namePosition.y, namePosition.x];
                    break;
                case 180:
                    textX = pdfWidth - namePosition.x;
                    textY = namePosition.y;
                    break;
                case 270:
                    [textX, textY] = [
                        pdfWidth - namePosition.y,
                        pdfHeight - namePosition.x,
                    ];
                    break;
            }

            page.drawText(name, {
                x: textX,
                y: textY,
                size: 14,
                font,
                color: rgb(1, 0, 0),
                rotate: degrees(rotation),
            });
        }

        // Serialize the PDF document to bytes
        const pdfBytes = await newPdfDoc.save();

        // Return a Blob to download
        return new Blob([pdfBytes as any], { type: "application/pdf" });
    }

    const onDownloadClick = async () => {
        if (!file) return;

        const pdfBlob = await generateNamedPdf(file, names, textPos);

        // Create a download link and click it
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "personalized-names.pdf";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full flex flex-col justify-center items-center">
            <div className="mb-4 flex justify-center gap-4">
                <button
                    onClick={rotateClockwise}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    type="button"
                >
                    Rotate 90°
                </button>
                <div>Current rotation: {rotation}°</div>
            </div>

            <div
                ref={containerRef}
                className="w-full"
                style={{
                    width: viewportSize.width,
                    height: viewportSize.height,
                    position: "relative",
                }}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    className="mx-auto border w-full h-auto block"
                    style={{ display: "block" }}
                />
                {/* Draggable text overlay */}
                <div
                    id="text-overlay"
                    onMouseDown={onMouseDown}
                    style={{
                        position: "absolute",
                        top: textPos.y,
                        left: textPos.x,
                        cursor: "grab",
                        userSelect: "none",
                        fontWeight: "bold",
                        color: "red",
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        borderRadius: 4,
                        width: 50,
                        height: 20,
                        display: "flex",
                        fontSize: 14,
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                >
                    {"<<name>>"}
                </div>
            </div>
            <button
                onClick={onDownloadClick}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                type="button"
            >
                Download PDF with Names
            </button>
        </div>
    );
};

export default Display;
