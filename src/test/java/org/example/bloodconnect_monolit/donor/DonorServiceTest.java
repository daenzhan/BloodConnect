//// Tests: DonorService business logic with 60-day rule
//package org.example.bloodconnect_monolit.donor;
//
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import java.time.Clock;
//import java.time.LocalDate;
//import java.time.ZoneId;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//public class DonorServiceTest {
//    @Mock
//    private DonorRepository donorRepository;
//    @Mock
//    private Clock clock;
//    @InjectMocks
//    private DonorService donorService;
//
//    @Test
//    void testIsEligibleToDonate_30DaysAfterLastDonation_ShouldReturnFalse() {
//        Long donorId = 1L;
//        Donor donor = new Donor();
//        LocalDate fixedToday = LocalDate.of(2026, 6, 15);
//        LocalDate lastDonationDate = fixedToday.minusDays(30);
//        donor.setLastDonationDate(lastDonationDate);
//
//        when(donorRepository.findById(donorId)).thenReturn(Optional.of(donor));
//        when(clock.instant()).thenReturn(fixedToday.atStartOfDay(ZoneId.systemDefault()).toInstant());
//        when(clock.getZone()).thenReturn(ZoneId.systemDefault());
//
//        boolean result = donorService.isEligibleToDonate(donorId);
//
//        assertFalse(result, "donor must wait at least 60 days between donations");
//        verify(donorRepository, times(1)).findById(donorId);
//    }
//}
//
//
//
//
////{
////    "age": 30,
////    "gender": 1,
////    "blood_type": "O+",
////    "height_cm": 180,
////    "weight_kg": 75,
////    "hemoglobin": 15.2,
////    "ferritin": 120,
////    "prev_donations": 5,
////    "avg_interval_days": 95,
////    "low_hgb_history": 0
////}
////
////
////        {
////            "success": true,
////            "donor_id": null,
////            "next_donation_days": 93,
////            "ready_soon": false,
////            "readiness_level": "green",
////            "readiness_text": "Готов к донации",
////            "health_advice": "Вы донор O+, самый распространённый тип. Рекомендуемый перерыв: 93 дней.",
////            "confidence": 0.85,
////            "bmi": 23.1,
////            "bmi_category": "normal",
////            "predicted_at": "2026-05-13T16:52:41.505197"
////        }
////
////
////        {
////            "age": 25,
////            "gender": 0,
////            "blood_type": "A-",
////            "height_cm": 165,
////            "weight_kg": 55,
////            "hemoglobin": 11.2,
////            "ferritin": 25,
////            "prev_donations": 2,
////            "avg_interval_days": 110,
////            "low_hgb_history": 1
////        }
////
////
////        {
////            "success": true,
////            "donor_id": null,
////            "next_donation_days": 216,
////            "ready_soon": false,
////            "readiness_level": "red",
////            "readiness_text": "Donation not recommended",
////            "health_advice": "Low hemoglobin (11.2 < 12.5). Recovery needed. Low ferritin. Take iron supplements (consult your doctor). Recommended break: 216 days.",
////            "confidence": 0.85,
////            "bmi": 20.2,
////            "bmi_category": "normal"
////        }
//
//
//
//
