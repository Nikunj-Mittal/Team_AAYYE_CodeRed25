import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Analytics({ quizzes }) {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuizStats(selectedQuiz);
    }
  }, [selectedQuiz, timeRange]);

  const fetchQuizStats = async (quizId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/quiz/${quizId}/stats?timeRange=${timeRange}`
      );
      const data = await response.json();
      setQuizStats(data);
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
    }
    setLoading(false);
  };

  const chartConfigs = {
    scoreDistribution: {
      data: {
        labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
        datasets: [{
          label: 'Number of Students',
          data: quizStats?.scoreDistribution || [0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Score Distribution' }
        }
      }
    },
    attemptsOverTime: {
      data: {
        labels: quizStats?.attemptDates || [],
        datasets: [{
          label: 'Quiz Attempts',
          data: quizStats?.attemptsPerDay || [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Attempts Over Time' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    },
    questionAnalysis: {
      data: {
        labels: quizStats?.questionNumbers || [],
        datasets: [{
          label: 'Success Rate (%)',
          data: quizStats?.questionSuccessRates || [],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Question Success Rates' }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    }
  };

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div className="quiz-selector">
          <label htmlFor="quiz-select">Select Quiz: </label>
          <select
            id="quiz-select"
            value={selectedQuiz || ''}
            onChange={(e) => setSelectedQuiz(e.target.value)}
          >
            <option value="">Select a quiz...</option>
            {quizzes.map(quiz => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>
        <div className="time-range-selector">
          <label htmlFor="time-range">Time Range: </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : quizStats ? (
        <div className="analytics-content">
          <div className="stats-overview">
            <div className="stat-card">
              <h3>Total Attempts</h3>
              <p className="stat-value">{quizStats.totalAttempts}</p>
            </div>
            <div className="stat-card">
              <h3>Average Score</h3>
              <p className="stat-value">{(quizStats?.averageScore || 0).toFixed(1)}%</p>
            </div>
            <div className="stat-card">
              <h3>Highest Score</h3>
              <p className="stat-value">{quizStats?.highestScore || 0}%</p>
            </div>
            <div className="stat-card">
              <h3>Pass Rate</h3>
              <p className="stat-value">{(quizStats?.passRate || 0).toFixed(1)}%</p>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <h3>Score Distribution</h3>
              <Doughnut {...chartConfigs.scoreDistribution} />
            </div>
            <div className="chart-card">
              <h3>Attempts Over Time</h3>
              <Line {...chartConfigs.attemptsOverTime} />
            </div>
            <div className="chart-card">
              <h3>Question Analysis</h3>
              <Bar {...chartConfigs.questionAnalysis} />
            </div>
          </div>

          <div className="question-details">
            <h3>Question Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Success Rate</th>
                  <th>Most Common Wrong Answer</th>
                </tr>
              </thead>
              <tbody>
                {quizStats.questionDetails.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.question}</td>
                    <td>{detail.successRate.toFixed(1)}%</td>
                    <td>{detail.commonWrongAnswer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-selection">
          <p>Please select a quiz to view analytics</p>
        </div>
      )}
    </div>
  );
}

export default Analytics; 