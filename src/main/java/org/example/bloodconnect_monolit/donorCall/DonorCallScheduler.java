package org.example.bloodconnect_monolit.donorCall;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class DonorCallScheduler {

    private final DonorCallService donorCallService;

    // Запускается каждый час
    @Scheduled(cron = "0 0 * * * *")
    public void expireOldCalls() {
        log.info("Running scheduled task: expiring old donor calls");
        donorCallService.expireExpiredCalls();
    }
}