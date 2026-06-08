package org.example.bloodconnect_monolit.recomendationAI;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiRecommendationResponse {
    private boolean success;

    @JsonProperty("next_donation_days")
    private int nextDonationDays;

    @JsonProperty("ready_soon")
    private boolean readySoon;

    @JsonProperty("readiness_level")
    private String readinessLevel; // green, yellow, red

    @JsonProperty("readiness_text")
    private String readinessText;

    @JsonProperty("health_advice")
    private String healthAdvice;

    private double confidence;
    private double bmi;

    @JsonProperty("bmi_category")
    private String bmiCategory;
}