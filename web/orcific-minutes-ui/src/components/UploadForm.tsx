import type { MeetingNotes } from '../models/MeetingNotes';
import type { NotificationType } from '../types/notifications';
import { saveMeeting, uploadTranscript } from '../services/meetingApi';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';

interface UploadFormProps {
    loading: boolean;
    transcript: string;
    onLoadingChange: (loading: boolean) => void;
    onSuccess: (notes: MeetingNotes) => void;
    setTranscript: (transcript: string) => void;
    onNotify: (type: NotificationType, title: string, message?: string) => void;
    onMeetingSaved?: (meetingId: number) => void;
}

export default function UploadForm({
    loading,
    transcript,
    onLoadingChange,
    onSuccess,
    setTranscript,
    onNotify,
    onMeetingSaved,
}: UploadFormProps): import('react').JSX.Element {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [model, setModel] = useState('qwen2.5:3b');
    const [notes, setNotes] = useState<MeetingNotes | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragDepth = useRef(0);

    const selectFile = (file: File | null) => {
        if (!file) return;

        const isTextFile = file.name.toLocaleLowerCase().endsWith('.txt');
        const isAudioFile = file.type.startsWith('audio/');
        if (!isTextFile && !isAudioFile) {
            setError(
                'Please upload a pain-text (.txt) or audio transcript. Other file type is not supported yet.',
            );
            return;
        }

        setSelectedFile(file);
        setNotes(null);
        setError('');

        if (isTextFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setTranscript(content);
            };

            reader.readAsText(file);
        } else if (isAudioFile) {
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        selectFile(file);
        // setSelectedFile(file);
        // setNotes(null);
        // setError('');

        // if (!file) return;
        // const reader = new FileReader();
        // reader.onload = (e) => {
        //     const content = e.target?.result as string;
        //     onFileSelected(content);
        //     setTranscript(content);
        // };
        // reader.readAsText(file);
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        dragDepth.current -= 1;

        if (dragDepth.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        selectFile(event.dataTransfer.files[0] ?? null);
    };

    const handleGenerate = async () => {
        if (!selectedFile) {
            onNotify(
                'info',
                'No transcript selected',
                'Please choose a transcript file before generating notes.',
            );
            return;
        }
        try {
            setError('');
            onLoadingChange(true);
            const generatedNotes: MeetingNotes = await uploadTranscript(selectedFile, model);
            setNotes(generatedNotes);
            onSuccess(generatedNotes);
            setTranscript(generatedNotes.transcript);
            onNotify('success', 'Notes generated', 'Your meeting notes are ready to review.');
        } catch {
            setError('Unable to generate meeting notes. Please try again.');
            onNotify(
                'error',
                'Generation failed',
                'Unable to generate meeting notes. Please try again.',
            );
        } finally {
            onLoadingChange(false);
        }
    };

    const handleSaveMeeting = async () => {
        const title = prompt('Give this meeting a title:');
        if (!title || !notes) return;
        try {
            const id = await saveMeeting(title, transcript, notes);
            onMeetingSaved?.(id);
            onNotify('success', 'Meeting saved', 'This meeting is now available in your history.');
        } catch {
            onNotify('error', 'Save failed', 'Unable to save meeting. Please try again.');
        }
    };

    return (
        <section className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                        Create meeting notes
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Upload a transcript and let your local model extract the important outcomes.
                    </p>
                </div>
                <div className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Upload
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                )}

                <div
                    onDragEnter={handleDragEnter}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed p-5 text-center transition sm:p-7 ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                >
                    <span className="block text-sm font-semibold text-slate-800">
                        Transcript file
                    </span>
                    <p className="mt-2 text-sm text-slate-500">
                        Drag and drop a <code>.txt</code> or <code>audio</code> file here, or choose
                        one from your device.
                    </p>

                    <label
                        htmlFor="transcript-file"
                        className="mt-4 inline-flex cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Choose text file
                    </label>

                    <input
                        id="transcript-file"
                        type="file"
                        accept=".txt,audio/*"
                        onChange={handleFileChange}
                        className="sr-only"
                    />

                    {selectedFile && (
                        <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
                            <span className="grid h-6 w-7 place-items-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                TXT
                            </span>
                            {selectedFile.name}
                        </div>
                    )}
                </div>

                {!notes && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Generation model</p>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Choose the local model for this summary.
                            </p>
                        </div>
                        <select
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        >
                            <option value="qwen2.5:3b">Qwen 2.5 3B</option>
                            <option value="gemma3:4b">Gemma 3 4B</option>
                            <option value="phi3:mini">Phi-3 Mini</option>
                        </select>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedFile}
                    className={`w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none ${loading ? 'animate-pulse' : ''}`}
                >
                    {loading ? 'Generating notes…' : 'Generate notes'}
                </button>
                {notes && (
                    <button
                        onClick={handleSaveMeeting}
                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                        Save meeting to history
                    </button>
                )}
            </div>
        </section>
    );
}
