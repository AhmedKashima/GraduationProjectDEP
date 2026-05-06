// Этот компонент отображает панель управления для администраторов.
// Он загружает и отображает различные статистические данные в виде диаграмм.
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ServiceStatusPieChart from '../components/ServiceStatusPieChart';
import EmployeePerformanceBarChart from '../components/EmployeePerformanceBarChart';
import Footer from '../components/Footer';

const Dashboard = ({ token }: { token: string }) => {
  // Состояние для хранения статистики по услугам
  const [stats, setStats] = useState(null);
  // Состояние для хранения данных о производительности сотрудников
  const [performance, setPerformance] = useState(null);
  // Состояние для хранения данных о доходах
  const [revenue, setRevenue] = useState(null);

  // Эффект для загрузки данных для панели управления при монтировании компонента
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, performanceRes, revenueRes] = await Promise.all([
          axios.get('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/dashboard/performance', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/dashboard/revenue_over_time', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setStats(statsRes.data);
        setPerformance(performanceRes.data);
        setRevenue(revenueRes.data);
      } catch (error) {
        console.error('Ошибка при загрузке данных для панели управления:', error);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Подготовка данных для круговой диаграммы
  const pieChartData = stats
    ? [
        { name: 'Завершено', value: stats.completed },
        { name: 'В процессе', value: stats.in_progress },
        { name: 'Запланировано', value: stats.scheduled },
      ]
    : [];

  return (
    <>
      <div className="flex justify-center mt-5">
        <div className="max-w-4xl w-full px-4">
          <h1 className="text-white text-4xl font-bold mb-5">Панель управления</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Виджет для статуса услуг */}
            <div className="bg-slate-700 p-4 rounded-xl border-2 border-slate-500">
              <h2 className="text-white text-2xl font-bold mb-3">Статус услуг</h2>
              {stats && <ServiceStatusPieChart data={pieChartData} />}
            </div>
            {/* Виджет для производительности сотрудников */}
            <div className="bg-slate-700 p-4 rounded-xl border-2 border-slate-500">
              <h2 className="text-white text-2xl font-bold mb-3">Производительность сотрудников</h2>
              {performance && <EmployeePerformanceBarChart data={performance} />}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;

