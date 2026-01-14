interface ProsConsSectionProps {
    pros: string[];
    cons: string[];
}

export default function ProsConsSection({ pros, cons }: ProsConsSectionProps) {
    if (pros.length === 0 && cons.length === 0) return null;

    return (
        <section id="pros-cons" className="py-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4">Pros & Cons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {pros.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-green-600">Pros</h3>
                        {pros.map((pro, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 400 448" fill="#4ade80">
                                    <path d="M64 336c0-8.75-7.25-16-16-16-9 0-16 7.25-16 16 0 9 7 16 16 16 8.75 0 16-7 16-16zM104 208v160c0 8.75-7.25 16-16 16h-72c-8.75 0-16-7.25-16-16v-160c0-8.75 7.25-16 16-16h72c8.75 0 16 7.25 16 16zM400 208c0 13.25-5.25 27.5-13.75 37.25 2.75 8 3.75 15.5 3.75 19 0.5 12.5-3.25 24.25-10.75 34.25 2.75 9.25 2.75 19.25 0 29.25-2.5 9.25-7.25 17.5-13.5 23.5 1.5 18.75-2.75 34-12.25 45.25-10.75 12.75-27.25 19.25-49.25 19.5h-32.25c-35.75 0-69.5-11.75-96.5-21-15.75-5.5-30.75-10.75-39.5-11-8.5-0.25-16-7.25-16-16v-160.25c0-8.25 7-15.25 15.25-16 9.25-0.75 33.25-30.5 44.25-45 9-11.5 17.5-22.25 25.25-30 9.75-9.75 12.5-24.75 15.5-39.25 2.75-14.75 5.75-30.25 16.5-40.75 3-3 7-4.75 11.25-4.75 56 0 56 44.75 56 64 0 20.5-7.25 35-14 48-2.75 5.5-5.25 8-7.25 16h69.25c26 0 48 22 48 48z" />
                                </svg>
                                <span className="text-text-secondary text-sm">{pro}</span>
                            </div>
                        ))}
                    </div>
                )}
                {cons.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-rose-600">Cons</h3>
                        {cons.map((con, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 400 448" fill="#ef4444">
                                    <path d="M64 144c0 8.75-7.25 16-16 16-9 0-16-7.25-16-16 0-9 7-16 16-16 8.75 0 16 7 16 16zM104 272v-160c0-8.75-7.25-16-16-16h-72c-8.75 0-16 7.25-16 16v160c0 8.75 7.25 16 16 16h72c8.75 0 16-7.25 16-16zM386.25 234.75c8.5 9.5 13.75 24 13.75 37.25-0.25 26-22 48-48 48h-69.25c2 8 4.5 10.5 7.25 16 6.5 13 14 27.5 14 48 0 19.25 0 64-56 64-4.25 0-8.25-1.75-11.25-4.75-10.75-10.5-13.75-26-16.5-40.75-3-14.5-5.75-29.5-15.5-39.25-7.75-7.75-16.25-18.5-25.25-30-11-14.5-35-44.25-44.25-45-8.25-0.75-15.25-7.75-15.25-16v-160.25c0-8.75 7.5-15.75 16-16 8.75-0.25 23.75-5.5 39.5-11 27-9.25 60.75-21 96.5-21h32.25c22 0.25 38.5 6.75 49.25 19.5 9.5 11.25 13.75 26.5 12.25 45.25 6.25 6 11 14.25 13.5 23.5 2.75 10 2.75 20 0 29.25 7.5 10 11.25 21.75 10.75 34.25 0 3.5-1 11-3.75 19z" />
                                </svg>
                                <span className="text-text-secondary text-sm">{con}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
