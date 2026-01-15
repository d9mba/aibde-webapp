import Link from 'next/link';

export default function SubmitCTA() {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 px-6 py-8 bg-bg-card border border-border rounded-xl text-center sm:text-left">
                <div>
                    <h3 className="text-base font-semibold text-text-primary m-0 mb-1">Have an AI Tool?</h3>
                    <p className="text-[0.8125rem] text-text-secondary m-0">Get your AI tool discovered by millions of users</p>
                </div>
                <Link href="/submit" className="px-5 py-2.5 text-[0.8125rem] font-medium text-white bg-accent-primary rounded-md transition-opacity duration-fast hover:opacity-90">
                    Submit Your AI Tool
                </Link>
            </div>
        </section>
    );
}
