// src/components/charts/AppointmentsByServiceChart.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    Title
);

const CHART_COLORS_SERVICE = [
    'rgba(75, 192, 192, 0.7)',  // Türkis
    'rgba(255, 159, 64, 0.7)',  // Orange
    'rgba(153, 102, 255, 0.7)', // Lila
    'rgba(255, 99, 132, 0.7)',   // Rot
    'rgba(54, 162, 235, 0.7)',  // Blau
    'rgba(255, 205, 86, 0.7)', // Gelb
    'rgba(201, 203, 207, 0.7)'  // Grau
];
const CHART_BORDER_COLORS_SERVICE = CHART_COLORS_SERVICE.map(color => color.replace('0.7', '1'));


const AppointmentsByServiceChart = ({ chartData }) => {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        return <p className="chart-no-data-message">Keine Servicedaten verfügbar.</p>;
    }

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Anteil',
                data: chartData.data,
                backgroundColor: CHART_COLORS_SERVICE.slice(0, chartData.data.length),
                borderColor: CHART_BORDER_COLORS_SERVICE.slice(0, chartData.data.length),
                borderWidth: 1.5, // Etwas dickere Border für besseren Look
                hoverOffset: 8,
                hoverBorderColor: 'var(--light-bg, #ffffff)',
                hoverBorderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                align: 'center',
                labels: {
                    color: 'var(--medium-grey-text, #5f5f5f)',
                    font: { family: 'var(--font-sans, sans-serif)', size: 10 },
                    boxWidth: 10,
                    padding: 10,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
                padding: { // Eigene Padding-Kontrolle für Legende
                    top: 10
                }
            },
            title: {
                display: true,
                text: 'Top 5 Dienstleistungen',
                align: 'start',
                font: {
                    size: 14,
                    family: 'var(--font-sans, sans-serif)',
                    weight: '600',
                },
                color: 'var(--dark-text, #1f1f1f)',
                padding: {
                    top: 5,
                    bottom: 15
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'var(--dark-text, #1f1f1f)',
                titleFont: { family: 'var(--font-sans, sans-serif)', size: 12, weight: 'bold'},
                bodyFont: { family: 'var(--font-sans, sans-serif)', size: 11 },
                padding: 8,
                cornerRadius: 3,
                displayColors: true, // Farbkästchen können hier nützlich sein
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.formattedValue;
                        }
                        return label;
                    }
                }
            }
        },
        cutout: '60%', // Mitteldicker Donut
    };

    return (
        <div className="chart-canvas-container">
            <Doughnut options={options} data={data} />
        </div>
    );
};

export default AppointmentsByServiceChart;
