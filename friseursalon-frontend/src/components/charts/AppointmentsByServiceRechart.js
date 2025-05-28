// src/components/charts/AppointmentsByServiceRechart.js
import React, { PureComponent } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} fontSize={13} fontWeight="bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#333" fontSize={11}>
                {`${value} (${(percent * 100).toFixed(0)}%)`}
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
                opacity={0.5}
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
        const { chartData, title } = this.props; // title als Prop empfangen

        const hasData = chartData && chartData.labels && chartData.labels.length > 0 && chartData.data && chartData.data.some(d => d > 0);

        if (!hasData) {
            return (
                <>
                    <h4 className="chart-title"><FontAwesomeIcon icon={faChartPie} /> {title || 'Top Dienstleistungen'}</h4>
                    <p className="chart-no-data-message">Keine Servicedaten für Chart in diesem Zeitraum.</p>
                </>
            );
        }

        const data = chartData.labels.map((label, index) => ({
            name: label,
            value: chartData.data[index] || 0,
        }));

        const CustomTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                const percentValue = payload[0].payload.percent !== undefined ? (payload[0].payload.percent * 100).toFixed(0) : 'N/A';
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
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            activeIndex={this.state.activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={85}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            onMouseEnter={this.onPieEnter}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
                        <Legend
                            wrapperStyle={{ fontSize: "11px", paddingTop: "10px", lineHeight: "1.5" }}
                            align="center"
                            verticalAlign="bottom"
                            iconSize={10}
                            payload={
                                data.map(
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
