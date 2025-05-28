import React from 'react';
import { Doughnut } from 'react-chartjs-2'; // Oder Bar, je nach Präferenz
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

const AppointmentsByServiceChart = ({ chartData }) => {
    if (!chartData || chartData.labels.length === 0) {
        return <p>Keine Daten für Termine pro Dienstleistung verfügbar.</p>;
    }

    const data = {
        labels: chartData.labels, // z.B. ['Schnitt', 'Farbe', ...]
        datasets: [
            {
                label: 'Anteil Dienstleistungen',
                data: chartData.data, // z.B. [12, 9, 4, ...]
                backgroundColor: [ // Farben für Donut-Segmente
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'var(--medium-grey-text)',
                    font: {
                        family: 'var(--font-sans)',
                    }
                }
            },
            title: {
                display: true,
                text: 'Top Dienstleistungen (Aktueller Monat)',
                font: {
                    size: 16,
                    family: 'var(--font-sans)',
                },
                color: 'var(--dark-text)',
            },
        },
    };

    return <Doughnut options={options} data={data} />;
};

export default AppointmentsByServiceChart;