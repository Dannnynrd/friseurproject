// src/components/charts/AppointmentsByDayRechart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

const AppointmentsByDayRechart = ({ chartData, title }) => { // title als Prop empfangen
    const hasData = chartData && chartData.labels && chartData.labels.length > 0 && chartData.data && chartData.data.some(d => d > 0);

    if (!hasData) {
        return (
            <>
                <h4 className="chart-title"><FontAwesomeIcon icon={faChartBar} /> {title || 'Terminverteilung'}</h4>
                <p className="chart-no-data-message">Keine Termindaten für Chart in diesem Zeitraum.</p>
            </>
        );
    }

    const data = chartData.labels.map((label, index) => ({
        name: label,
        Termine: chartData.data[index] || 0,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-recharts-tooltip">
                    <p className="label">{`${label}`}</p>
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
            <h4 className="chart-title"><FontAwesomeIcon icon={faChartBar} /> {title || 'Terminverteilung'}</h4>
            <ResponsiveContainer width="100%" height={300}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light, #e9e9e9)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'var(--dark-text, #333)' }}
                        axisLine={{ stroke: 'var(--border-color, #ccc)' }}
                        tickLine={{ stroke: 'var(--border-color, #ccc)' }}
                        interval={0}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Anzahl Termine', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: 'var(--medium-grey-text, #5f5f5f)' }}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(206, 206, 206, 0.25)'}}/>
                    <Bar dataKey="Termine" radius={[5, 5, 0, 0]} >
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
