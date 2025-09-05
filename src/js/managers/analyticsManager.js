class AnalyticsManager {
    constructor() {
        this.metrics = this.loadMetrics();
        this.sessions = this.loadSessions();
        this.currentSession = this.startSession();
        this.charts = {};
    }

    loadMetrics() {
        const saved = localStorage.getItem('analytics');
        return saved ? JSON.parse(saved) : {
            prompts: {
                created: 0,
                edited: 0,
                deleted: 0,
                executed: 0
            },
            tokens: {
                input: 0,
                output: 0,
                total: 0
            },
            costs: {
                daily: [],
                weekly: [],
                monthly: [],
                total: 0
            },
            performance: {
                avgResponseTime: 0,
                successRate: 100,
                errorRate: 0
            },
            usage: {
                daily: [],
                hourly: new Array(24).fill(0),
                byCategory: {},
                byModel: {}
            }
        };
    }

    saveMetrics() {
        localStorage.setItem('analytics', JSON.stringify(this.metrics));
    }

    loadSessions() {
        const saved = localStorage.getItem('sessions');
        return saved ? JSON.parse(saved) : [];
    }

    saveSessions() {
        localStorage.setItem('sessions', JSON.stringify(this.sessions));
    }

    startSession() {
        const session = {
            id: 'session_' + Date.now(),
            start: new Date().toISOString(),
            end: null,
            duration: 0,
            actions: [],
            prompts: 0,
            tokens: 0
        };

        this.sessions.push(session);
        this.saveSessions();

        return session;
    }

    endSession() {
        if (this.currentSession) {
            this.currentSession.end = new Date().toISOString();
            this.currentSession.duration =
                new Date(this.currentSession.end) - new Date(this.currentSession.start);
            this.saveSessions();
        }
    }

    trackAction(action, data = {}) {
        const event = {
            action,
            data,
            timestamp: new Date().toISOString()
        };

        // Add to current session
        if (this.currentSession) {
            this.currentSession.actions.push(event);
        }

        // Update metrics based on action
        switch (action) {
            case 'prompt_created':
                this.metrics.prompts.created++;
                break;
            case 'prompt_edited':
                this.metrics.prompts.edited++;
                break;
            case 'prompt_deleted':
                this.metrics.prompts.deleted++;
                break;
            case 'prompt_executed':
                this.metrics.prompts.executed++;
                this.trackTokenUsage(data.inputTokens, data.outputTokens);
                this.trackCost(data.cost);
                break;
            case 'error':
                this.metrics.performance.errorRate++;
                break;
        }

        // Track hourly usage
        const hour = new Date().getHours();
        this.metrics.usage.hourly[hour]++;

        this.saveMetrics();
    }

    trackTokenUsage(input, output) {
        this.metrics.tokens.input += input || 0;
        this.metrics.tokens.output += output || 0;
        this.metrics.tokens.total = this.metrics.tokens.input + this.metrics.tokens.output;

        if (this.currentSession) {
            this.currentSession.tokens += (input || 0) + (output || 0);
        }
    }

    trackCost(cost) {
        this.metrics.costs.total += cost || 0;

        // Track daily cost
        const today = new Date().toISOString().split('T')[0];
        const dailyEntry = this.metrics.costs.daily.find(d => d.date === today);

        if (dailyEntry) {
            dailyEntry.cost += cost || 0;
        } else {
            this.metrics.costs.daily.push({ date: today, cost: cost || 0 });
        }

        // Keep only last 30 days
        if (this.metrics.costs.daily.length > 30) {
            this.metrics.costs.daily = this.metrics.costs.daily.slice(-30);
        }
    }

    trackPerformance(responseTime, success) {
        const currentAvg = this.metrics.performance.avgResponseTime;
        const totalRequests = this.metrics.prompts.executed;

        // Update average response time
        this.metrics.performance.avgResponseTime =
            (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;

        // Update success rate
        if (success) {
            this.metrics.performance.successRate =
                ((this.metrics.performance.successRate * (totalRequests - 1) + 100) / totalRequests);
        } else {
            this.metrics.performance.successRate =
                ((this.metrics.performance.successRate * (totalRequests - 1)) / totalRequests);
            this.metrics.performance.errorRate++;
        }

        this.saveMetrics();
    }

    getMetricsSummary() {
        return {
            overview: {
                totalPrompts: this.metrics.prompts.created,
                totalExecutions: this.metrics.prompts.executed,
                totalTokens: this.metrics.tokens.total,
                totalCost: this.metrics.costs.total.toFixed(2),
                avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(0) + 'ms',
                successRate: this.metrics.performance.successRate.toFixed(1) + '%'
            },
            trends: {
                daily: this.calculateDailyTrends(),
                weekly: this.calculateWeeklyTrends(),
                monthly: this.calculateMonthlyTrends()
            },
            insights: this.generateInsights()
        };
    }

    calculateDailyTrends() {
        const last7Days = this.metrics.costs.daily.slice(-7);
        const total = last7Days.reduce((sum, day) => sum + day.cost, 0);
        const avg = total / 7;

        return {
            data: last7Days,
            total,
            average: avg,
            trend: this.calculateTrend(last7Days.map(d => d.cost))
        };
    }

    calculateWeeklyTrends() {
        // Group daily data into weeks
        const weeks = [];
        const dailyData = [...this.metrics.costs.daily];

        while (dailyData.length > 0) {
            const week = dailyData.splice(0, 7);
            const weekTotal = week.reduce((sum, day) => sum + day.cost, 0);
            weeks.push({
                start: week[0]?.date,
                end: week[week.length - 1]?.date,
                cost: weekTotal
            });
        }

        return {
            data: weeks.slice(-4),
            trend: this.calculateTrend(weeks.map(w => w.cost))
        };
    }

    calculateMonthlyTrends() {
        // Group daily data into months
        const months = {};

        this.metrics.costs.daily.forEach(day => {
            const month = day.date.substring(0, 7);
            months[month] = (months[month] || 0) + day.cost;
        });

        const monthlyData = Object.entries(months).map(([month, cost]) => ({
            month,
            cost
        }));

        return {
            data: monthlyData.slice(-12),
            trend: this.calculateTrend(monthlyData.map(m => m.cost))
        };
    }

    calculateTrend(values) {
        if (values.length < 2) return 'stable';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    generateInsights() {
        const insights = [];

        // Token usage insight
        if (this.metrics.tokens.total > 100000) {
            insights.push({
                type: 'info',
                title: 'High Token Usage',
                message: `You've used ${(this.metrics.tokens.total / 1000).toFixed(0)}k tokens. Consider optimizing your prompts.`
            });
        }

        // Cost trend insight
        const dailyTrend = this.calculateDailyTrends();
        if (dailyTrend.trend === 'increasing') {
            insights.push({
                type: 'warning',
                title: 'Increasing Costs',
                message: 'Your daily costs are trending upward. Review your usage patterns.'
            });
        }

        // Success rate insight
        if (this.metrics.performance.successRate < 90) {
            insights.push({
                type: 'error',
                title: 'Low Success Rate',
                message: `Success rate is ${this.metrics.performance.successRate.toFixed(1)}%. Check your prompts for errors.`
            });
        }

        // Peak usage times
        const peakHour = this.metrics.usage.hourly.indexOf(Math.max(...this.metrics.usage.hourly));
        insights.push({
            type: 'success',
            title: 'Peak Usage Time',
            message: `Your most active hour is ${peakHour}:00. Schedule intensive tasks accordingly.`
        });

        return insights;
    }

    renderCharts() {
        // Render Token Usage Chart
        this.renderTokenChart();

        // Render Cost Trend Chart
        this.renderCostChart();

        // Render Model Usage Chart
        this.renderModelChart();

        // Render Hourly Activity Chart
        this.renderActivityChart();
    }

    renderTokenChart() {
        const ctx = document.getElementById('tokenChart');
        if (!ctx) return;

        if (this.charts.token) {
            this.charts.token.destroy();
        }

        this.charts.token = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Input Tokens', 'Output Tokens'],
                datasets: [{
                    data: [this.metrics.tokens.input, this.metrics.tokens.output],
                    backgroundColor: ['#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderCostChart() {
        const ctx = document.getElementById('costChart');
        if (!ctx) return;

        if (this.charts.cost) {
            this.charts.cost.destroy();
        }

        const last7Days = this.metrics.costs.daily.slice(-7);

        this.charts.cost = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => d.date),
                datasets: [{
                    label: 'Daily Cost ($)',
                    data: last7Days.map(d => d.cost),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    renderModelChart() {
        const ctx = document.getElementById('modelChart');
        if (!ctx) return;

        if (this.charts.model) {
            this.charts.model.destroy();
        }

        // Get model usage data
        const modelData = Object.entries(this.metrics.usage.byModel || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        this.charts.model = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: modelData.map(([name]) => name),
                datasets: [{
                    label: 'Uses',
                    data: modelData.map(([, uses]) => uses),
                    backgroundColor: '#f59e0b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        const hours = Array.from({length: 24}, (_, i) => i + ':00');

        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Activity',
                    data: this.metrics.usage.hourly,
                    backgroundColor: '#06b6d4'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
