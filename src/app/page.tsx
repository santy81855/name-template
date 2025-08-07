import { Wrapper } from "@/features/pdf-upload";

export default function Home() {
    return (
        <section className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="w-full flex flex-col gap-[32px] row-start-2 items-center ">
                <Wrapper />
            </main>
        </section>
    );
}
