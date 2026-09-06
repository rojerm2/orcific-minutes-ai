import type { MeetingNotes } from '../models/MeetingNotes';
import type { NotificationType } from '../types/notifications';
import { formatMeetingNotes } from '../utils/meetingFormatter';

interface ExportButtonsProps {
    meetingNotes: MeetingNotes;
    onDownloadPdf: () => void;
    onNotify: (type: NotificationType, title: string, message?: string) => void;
}

export default function ExportButtons({
    meetingNotes,
    onDownloadPdf,
    onNotify,
}: ExportButtonsProps) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formatMeetingNotes(meetingNotes));
            onNotify('success', 'Copied to clipboard', 'Meeting notes copied successfully.');
        } catch (error) {
            console.log(error);
            onNotify('error', 'Copy failed', 'Unable to copy notes. Please try again.');
        }
    };

    const handleMarkdown = () => {
        const markdownContent = formatMeetingNotes(meetingNotes);
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'meeting-notes.md';
        link.click();
        URL.revokeObjectURL(url);

        onNotify('success', 'Markdown downloaded', 'Your notes markdown file is ready.');
    };

    return (
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
                onClick={handleCopy}
            >
                Copy Notes
            </button>
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                onClick={handleMarkdown}
            >
                Download Markdown
            </button>

            <button
                type="button"
                onClick={onDownloadPdf}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            >
                Download as PDF
            </button>
        </div>
    );
}
