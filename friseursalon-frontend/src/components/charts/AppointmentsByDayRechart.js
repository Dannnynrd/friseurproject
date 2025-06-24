// src/components/charts/AppointmentsByDayRechart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

// NEU: Monochrome Farbpalette
const COLORS = ['#111827', '#1f2937', '#374151', '#4b5569', '#6b7280', '#9ca3af', '#d1d5db'];

const AppointmentsByDayRechart = ({ chartData, title }) => {
    const hasData = chartData && chartData.labels && chartData.labels.length > 0 && chartData.data && chartData.data.some(d => d > 0);

    if (!hasData) {
        return (
            <>
                <h4 className="chart-title"><FontAwesomeIcon icon={faChartBar} /> {title || 'Terminverteilung'}</h4>
                <p className="chart-no-data-message">Keine Termindaten für dieses Diagramm im gewählten Zeitraum.</p>
            </>
        );
    }

    const data = chartData.labels.map((label, index) => ({
        name: label.substring(0, 2), // Abkürzung für Wochentage
        fullName: label,
        Termine: chartData.data[index] || 0,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = data.find(d => d.name === label);
            return (
                <div className="custom-recharts-tooltip">
                    <p className="label">{`${dataPoint?.fullName || label}`}</p>
                    <p className="intro">{`Termine: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    const renderCustomBarLabel = ({ x, y, width, value }) => {
        if (value > 0) {
            return (
                <text x={x + width / 2} y={y} fill="#6b7280" textAnchor="middle" dy={-6} fontSize="10px">
                    {value}
                </text>
            );
        }
        return null;
    };

    return (
        <>
            <h4 className="chart-title"><FontAwesomeIcon icon={faChartBar} /> {title || 'Terminverteilung'}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 25,
                        left: -15,
                        bottom: 5,
                    }}
                    barCategoryGap="25%"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#374151' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        interval={0}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Anzahl Termine', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#6b7280'}}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(206, 206, 206, 0.25)'}}/>
                    <Bar dataKey="Termine" radius={[5, 5, 0, 0]} cursor="default">
                        <LabelList dataKey="Termine" content={renderCustomBarLabel} />
                        {
                            data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                            ))
                        }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </>
    );
};

export default AppointmentsByDayRechart;