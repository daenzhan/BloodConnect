package org.example.bloodconnect_monolit.recomendationAI;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationRequest {
    private int age;
    private int gender;

    @JsonProperty("blood_type")
    private String bloodType;

    @JsonProperty("height_cm")
    private double heightCm;

    @JsonProperty("weight_kg")
    private double weightKg;

    private double hemoglobin;
    private Double ferritin;

    @JsonProperty("prev_donations")
    private int prevDonations;

    @JsonProperty("avg_interval_days")
    private Integer avgIntervalDays;

    @JsonProperty("low_hgb_history")
    private int lowHgbHistory;
}