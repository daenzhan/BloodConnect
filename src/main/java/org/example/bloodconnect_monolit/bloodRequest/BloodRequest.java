package org.example.bloodconnect_monolit.bloodRequest;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.medCenter.MedCenter;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "bloodrequests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bloodrequest_id")
    private Long bloodRequestId;

    @Column(name = "component_type", nullable = false)
    private String componentType;

    @Column(name = "blood_group", nullable = false)
    private String bloodGroup;

    @Column(name = "rhesus_factor", nullable = false)
    private String rhesusFactor;

    @Column(nullable = false)
    private String volume;

    private LocalDateTime deadline;

    private String status;

    private String comment;

    @ManyToOne
    @JoinColumn(name = "medcenter_id", nullable = false)
    private MedCenter medCenter;

    @ManyToOne
    @JoinColumn(name = "bloodcenter_id")
    private BloodCenter bloodCenter;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createAt;

    public Long getBloodRequestId() {
        return bloodRequestId;
    }

    public void setBloodRequestId(Long bloodRequestId) {
        this.bloodRequestId = bloodRequestId;
    }

    public String getComponentType() {
        return componentType;
    }

    public void setComponentType(String componentType) {
        this.componentType = componentType;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getRhesusFactor() {
        return rhesusFactor;
    }

    public void setRhesusFactor(String rhesusFactor) {
        this.rhesusFactor = rhesusFactor;
    }

    public String getVolume() {
        return volume;
    }

    public void setVolume(String volume) {
        this.volume = volume;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public MedCenter getMedCenter() {
        return medCenter;
    }

    public void setMedCenter(MedCenter medCenter) {
        this.medCenter = medCenter;
    }

    public BloodCenter getBloodCenter() {
        return bloodCenter;
    }

    public void setBloodCenter(BloodCenter bloodCenter) {
        this.bloodCenter = bloodCenter;
    }

    public LocalDateTime getCreateAt() {
        return createAt;
    }

    public void setCreateAt(LocalDateTime createAt) {
        this.createAt = createAt;
    }
}