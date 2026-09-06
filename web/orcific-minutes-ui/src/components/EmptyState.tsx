export default function EmptyState() {
    return (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center sm:px-12">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-xl text-indigo-700">✦</div>
            <p className="mt-5 text-lg font-semibold text-slate-800">Your notes will appear here</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">Start by selecting a transcript above. Your summary, decisions, and action items will be neatly organized in one place.</p>
        </div>
    );
}
