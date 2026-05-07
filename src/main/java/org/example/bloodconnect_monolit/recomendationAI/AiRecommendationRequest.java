package org.example.bloodconnect_monolit.recomendationAI;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationRequest {
    private int age;
    private int gender; // 0 = женщина, 1 = мужчина
    private String bloodType;
    private double heightCm;
    private double weightKg;
    private double hemoglobin;
    private Double ferritin;
    private int prevDonations;
    private Integer avgIntervalDays;
    private int lowHgbHistory;
}