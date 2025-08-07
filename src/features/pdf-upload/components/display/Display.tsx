"use client";

import { useEffect, useRef, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Comfortaa } from "next/font/google";
const comfortaa = Comfortaa({
    weight: "600",
    subsets: ["latin"],
});

type DisplayProps = {
    file: File | null;
    list: string[][];
};

const rotations = [0, 90, 180, 270];

const Display = ({ file, list }: DisplayProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [rotationIndex, setRotationIndex] = useState(0); // index in rotations array
    const [defaultRotation, setDefaultRotation] = useState(0);
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
            if (pageRotation == 0) {
                setDefaultRotation(0);
            }
            if (pageRotation == 90) {
                setDefaultRotation(1);
            }
            if (pageRotation == 180) {
                setDefaultRotation(2);
            }
            if (pageRotation == 270) {
                setDefaultRotation(3);
            }
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
        namePosition: { x: number; y: number }
    ) {
        // Read the original PDF as ArrayBuffer
        const arrayBuffer = await originalFile.arrayBuffer();

        // Load the original PDF
        const originalPdfDoc = await PDFDocument.load(arrayBuffer);

        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();
        newPdfDoc.registerFontkit(fontkit);
        const fontBytes = await fetch("@/../fonts/Comfortaa-Bold.ttf").then(
            (res) => res.arrayBuffer()
        );
        const customFont = await newPdfDoc.embedFont(fontBytes);

        // Embed a font for the names
        const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);

        for (const group of list) {
            const [teacher, ...students] = group;

            // --- Add teacher title page ---
            // Copy a fresh original page for the teacher title page

            const teacherPage = newPdfDoc.addPage();
            console.log(rotation);
            teacherPage.setRotation(
                degrees(rotation + rotations[defaultRotation])
            );

            const teacherFontSize = 24;
            const teacherTextWidth = font.widthOfTextAtSize(
                teacher,
                teacherFontSize
            );
            const teacherTextHeight = font.heightAtSize(teacherFontSize);
            const centerX = (teacherPage.getWidth() - teacherTextWidth) / 2;
            const centerY = (teacherPage.getHeight() - teacherTextHeight) / 2;

            teacherPage.drawText(teacher, {
                x: centerX,
                y: centerY,
                size: teacherFontSize,
                font,
                color: rgb(0, 0, 0),
                rotate: degrees(rotation + rotations[defaultRotation]),
            });

            // --- Add pages for each student ---
            for (const student of students) {
                const [originalPageCopy] = await newPdfDoc.copyPages(
                    originalPdfDoc,
                    [0]
                );
                const page = newPdfDoc.addPage(originalPageCopy);
                page.setRotation(
                    degrees(rotation + rotations[defaultRotation])
                );

                const text = document.getElementById("text-overlay");
                if (!text) continue;
                const width = text.getBoundingClientRect().width;
                const height = text.getBoundingClientRect().height;
                const pdfWidth = page.getWidth();
                const pdfHeight = page.getHeight();

                let textX = namePosition.x;
                let textY = namePosition.y;
                console.log(rotation + rotations[defaultRotation]);
                const totalRotation =
                    (rotation + rotations[defaultRotation]) % 360;

                switch (totalRotation) {
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
                    default:
                        console.warn("Unhandled rotation:", totalRotation);
                        break;
                }

                page.drawText(student, {
                    x: textX,
                    y: textY,
                    size: 20,
                    font: customFont,
                    color: rgb(0, 0, 0),
                    rotate: degrees(rotation + rotations[defaultRotation]),
                });
            }
        }

        // Serialize the PDF document to bytes
        const pdfBytes = await newPdfDoc.save();

        // Return a Blob to download
        return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    }

    const onDownloadClick = async () => {
        if (!file) return;

        const pdfBlob = await generateNamedPdf(file, textPos);

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
            <div className="w-full mb-4 flex justify-center gap-4">
                <button
                    onClick={rotateClockwise}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                    type="button"
                >
                    Rotate
                </button>
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
                        fontSize: 20,
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                    className={comfortaa.className}
                >
                    {"<<name>>"}
                </div>
            </div>
            {list.length > 0 && file && (
                <section className="w-full flex flex-col justify-center items-start pt-8 pb-8 pl-4 pr-4 gap-4">
                    <section className="flex flex-row gap-8 justify-start items-center w-full max-w-3xl">
                        <h2 className="font-bold">4. Download PDF</h2>
                    </section>

                    <button
                        onClick={onDownloadClick}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        type="button"
                    >
                        Download PDF with Names
                    </button>
                </section>
            )}
        </div>
    );
};

export default Display;
