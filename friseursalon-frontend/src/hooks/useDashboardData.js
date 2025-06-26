// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.service';
import { format as formatDateFns, parseISO } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';

// Hilfsfunktionen (können auch in eine zentrale utils-Datei)
const formatCurrency = (value) => value != null ? `${parseFloat(value).toFixed(2).replace('.', ',')} €` : 'N/A';

export const useDashboardData = (dateRange, topNServicesConfig, onAppointmentAction) => {
    const [allData, setAllData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const { startDate, endDate } = dateRange;
            const params = { startDate, endDate, topN: topNServicesConfig };

            // Ein einziger, umfassenderer API-Aufruf an einen neuen oder angepassten Backend-Endpunkt
            // Fürs Erste simulieren wir das mit den bestehenden Aufrufen
            const [statsRes, activityRes, chartsResDay, chartsResService, chartsResRevenue, chartsResHour] = await Promise.all([
                api.get('statistics/detailed-counts', { params }),
                api.get('statistics/today-upcoming-appointments'),
                api.get('statistics/by-day-of-week', { params }),
                api.get('statistics/by-service', { params }),
                api.get('statistics/revenue-over-time', { params }),
                api.get('statistics/by-hour-of-day', { params }),
            ]);

            const kpiDataRaw = statsRes.data;
            const kpiData = {
                formatted: {
                    totalRevenueInPeriod: formatCurrency(kpiDataRaw.totalRevenueInPeriod),
                    totalAppointmentsInPeriod: kpiDataRaw.totalAppointmentsInPeriod,
                    avgRevenuePerAppointment: formatCurrency(kpiDataRaw.totalRevenueInPeriod / kpiDataRaw.totalAppointmentsInPeriod),
                    // ... weitere Formatierungen hier zentralisieren
                },
                numeric: {
                    totalRevenueInPeriod: kpiDataRaw.totalRevenueInPeriod,
                    totalAppointmentsInPeriod: kpiDataRaw.totalAppointmentsInPeriod,
                },
                ...kpiDataRaw
            };

            setAllData({
                kpiData,
                activityData: {
                    dailyAppointments: activityRes.data,
                    newBookingsToday: kpiDataRaw.newBookingsToday,
                    newBookingsYesterday: kpiDataRaw.newBookingsYesterday,
                },
                chartData: {
                    appointmentsByDay: { labels: chartsResDay.data.map(d => d.dayName), data: chartsResDay.data.map(d => d.appointmentCount) },
                    appointmentsByService: { labels: chartsResService.data.map(s => s.serviceName), data: chartsResService.data.map(s => s.appointmentCount) },
                    revenueOverTime: chartsResRevenue.data,
                    appointmentsByHour: chartsResHour.data,
                },
                keyChanges: [], // Diese können später noch hinzugefügt werden
                dashboardAlerts: []
            });

        } catch (err) {
            setError(`Fehler beim Laden der Dashboard-Daten: ${err.message || 'Unbekannter Fehler'}`);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, topNServicesConfig]);

    useEffect(() => {
        fetchData();
    }, [fetchData, onAppointmentAction]); // Neu laden bei Datumsänderung oder externer Aktion

    return { allData, isLoading, error, refetchData: fetchData };
};