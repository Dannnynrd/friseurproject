package com.friseursalon.backend.payload.response;

import java.math.BigDecimal;

public class ServiceReportDto {
    private Long serviceId;
    private String serviceName;
    private long appointmentCount;
    private BigDecimal revenue;

    // Constructor for JPQL projection
    public ServiceReportDto(Long serviceId, String serviceName, long appointmentCount, BigDecimal revenue) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.appointmentCount = appointmentCount;
        this.revenue = revenue;
    }

    // Standard constructor
    public ServiceReportDto() {
    }

    // Getters and Setters
    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public long getAppointmentCount() {
        return appointmentCount;
    }

    public void setAppointmentCount(long appointmentCount) {
        this.appointmentCount = appointmentCount;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}
