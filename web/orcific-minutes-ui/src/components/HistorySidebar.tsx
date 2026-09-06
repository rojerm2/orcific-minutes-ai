import type { MeetingHistory } from '../models/MeetingHistory';

interface Props {
    meetings: MeetingHistory[];
    onOpen(id: number): void;
}

export default function HistorySidebar({ meetings, onOpen }: Props) {
    return (
        <section
            aria-label="Meeting history sidebar"
            className="surface flex max-h-[min(38rem,calc(100vh-3rem))] flex-col p-5"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <div>
                    <p className="text-lg font-semibold tracking-tight text-slate-900">
                        Recent meetings
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Your saved conversation archive.
                    </p>
                </div>
                <span className="grid h-8 min-w-8 place-items-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-600">
                    {meetings.length}
                </span>
            </div>

            <div className="mt-5 min-h-0 overflow-y-auto pr-1">
                {meetings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-relaxed text-slate-500">
                        No meetings saved yet. When you save a generated brief, it will appear here.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {meetings.map((meeting) => (
                            <li key={meeting.id}>
                                <button
                                    type="button"
                                    onClick={() => onOpen(meeting.id)}
                                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-sm"
                                >
                                    <span className="truncate">{meeting.title}</span>
                                    <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600">
                                        →
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
