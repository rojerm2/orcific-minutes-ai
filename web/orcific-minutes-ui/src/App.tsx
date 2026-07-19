import Header from './components/Header';
import UploadForm from './components/UploadForm';
import MeetingNotesCard from './components/MeetingNotesCard';
import LoadingSpinner from './components/LoadingSpinner';
import EmptyState from './components/EmptyState';
import HistorySidebar from './components/HistorySidebar';
import RagAssistantPanel from './components/RagAssistantPanel';
import NotificationToast from './components/NotificationToast';

import type { MeetingNotes } from './models/MeetingNotes';
import type { MeetingHistory } from './models/MeetingHistory';
import { useEffect, useState } from 'react';
import { apiUrl, getMeeting, getMeetingHistory } from './services/meetingApi';
import type { Notification, NotificationType } from './types/notifications';

function App() {
    const [notes, setNotes] = useState<MeetingNotes | null>(null);
    const [loading, setLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [history, setHistory] = useState<MeetingHistory[]>([]);
    const [id, setId] = useState<number>();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        void loadHistory();
    }, []);

    const loadHistory = async () => {
        const meetingHistory = await getMeetingHistory();
        meetingHistory.reverse();
        setHistory(meetingHistory);
    };

    const openMeeting = async (meetingId: number) => {
        const notes = await getMeeting(meetingId);
        setId(meetingId);
        setNotes(notes);
    };

    const showNotification = (type: NotificationType, title: string, message?: string) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setNotifications((current) => [...current, { id, type, title, message }]);

        window.setTimeout(() => {
            setNotifications((current) => current.filter((notification) => notification.id !== id));
        }, 4500);
    };

    const dismissNotification = (id: string) => {
        setNotifications((current) => current.filter((notification) => notification.id !== id));
    };

    const downloadPdf = async () => {
        if (id == null) {
            showNotification(
                'info',
                'Before downloading',
                'Please save the meeting summary before downloading the PDF.',
            );
            return;
        }

        const response = await fetch(apiUrl(`/meeting/${id}/pdf`));

        if (!response.ok) {
            showNotification(
                'error',
                'Download failed',
                'Failed to download the PDF. Please try again.',
            );
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meeting-notes.pdf';
        a.click();
        URL.revokeObjectURL(url);
        showNotification('success', 'PDF downloaded', 'Your meeting notes PDF is ready.');
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.16),transparent_27%),radial-gradient(circle_at_100%_12%,rgba(20,184,166,0.11),transparent_23%),linear-gradient(145deg,#f8faff_0%,#f4f6fb_52%,#eef3fa_100%)]">
            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
            <div className="mx-auto flex max-w-350 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                <Header />

                <div className="mt-6 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_360px] 2xl:grid-cols-[280px_minmax(0,1fr)_380px]">
                    <aside className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start">
                        <HistorySidebar meetings={history} onOpen={openMeeting} />
                    </aside>

                    <main className="min-w-0 space-y-6">
                        {notes !== null && transcript == null && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                                Meeting notes generated successfully.
                            </div>
                        )}

                        <UploadForm
                            loading={loading}
                            transcript={transcript}
                            onLoadingChange={setLoading}
                            onSuccess={setNotes}
                            setTranscript={setTranscript}
                            onNotify={showNotification}
                            onMeetingSaved={(meetingId) => {
                                setId(meetingId);
                                void loadHistory();
                            }}
                        />

                        {!loading && notes && (
                            <MeetingNotesCard
                                notes={notes}
                                onDownloadPdf={downloadPdf}
                                onNotify={showNotification}
                            />
                        )}

                        {!loading && !notes && <EmptyState />}

                        {loading && <LoadingSpinner />}
                    </main>

                    <aside className="xl:sticky xl:top-6 xl:self-start">
                        <RagAssistantPanel
                            isEnabled={id != null || history.length > 0}
                            onNotify={showNotification}
                            meetingId={id}
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default App;
