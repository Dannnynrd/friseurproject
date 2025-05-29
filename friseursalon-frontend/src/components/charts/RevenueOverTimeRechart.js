// Datei: friseursalon-frontend/src/components/charts/RevenueOverTimeRechart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format as formatDateFns, parseISO, differenceInCalendarDays } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

const RevenueOverTimeRechart = ({ chartData, title, periodLabel }) => {
    const hasData = chartData && chartData.length > 0 && chartData.some(d => d.revenue != null && parseFloat(d.revenue) !== 0);

    if (!hasData) {
        return (
            <>
                <h4 className="chart-title"><FontAwesomeIcon icon={faChartLine} /> {title || 'Umsatzentwicklung'}</h4>
                <p className="chart-no-data-message">Keine Umsatzdaten für diesen Zeitraum vorhanden.</p>
            </>
        );
    }

    const formattedData = chartData.map(item => ({
        ...item,
        dateISO: item.date, // Behalte das ISO-Datum für Tooltips
        dateFormatted: formatDateFns(parseISO(item.date), 'dd.MM', { locale: deLocale }),
        revenue: parseFloat(item.revenue)
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Finde den originalen Datenpunkt, um das volle Datum zu bekommen
            const originalDataPoint = formattedData.find(d => d.dateFormatted === label);
            const displayDate = originalDataPoint ? formatDateFns(parseISO(originalDataPoint.dateISO), 'PPP', { locale: deLocale }) : label;
            return (
                <div className="custom-recharts-tooltip">
                    <p className="label">{`${displayDate}`}</p>
                    <p className="intro">{`Umsatz: ${payload[0].value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`}</p>
                </div>
            );
        }
        return null;
    };

    // Dynamische Anpassung der X-Achsen-Ticks
    const getXTickInterval = (dataLength) => {
        if (dataLength <= 7) return 0; // Jeden Tag anzeigen
        if (dataLength <= 15) return 1; // Jeden zweiten Tag
        if (dataLength <= 31) return Math.max(0, Math.floor(dataLength / 7) -1); // Ca. wöchentlich, aber mind. 0
        if (dataLength <= 90) return Math.max(0, Math.floor(dataLength / 12) -1); // Ca. alle 7-8 Tage
        if (dataLength <= 180) return Math.max(0, Math.floor(dataLength / 15) -1); // Ca. alle 10-12 Tage
        return Math.max(0, Math.floor(dataLength / 20) -1); // Für längere Zeiträume, um Ticks zu reduzieren
    };

    const xTickInterval = getXTickInterval(formattedData.length);
    // Dynamische Rotation basierend auf der Anzahl der Ticks, die tatsächlich angezeigt werden würden
    const approxVisibleTicks = xTickInterval > 0 ? Math.ceil(formattedData.length / (xTickInterval +1)) : formattedData.length;
    const angle = approxVisibleTicks > 10 ? -35 : 0; // Drehen, wenn mehr als ~10 Ticks sichtbar wären
    const dy = angle < 0 ? 10 : 5;

    return (
        <>
            <h4 className="chart-title">
                <FontAwesomeIcon icon={faChartLine} /> {title || 'Umsatzentwicklung'}
                {periodLabel && <span className="chart-period-label">({periodLabel})</span>}
            </h4>
            <ResponsiveContainer width="100%" height="100%"> {/* Höhe wird vom Parent .chart-card gesteuert */}
                <LineChart
                    data={formattedData}
                    margin={{ top: 5, right: 25, left: 0, bottom: angle < 0 ? 25 : 15 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light, #e9e9e9)" vertical={false} />
                    <XAxis
                        dataKey="dateFormatted"
                        tick={{ fontSize: 9, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        axisLine={{ stroke: 'var(--border-color, #ccc)' }}
                        tickLine={{ stroke: 'var(--border-color, #ccc)' }}
                        interval={xTickInterval}
                        angle={angle}
                        dy={dy}
                        textAnchor={angle < 0 ? "end" : "middle"} // Textanker für gedrehte Labels
                    />
                    <YAxis
                        tickFormatter={(value) => `${value.toLocaleString('de-DE')} €`}
                        tick={{ fontSize: 9, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                    />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
                    <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} verticalAlign="top" height={25}/>
                    <ReferenceLine y={0} stroke="var(--border-color-strong, #bbb)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="revenue" name="Umsatz" stroke="var(--dark-text, #1f1f1f)" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};

export default RevenueOverTimeRechart;
