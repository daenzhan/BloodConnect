package org.example.bloodconnect_monolit.recomendationAI;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationResponse {
    private boolean success;
    private int nextDonationDays;
    private boolean readySoon;
    private String readinessLevel; // green, yellow, red
    private String readinessText;
    private String healthAdvice;
    private double confidence;
    private double bmi;
    private String bmiCategory;
}