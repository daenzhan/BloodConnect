package org.example.bloodconnect_monolit.recomendationAI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Service
public class AiRecommendationClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public AiRecommendationClient(@Value("${ai.recommendation.base-url:http://localhost:8000}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(300000);
        this.restTemplate = new RestTemplate(factory);
        this.baseUrl = baseUrl;
    }

    public AiRecommendationResponse getRecommendation(AiRecommendationRequest request) {
        try {
            AiRecommendationResponse response = restTemplate.postForObject(
                    baseUrl + "/api/recommend",
                    request,
                    AiRecommendationResponse.class
            );
            return response != null ? response : createFallbackResponse();
        } catch (RestClientException e) {
            System.err.println("AI Service error: " + e.getMessage());
            // Возвращаем fallback-ответ, если AI сервис недоступен
            AiRecommendationResponse fallback = new AiRecommendationResponse();
            fallback.setSuccess(false);
            fallback.setReadySoon(false);
            fallback.setReadinessLevel("unknown");
            fallback.setReadinessText("AI service temporarily unavailable");
            fallback.setHealthAdvice("Unable to get AI recommendations at this time");
            fallback.setConfidence(0.0);
            return fallback;
        }
    }
    private AiRecommendationResponse createFallbackResponse() {
        AiRecommendationResponse fallback = new AiRecommendationResponse();
        fallback.setSuccess(false);
        fallback.setReadySoon(false);
        fallback.setReadinessLevel("unknown");
        fallback.setReadinessText("AI service temporarily unavailable");
        fallback.setHealthAdvice("Unable to get AI recommendations at this time");
        fallback.setConfidence(0.0);
        return fallback;
    }
}