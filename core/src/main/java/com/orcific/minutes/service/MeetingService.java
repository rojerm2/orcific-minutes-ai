package com.orcific.minutes.service;

import com.orcific.minutes.dto.*;
import com.orcific.minutes.entity.MeetingChunkEntity;
import com.orcific.minutes.entity.MeetingEntity;
import com.orcific.minutes.exception.InvalidAiResponseException;
import com.orcific.minutes.mapper.MeetingMapper;
import com.orcific.minutes.repository.MeetingChunkRepository;
import com.orcific.minutes.repository.MeetingRepository;
import com.orcific.minutes.service.ai.ChunkingService;
import com.orcific.minutes.service.ai.EmbeddingService;
import com.orcific.minutes.service.ai.OllamaService;
import com.orcific.minutes.service.ai.PromptService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.json.JsonParseException;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.exc.MismatchedInputException;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
public class MeetingService {
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;
    private final PromptService promptService;
    private static final Logger LOGGER = LoggerFactory.getLogger(MeetingService.class);
    private final MeetingRepository meetingRepository;
    private final MeetingMapper meetingMapper;
    private final ChunkingService chunkingService;
    private final EmbeddingService embeddingService;
    private final MeetingChunkRepository meetingChunkRepository;

    private GenerationMetadata metadata;

    public MeetingNotes summarizeMeeting(String transcript, String model) {
        String prompt = buildPrompt(transcript);

        LOGGER.info("Prompt message: " + prompt);

        String aiResponse = generateResponse(prompt, model);
        LOGGER.info("AI response before parsing: " + aiResponse);
        return parseResponseToMeetingNotes(transcript, aiResponse);
    }

    public long saveMeeting(SaveMeetingRequest request) {
        MeetingEntity entity = meetingMapper.toEntity(request);
        MeetingEntity savedMeeting = meetingRepository.save(entity);

        List<String> chunks = chunkingService.chunk(request.transcript());

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            List<Double> vector = embeddingService.embed(chunk);

            MeetingChunkEntity chunkEntity = new MeetingChunkEntity();

            chunkEntity.setMeeting(savedMeeting);
            chunkEntity.setChunkIndex(i);
            chunkEntity.setContent(chunk);
            chunkEntity.setEmbedding(objectMapper.writeValueAsString(vector));

            meetingChunkRepository.save(chunkEntity);
        }

        return savedMeeting.getId();
    }

    public List<MeetingHistoryResponse> getMeetings() {
        return meetingRepository.findAll()
                .stream()
                .map(meetingMapper::toHistory)
                .toList();
    }

    public MeetingNotes getMeeting(Long id) {

        MeetingEntity entity = meetingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Meeting not found"));

        return meetingMapper.toMeetingNotes(entity);
    }

    private MeetingNotes parseResponseToMeetingNotes(String transcript, String aiResponse) {
        LOGGER.info("Parsing AI response into MeetingNotes.");
        try{
            AiResponse aiResponseDto = objectMapper.readValue(aiResponse, AiResponse.class);

            LOGGER.info("AI response successfully parsed into MeetingNotes.");
            return new MeetingNotes(
                    transcript,
                    aiResponseDto.summary(),
                    aiResponseDto.decisions(),
                    aiResponseDto.actionItems(),
                    aiResponseDto.openQuestions(),
                    metadata
            );
        }
        catch(JsonParseException | MismatchedInputException e){
            LOGGER.error(e.getMessage());
            throw new InvalidAiResponseException("Error with parsing response", e);
        }
    }

    private String generateResponse(String prompt, String model) {
        long startTime = System.currentTimeMillis();
        LOGGER.info("Sending transcript to ollama...");

        String aiResponse = ollamaService.generateMeetingNotes(prompt, model, 0.0);
        LOGGER.info("Received response from ollama.");

        long elapsedTime = System.currentTimeMillis() - startTime;
        LOGGER.info("Ollama finished in {} ms", elapsedTime);

        metadata = new GenerationMetadata(
                model,
                elapsedTime,
                LocalDateTime.now()
        );

        return aiResponse;
    }

    private String buildPrompt(String transcript) {
        String prompt = promptService.getMeetingNotesPrompt(transcript);
        return prompt;
    }
}
