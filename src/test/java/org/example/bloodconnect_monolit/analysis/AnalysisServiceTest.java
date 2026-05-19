//package org.example.bloodconnect_monolit.analysis;
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
//public class BloodReserveServiceTest {
//
//    @InjectMocks
//    private BloodReserveService bloodReserveService;
//
//    @ParameterizedTest
//    @CsvSource({
//            "RED_BLOOD_CELLS, 35",
//            "PLATELETS, 5",
//            "PLASMA, 365"
//    })
//    void testCalculateExpiryDate_ForDifferentComponents_ShouldReturnCorrectShelfLife(
//            String componentType, int expectedShelfLifeDays) {
//
//        LocalDate collectionDate = LocalDate.of(2026, 6, 15);
//        BloodReserve bloodUnit = new BloodReserve();
//        bloodUnit.setComponentType(componentType);
//        bloodUnit.setCollectionDate(collectionDate);
//
//        bloodReserveService.calculateAndSetExpiryDate(bloodUnit);
//
//        LocalDate expectedExpiry = collectionDate.plusDays(expectedShelfLifeDays);
//        assertEquals(expectedExpiry, bloodUnit.getExpiryDate(),
//                String.format("expiry calculation failed for %s", componentType));
//    }
//}