package com.orcific.minutes.dto;

import java.util.List;

public record MeetingNotes(
        String transcript,
        String summary,
        List<String> decisions,
        List<String> actionItems,
        List<String> openQuestions,
        GenerationMetadata metadata
) {
}
