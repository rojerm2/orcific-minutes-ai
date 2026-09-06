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
    const hasPastedTranscript = !selectedFile && transcript.trim().length > 0;

    const selectFile = (file: File | null) => {
        if (!file) {
            setSelectedFile(null);
            setNotes(null);
            setError('');
            setTranscript('');
            return;
        }

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
        if (!selectedFile && !transcript.trim()) {
            onNotify(
                'info',
                'No script provided',
                'Choose a transcript file or paste a script before generating notes.',
            );
            return;
        }
        try {
            setError('');
            onLoadingChange(true);
            const inputFile =
                selectedFile ??
                new File([transcript], 'pasted-transcript.txt', {
                    type: 'text/plain',
                });
            const generatedNotes: MeetingNotes = await uploadTranscript(inputFile, model);
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
        <section className="surface p-5 sm:p-7">
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

            <div className="mt-6 space-y-5">
                {error && (
                    <div className="px-4 py-3 text-sm font-medium border rounded-2xl border-rose-200 bg-rose-50 text-rose-700">
                        {error}
                    </div>
                )}
                {!hasPastedTranscript ? (
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={(event) => event.preventDefault()}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`rounded-2xl border-2 border-dashed p-5 text-center transition duration-200 sm:p-8 ${
                            isDragging
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40'
                        }`}
                    >
                        <span className="block text-sm font-semibold text-slate-800">
                            {selectedFile ? 'Transcript file selected' : 'Upload a transcript file'}
                        </span>
                        <p className="mt-2 text-sm text-slate-500">
                            {selectedFile
                                ? 'This file will be used to generate your meeting notes.'
                                : 'Drag and drop a .txt or audio file here, or choose one from your device.'}
                        </p>

                        {!selectedFile && (
                            <>
                                <label
                                    htmlFor="transcript-file"
                                    className="mt-4 inline-flex cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
                                >
                                    Choose a file
                                </label>
                                <input
                                    id="transcript-file"
                                    type="file"
                                    accept=".txt,audio/*"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                            </>
                        )}

                        {selectedFile && (
                            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
                            <span className="grid h-6 w-7 place-items-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                {selectedFile.type.startsWith('audio/') ? 'AUD' : 'TXT'}
                            </span>
                            <span className="max-w-[min(100%,18rem)] truncate">{selectedFile.name}</span>

                            <button
                                type="button"
                                className="hover:cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition hover:bg-rose-200 hover:text-rose-700"
                                onClick={() => selectFile(null)}
                                aria-label="Remove selected file"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </div>
                        )}
                    </div>
                ) : null}

                {!selectedFile && (
                    <div className="relative">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Paste a script</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    File upload is hidden while pasted text is active.
                                </p>
                            </div>
                            {hasPastedTranscript && (
                                <button
                                    type="button"
                                    onClick={() => setTranscript('')}
                                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                >
                                    Switch to file
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <textarea
                                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                                    const t = e.currentTarget;
                                    t.style.height = '';
                                    t.style.height = t.scrollHeight + 'px';
                                }}
                                onChange={(e) => {
                                    setTranscript(e.target.value);
                                    e.currentTarget.style.height = '';
                                }}
                                value={transcript}
                                placeholder="Paste the meeting script here"
                                className="control min-h-32 w-full resize-y overflow-y-auto bg-slate-50 px-4 py-4 pr-12 text-sm leading-6 text-slate-800 placeholder:text-slate-400 max-h-150"
                            />

                            <button
                                type="button"
                                onClick={() => setTranscript('')}
                                className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-all duration-200 hover:bg-slate-200 hover:text-gray-600"
                                aria-label="Clear pasted script"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {!notes && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Generation model</p>
                            <p className="mt-0.5 text-sm text-slate-500 border">
                                Choose the local model for this summary.
                            </p>
                        </div>
                        <select
                            className="control px-3 py-2.5 text-sm text-slate-700"
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
                    disabled={loading || (!selectedFile && !transcript.trim())}
                    className={`primary-button w-full px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-400 disabled:shadow-none ${loading ? 'animate-pulse' : ''}`}
                >
                    {loading ? 'Generating notes…' : 'Generate notes'}
                </button>
                {notes && (
                    <button
                        onClick={handleSaveMeeting}
                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100"
                    >
                        Save meeting to history
                    </button>
                )}
            </div>
        </section>
    );
}
