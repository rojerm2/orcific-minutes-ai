import type { MeetingNotes } from '../models/MeetingNotes.ts';
import ExportButtons from './ExportButtons';

interface Props {
    notes: MeetingNotes;
    onDownloadPdf: () => void;
    onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const sections = [
    {
        key: 'decisions',
        title: 'Key decisions',
        detail: 'What the team agreed on',
        tone: 'border-violet-100 bg-violet-50/70 text-violet-700',
        empty: 'No key decisions recorded.',
    },
    {
        key: 'actionItems',
        title: 'Action items',
        detail: 'Follow-ups to keep moving',
        tone: 'border-amber-100 bg-amber-50/70 text-amber-700',
        empty: 'No action items recorded.',
    },
    {
        key: 'openQuestions',
        title: 'Open questions',
        detail: 'Topics that need resolution',
        tone: 'border-sky-100 bg-sky-50/70 text-sky-700',
        empty: 'No open questions recorded.',
    },
] as const;

export default function MeetingNotesCard({ notes, onDownloadPdf, onNotify }: Props) {
    return (
        <article className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                            Generated brief
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                            Meeting notes
                        </h2>
                    </div>
                    <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                        Ready to share
                    </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">Model</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {notes.metadata.model}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">Generation time</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {(notes.metadata.durationMs / 1000).toFixed(1)} seconds
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">Created</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {new Date(notes.metadata.generatedAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-6 py-7 sm:px-8">
                <section>
                    <h3 className="text-lg font-semibold text-slate-900">Executive summary</h3>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-600">
                        {notes.summary}
                    </p>
                </section>
                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {sections.map((section) => {
                        const items = notes[section.key];
                        return (
                            <section
                                key={section.key}
                                className={`rounded-2xl border p-5 ${section.tone}`}
                            >
                                <h4 className="font-semibold text-slate-900">{section.title}</h4>
                                <p className="mt-1 text-xs text-slate-500">{section.detail}</p>
                                {items?.length > 0 ? (
                                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                                        {items.map((item, index) => (
                                            <li className="flex gap-2" key={index}>
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-4 text-sm text-slate-500">{section.empty}</p>
                                )}
                            </section>
                        );
                    })}
                </div>
                <div className="mt-8 border-t border-slate-100 pt-6">
                    <p className="text-sm font-medium text-slate-700">Export or share</p>
                    <ExportButtons
                        meetingNotes={notes}
                        onDownloadPdf={onDownloadPdf}
                        onNotify={onNotify}
                    />
                </div>
            </div>
        </article>
    );
}
