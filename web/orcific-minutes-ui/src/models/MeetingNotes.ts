export interface MeetingNotes {
    transcript: string;
    summary: string;
    decisions: string[];
    actionItems: string[];
    openQuestions: string[];
    metadata: GenerationMetadata;
}

// const notes: MeetingNotes = {
//     summary: 'Sample summary',
//     keyDecisions: ['Decision 1', 'Decision 2'],
//     actionItems: ['Action Item 1'],
//     openQuestions: ['Open Question 1'],
//     metadata: {
//         model: 'Sample Model',
//         durationMs: 1234,
//         generatedAt: new Date().toISOString(),
//     }
// } as MeetingNotes;

export interface GenerationMetadata {
    model: string;
    durationMs: number;
    generatedAt: string;
}
