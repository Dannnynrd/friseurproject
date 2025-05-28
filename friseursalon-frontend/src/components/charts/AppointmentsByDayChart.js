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
    if (!chartData || chartData.labels.length === 0) {
        return <p>Keine Daten für Termine pro Wochentag verfügbar.</p>;
    }

    const data = {
        labels: chartData.labels, // z.B. ['Mo', 'Di', 'Mi', ...]
        datasets: [
            {
                label: 'Termine pro Wochentag',
                data: chartData.data, // z.B. [5, 8, 6, ...]
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blau mit Transparenz
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Legende kann bei einem einzelnen Datensatz oft weg
            },
            title: {
                display: true,
                text: 'Terminverteilung (Aktuelle Woche)',
                font: {
                    size: 16,
                    family: 'var(--font-sans)',
                },
                color: 'var(--dark-text)',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1, // Nur ganze Zahlen auf der Y-Achse
                    color: 'var(--medium-grey-text)',
                },
                grid: {
                    borderColor: 'var(--border-color)',
                    color: 'var(--border-color-light)',
                }
            },
            x: {
                ticks: {
                    color: 'var(--medium-grey-text)',
                },
                grid: {
                    display: false, // Keine vertikalen Grid-Linien für X-Achse
                }
            }
        },
    };

    return <Bar options={options} data={data} />;
};

export default AppointmentsByDayChart;