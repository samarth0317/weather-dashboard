import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { toDisplayTemperature } from '../services/weatherApi'

function WeatherChart({ hourly, unit }) {
    // Only the next 24 readings from now, so the chart stays readable.
    const now = Date.now()
    const upcoming = (hourly || [])
        .filter((point) => new Date(point.time).getTime() >= now - 60 * 60 * 1000)
        .slice(0, 24)
        .map((point) => ({
            label: new Date(point.time).toLocaleTimeString([], { hour: '2-digit' }),
            temperature: Math.round(toDisplayTemperature(point.temperature, unit)),
        }))

    const data = upcoming.length > 0 ? upcoming : []

    return (
        <section className="card chart-card">
            <h3 className="section-title">Hourly temperature</h3>
            {data.length === 0 ? (
                <p className="chart-empty">No hourly data available for this location.</p>
            ) : (
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.15)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={24}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={44}
                                unit="°"
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 25, 45, 0.92)',
                                    border: 'none',
                                    borderRadius: 12,
                                    color: '#fff',
                                }}
                                formatter={(value) => [`${value}°${unit}`, 'Temperature']}
                            />
                            <Line
                                type="monotone"
                                dataKey="temperature"
                                stroke="#ffd36e"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    )
}

export default WeatherChart