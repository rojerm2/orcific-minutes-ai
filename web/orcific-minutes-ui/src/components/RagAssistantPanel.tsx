import { useState, type FormEvent } from 'react';
import type { RagSource } from '../models/RagSource';
import type { RagResponse } from '../models/RagResponse';
import { askMeetingRag } from '../services/meetingApi';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: RagSource[];
}

interface Props {
    isEnabled: boolean;
    onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
    compact?: boolean;
    meetingId: number | undefined;
}

const modelOptions = [
    { value: 'qwen2.5:3b', label: 'Qwen 2.5 3B' },
    { value: 'gemma3:4b', label: 'Gemma 3 4B' },
    { value: 'phi3:mini', label: 'Phi-3 Mini' },
];

export default function RagAssistantPanel({
    isEnabled,
    onNotify,
    compact = false,
    meetingId,
}: Props) {
    const [question, setQuestion] = useState('');
    const [model, setModel] = useState('qwen2.5:3b');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content:
                'Ask me anything about your saved meetings. I can search the meeting history and summarize the most relevant details.',
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const trimmedQuestion = question.trim();
        if (!trimmedQuestion) {
            return;
        }

        const userMessage: Message = {
            id: `${Date.now()}-user`,
            role: 'user',
            content: trimmedQuestion,
        };

        setMessages((current) => [...current, userMessage]);
        setQuestion('');
        setIsLoading(true);

        try {
            const response: RagResponse = await askMeetingRag(meetingId, trimmedQuestion, model);
            const assistantMessage: Message = {
                id: `${Date.now()}-assistant`,
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
            };

            setMessages((current) => [...current, assistantMessage]);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unable to reach the RAG backend.';
            onNotify('error', 'RAG request failed', message);
            setMessages((current) => [
                ...current,
                {
                    id: `${Date.now()}-assistant`,
                    role: 'assistant',
                    content: `I could not answer that request. ${message}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const panelClassName = compact
        ? 'surface w-full overflow-hidden p-5'
        : 'surface w-full overflow-hidden p-6';

    return (
        <section className={panelClassName}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                        Ask your archive
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Ask questions about saved meetings and review the evidence.
                    </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    RAG
                </span>
            </div>

            <div className="mb-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`w-full max-w-[92%] overflow-wrap-anywhere rounded-2xl px-3 py-2.5 text-sm shadow-sm ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>

                            {message.sources && message.sources.length > 0 && (
                                <div className="mt-3 border-t border-slate-200 pt-3">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Sources
                                    </p>
                                    <ul className="space-y-2">
                                        {message.sources.map((source, index) => (
                                            <li
                                                key={`${source.meetingId}-${source.chunkIndex}-${index}`}
                                                className="rounded-2xl bg-slate-50 p-2"
                                            >
                                                <p className="text-[11px] font-medium text-slate-900">
                                                    Meeting {source.meetingId} • Chunk{' '}
                                                    {source.chunkIndex + 1}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-600">
                                                    {source.content}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Similarity:{' '}
                                                    {(source.similarity * 100).toFixed(1)}%
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                            Thinking…
                        </div>
                    </div>
                )}
            </div>

            {!isEnabled && (
                <div className="mb-3 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
                    Save or open a meeting first to start asking questions.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Ask about your saved meetings"
                        disabled={!isEnabled}
                        className="control w-full px-3 py-2.5 text-sm text-slate-900 disabled:bg-slate-100"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                            value={model}
                            onChange={(event) => setModel(event.target.value)}
                            disabled={!isEnabled}
                            className="control w-full px-3 py-2.5 text-sm text-slate-700 disabled:bg-slate-100 sm:w-40"
                        >
                            {modelOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            disabled={isLoading || !isEnabled}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-700 disabled:bg-slate-400"
                        >
                            {isLoading ? 'Sending…' : 'Ask'}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
