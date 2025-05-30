// src/components/charts/AppointmentsByHourRechart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBusinessTime } from '@fortawesome/free-solid-svg-icons';

const AppointmentsByHourRechart = ({ chartData, title }) => {
    // chartData wird erwartet als Array von Objekten: [{ hour: 8, appointmentCount: 5 }, ...]
    // Statt 'appointments' wird jetzt 'appointmentCount' verwendet, um mit dem neuen DTO übereinzustimmen.
    const hasData = chartData && chartData.length > 0 && chartData.some(d => d.appointmentCount > 0);

    if (!hasData) {
        return (
            <>
                <h4 className="chart-title"><FontAwesomeIcon icon={faBusinessTime} /> {title || 'Terminauslastung / Stunde'}</h4>
                <p className="chart-no-data-message">
                    Keine Daten für die Terminauslastung pro Stunde im gewählten Zeitraum verfügbar.
                </p>
            </>
        );
    }

    // Daten für Recharts formatieren
    const data = chartData.map(item => ({
        name: `${String(item.hour).padStart(2, '0')}:00`, // z.B. "08:00"
        Termine: item.appointmentCount, // Geändert von 'appointments' zu 'appointmentCount'
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-recharts-tooltip">
                    <p className="label">{`Uhrzeit: ${label}`}</p>
                    <p className="intro">{`Termine: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    const renderCustomBarLabel = ({ x, y, width, value }) => {
        if (value > 0) {
            return (
                <text x={x + width / 2} y={y} fill="var(--medium-grey-text, #5f5f5f)" textAnchor="middle" dy={-6} fontSize="10px">
                    {value}
                </text>
            );
        }
        return null;
    };

    return (
        <>
            <h4 className="chart-title"><FontAwesomeIcon icon={faBusinessTime} /> {title || 'Terminauslastung / Stunde'}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 25,
                        left: -15,
                        bottom: 5,
                    }}
                    barCategoryGap="20%"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light, #e9e9e9)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: 'var(--dark-text, #333)' }}
                        axisLine={{ stroke: 'var(--border-color, #ccc)' }}
                        tickLine={{ stroke: 'var(--border-color, #ccc)' }}
                        interval={0}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Anzahl Termine', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: 'var(--medium-grey-text, #5f5f5f)'}}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(206, 206, 206, 0.25)'}}/>
                    <Bar dataKey="Termine" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Termine" content={renderCustomBarLabel} />
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={'#82ca9d'} opacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </>
    );
};

export default AppointmentsByHourRechart;
