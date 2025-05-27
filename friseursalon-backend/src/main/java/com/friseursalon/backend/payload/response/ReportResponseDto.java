package com.friseursalon.backend.payload.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ReportResponseDto {
    private LocalDate reportStartDate;
    private LocalDate reportEndDate;
    private long totalAppointments;
    private BigDecimal totalRevenue;
    private List<ServiceReportDto> serviceBreakdown;
    // For "most popular services", the client can sort serviceBreakdown by appointmentCount,
    // or we can add another list here if a different structure is needed.
    // For V1, using serviceBreakdown sorted is sufficient.

    public ReportResponseDto() {
    }

    public ReportResponseDto(LocalDate reportStartDate, LocalDate reportEndDate, long totalAppointments, BigDecimal totalRevenue, List<ServiceReportDto> serviceBreakdown) {
        this.reportStartDate = reportStartDate;
        this.reportEndDate = reportEndDate;
        this.totalAppointments = totalAppointments;
        this.totalRevenue = totalRevenue;
        this.serviceBreakdown = serviceBreakdown;
    }

    // Getters and Setters
    public LocalDate getReportStartDate() {
        return reportStartDate;
    }

    public void setReportStartDate(LocalDate reportStartDate) {
        this.reportStartDate = reportStartDate;
    }

    public LocalDate getReportEndDate() {
        return reportEndDate;
    }

    public void setReportEndDate(LocalDate reportEndDate) {
        this.reportEndDate = reportEndDate;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public List<ServiceReportDto> getServiceBreakdown() {
        return serviceBreakdown;
    }

    public void setServiceBreakdown(List<ServiceReportDto> serviceBreakdown) {
        this.serviceBreakdown = serviceBreakdown;
    }
}
