// src/components/charts/AppointmentsByServiceRechart.js
// Version für V5 - ohne onSegmentClick Prop und Handler
import React, { PureComponent } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#ffc0cb', '#a4de6c'];

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    return (
        <g>
            <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill={fill} fontSize={12} fontWeight="bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 8} dy={8} textAnchor="middle" fill="#333" fontSize={11}>
                {`(${value} Termine, ${(percent * 100).toFixed(1)}%)`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 4}
                outerRadius={outerRadius + 8}
                fill={fill}
                opacity={0.3}
            />
        </g>
    );
};


class AppointmentsByServiceRechart extends PureComponent {
    state = {
        activeIndex: 0,
    };

    onPieEnter = (_, index) => {
        this.setState({
            activeIndex: index,
        });
    };

    render() {
        // chartData ist jetzt ein Objekt { labels: [], data: [] }
        const { chartData: chartDataObject, title } = this.props;

        const hasData = chartDataObject && chartDataObject.labels && chartDataObject.labels.length > 0 &&
            chartDataObject.data && chartDataObject.data.some(d => d > 0);

        if (!hasData) {
            return (
                <>
                    <h4 className="chart-title"><FontAwesomeIcon icon={faChartPie} /> {title || 'Top Dienstleistungen'}</h4>
                    <p className="chart-no-data-message">Keine Servicedaten für dieses Diagramm im gewählten Zeitraum.</p>
                </>
            );
        }

        // Daten für Recharts PieChart formatieren
        let dataForPie = chartDataObject.labels.map((label, index) => ({
            name: label,
            value: chartDataObject.data[index] || 0,
        })).filter(item => item.value > 0)
            .sort((a,b) => b.value - a.value);

        // Wenn es mehr als 7 Services gibt, fasse den Rest als "Andere" zusammen
        if (dataForPie.length > 7) {
            const topServices = dataForPie.slice(0, 6); // Top 6 behalten
            const otherServicesCount = dataForPie.slice(6).reduce((sum, item) => sum + item.value, 0);
            if (otherServicesCount > 0) {
                dataForPie = [...topServices, { name: 'Andere', value: otherServicesCount }];
            } else {
                dataForPie = topServices;
            }
        }

        const CustomTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                const percentValue = payload[0].payload.percent !== undefined ? (payload[0].payload.percent * 100).toFixed(1) : 'N/A';
                return (
                    <div className="custom-recharts-tooltip">
                        <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p>
                        {percentValue !== 'N/A' && <p className="desc">Anteil: {`${percentValue}%`}</p>}
                    </div>
                );
            }
            return null;
        };

        return (
            <>
                <h4 className="chart-title"><FontAwesomeIcon icon={faChartPie} /> {title || 'Top Dienstleistungen'}</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={this.state.activeIndex}
                            activeShape={renderActiveShape}
                            data={dataForPie}
                            cx="50%"
                            cy="45%"
                            innerRadius={50}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            onMouseEnter={this.onPieEnter}
                            // onClick Handler entfernt für V5
                            cursor="pointer"
                        >
                            {dataForPie.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
                        <Legend
                            wrapperStyle={{ fontSize: "10px", paddingTop: "10px", lineHeight: "1.4" }}
                            align="center"
                            verticalAlign="bottom"
                            iconSize={8}
                            payload={
                                dataForPie.map(
                                    (entry, index) => ({
                                        value: `${entry.name} (${entry.value})`,
                                        type: 'circle',
                                        id: entry.name,
                                        color: COLORS[index % COLORS.length]
                                    })
                                )
                            }
                        />
                    </PieChart>
                </ResponsiveContainer>
            </>
        );
    }
}

export default AppointmentsByServiceRechart;
