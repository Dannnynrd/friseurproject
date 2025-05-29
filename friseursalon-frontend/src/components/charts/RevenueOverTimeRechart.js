// Datei: friseursalon-frontend/src/components/charts/RevenueOverTimeRechart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format as formatDateFns, parseISO } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

const RevenueOverTimeRechart = ({ chartData, title, periodLabel }) => {
    const hasData = chartData && chartData.length > 0 && chartData.some(d => d.revenue > 0);

    if (!hasData) {
        return (
            <>
                <h4 className="chart-title"><FontAwesomeIcon icon={faChartLine} /> {title || 'Umsatzentwicklung'}</h4>
                <p className="chart-no-data-message">Keine Umsatzdaten für diesen Zeitraum.</p>
            </>
        );
    }

    const formattedData = chartData.map(item => ({
        ...item,
        // Datum für X-Achse formatieren, je nach Länge des Zeitraums
        // Für kurze Zeiträume (z.B. <= 31 Tage) Tag.Monat, sonst Monat/Jahr oder Woche
        dateFormatted: chartData.length <= 31
            ? formatDateFns(parseISO(item.date), 'dd.MM', { locale: deLocale })
            : formatDateFns(parseISO(item.date), 'MMM yy', { locale: deLocale }),
        revenue: parseFloat(item.revenue) // Stelle sicher, dass Umsatz eine Zahl ist
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload; // Der ursprüngliche Datenpunkt
            return (
                <div className="custom-recharts-tooltip">
                    <p className="label">{`${formatDateFns(parseISO(dataPoint.date), 'PPP', { locale: deLocale })}`}</p>
                    <p className="intro">{`Umsatz: ${payload[0].value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`}</p>
                </div>
            );
        }
        return null;
    };

    // X-Achsen Ticks dynamisch anpassen, um Überlappung zu vermeiden
    const getXTickCount = (dataLength) => {
        if (dataLength <= 7) return dataLength; // Jeden Tag anzeigen bei <= 1 Woche
        if (dataLength <= 31) return Math.ceil(dataLength / 2); // Jeden zweiten Tag bei ~1 Monat
        if (dataLength <= 90) return Math.ceil(dataLength / 7); // Wöchentlich bei ~3 Monaten
        return 12; // Monatlich bei längeren Zeiträumen (max 12 Ticks)
    };
    const interval = Math.max(0, Math.floor(formattedData.length / getXTickCount(formattedData.length)) -1);


    return (
        <>
            <h4 className="chart-title">
                <FontAwesomeIcon icon={faChartLine} /> {title || 'Umsatzentwicklung'}
                {periodLabel && <span className="chart-period-label">({periodLabel})</span>}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={formattedData}
                    margin={{ top: 5, right: 20, left: -5, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light, #e9e9e9)" vertical={false} />
                    <XAxis
                        dataKey="dateFormatted"
                        tick={{ fontSize: 10, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        axisLine={{ stroke: 'var(--border-color, #ccc)' }}
                        tickLine={{ stroke: 'var(--border-color, #ccc)' }}
                        interval={interval} // Dynamisches Intervall
                        angle={formattedData.length > 15 ? -30 : 0} // Winkel für längere Labels
                        dy={formattedData.length > 15 ? 10 : 5}     // Versatz für gewinkelte Labels
                    />
                    <YAxis
                        tickFormatter={(value) => `${value.toLocaleString('de-DE')} €`}
                        tick={{ fontSize: 10, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                    />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} verticalAlign="top" height={30}/>
                    <ReferenceLine y={0} stroke="var(--border-color-strong, #bbb)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="revenue" name="Umsatz" stroke="var(--dark-text, #1f1f1f)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};

export default RevenueOverTimeRechart;