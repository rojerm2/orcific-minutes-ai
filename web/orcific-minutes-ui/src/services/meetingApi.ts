import type { MeetingHistory } from '../models/MeetingHistory.ts';
import type { MeetingNotes } from '../models/MeetingNotes.ts';
import type { RagResponse } from '../models/RagResponse.ts';
import type { RagQuestionRequest } from '../models/RagQuestionRequest.ts';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export async function uploadTranscript(file: File, model: string): Promise<MeetingNotes> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);

    const response = await fetch(apiUrl('/meeting/upload'), {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to generate meeting notes.');
    }

    return (await response.json()) as MeetingNotes;
}

export async function saveMeeting(
    title: string,
    transcript: string,
    meetingNotes: MeetingNotes,
): Promise<number> {
    const response = await fetch(apiUrl('/meeting'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            transcript,
            meetingNotes,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to save meeting.');
    }

    const result = await response.json();

    return result.id as number;
}

export async function getMeetingHistory(): Promise<MeetingHistory[]> {
    const response = await fetch(apiUrl('/meeting'));

    if (!response.ok) {
        throw new Error('Failed to load history.');
    }

    return await response.json();
}

export async function getMeeting(id: number): Promise<MeetingNotes> {
    const response = await fetch(apiUrl(`/meeting/${id}`));

    if (!response.ok) {
        throw new Error('Meeting not found.');
    }

    return await response.json();
}

export async function askMeetingRag(
    meetingId: number | undefined,
    question: string,
    model: string,
): Promise<RagResponse> {
    const response = await fetch(apiUrl('/rag/ask'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId, question, model } as RagQuestionRequest),
        // body: JSON.stringify({ question, model }),
    });

    if (!response.ok) {
        throw new Error('Failed to query RAG backend.');
    }

    return await response.json();
}
