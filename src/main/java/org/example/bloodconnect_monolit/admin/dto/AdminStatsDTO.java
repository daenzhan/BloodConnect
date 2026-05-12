package org.example.bloodconnect_monolit.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalUsers;
    private long totalDonors;
    private long totalBloodCenters;
    private long totalMedicalCenters;
    private long pendingBloodCenters;
    private long pendingMedicalCenters;
    private long totalDonations;
    private long totalBloodRequests;
    private long pendingRequests;
    private Map<String, Long> donationsByMonth;
}
