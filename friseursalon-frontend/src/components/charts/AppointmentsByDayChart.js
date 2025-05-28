// src/components/charts/AppointmentsByDayChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AppointmentsByDayChart = ({ chartData }) => {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        return <p className="chart-no-data-message">Keine Wochentagsdaten verfügbar.</p>;
    }

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Termine',
                data: chartData.data,
                backgroundColor: 'rgba(54, 162, 235, 0.65)', // Etwas satteres Blau
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 'flex',
                maxBarThickness: 40, // Etwas schmaler für mehr Eleganz
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Termine pro Wochentag',
                align: 'start', // Titel linksbündig
                font: {
                    size: 14,
                    family: 'var(--font-sans, sans-serif)',
                    weight: '600', // Etwas fetter für den Titel
                },
                color: 'var(--dark-text, #1f1f1f)',
                padding: {
                    top: 5,
                    bottom: 15
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'var(--dark-text, #1f1f1f)', // Dunkler Tooltip
                titleFont: { family: 'var(--font-sans, sans-serif)', size: 12, weight: 'bold'},
                bodyFont: { family: 'var(--font-sans, sans-serif)', size: 11 },
                padding: 8,
                cornerRadius: 3,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return ` ${context.parsed.y} Termine`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    color: 'var(--medium-grey-text, #5f5f5f)',
                    font: { family: 'var(--font-sans, sans-serif)', size: 10 },
                    padding: 5,
                },
                grid: {
                    borderColor: 'var(--border-color, #e7e7e7)',
                    color: 'rgba(0, 0, 0, 0.05)', // Sehr dezente Grid-Linien
                    drawBorder: false,
                },
                title: {
                    display: false, // Y-Achsen Titel oft redundant
                }
            },
            x: {
                ticks: {
                    color: 'var(--medium-grey-text, #5f5f5f)',
                    font: { family: 'var(--font-sans, sans-serif)', size: 10 },
                },
                grid: {
                    display: false, // Keine X-Achsen Grid-Linien
                }
            }
        },
        layout: {
            padding: { // Etwas Padding innerhalb der Canvas
                left: 0,
                right: 10,
                top: 0,
                bottom: 0
            }
        }
    };

    return (
        <div className="chart-canvas-container"> {/* Höhe wird durch CSS in .chart-card gesteuert */}
            <Bar options={options} data={data} />
        </div>
    );
};

export default AppointmentsByDayChart;
