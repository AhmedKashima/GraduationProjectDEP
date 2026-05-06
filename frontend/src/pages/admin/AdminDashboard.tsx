import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/admin/StatCard";
import ActivityLineChart from "../../components/admin/ActivityLineChart";
import MonthlyBarChart from "../../components/admin/MonthlyBarChart";
import Footer from "../../components/Footer";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

const AdminDashboard = ({ token }: { token: string }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [activeOpen, setActiveOpen] = useState<boolean>(false);
  const [activeLoading, setActiveLoading] = useState<boolean>(false);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [openProjectId, setOpenProjectId] = useState<number | null>(null);

  const openActiveProjects = async () => {
    setActiveOpen(true);
    if (activeProjects.length > 0) return;
    setActiveLoading(true);
    try {
      const res = await axios.get("https://graduation-backend-v7om.onrender.com/api/admin/active-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveProjects(res.data || []);
      setCityFilter("all");
      setTypeFilter("all");
      setTechFilter("all");
    } catch (error) {
      console.error("Ошибка при загрузке активных проектов:", error);
    } finally {
      setActiveLoading(false);
    }
  };

  const cityOptions = Array.from(
    new Set(
      activeProjects
        .map((p: any) => (p.city || "").trim())
        .filter((value: string) => value.length > 0)
    )
  ).sort();
  const typeOptions = Array.from(
    new Set(
      activeProjects
        .map((p: any) => (p.service_type || "").trim())
        .filter((value: string) => value.length > 0)
    )
  ).sort();
  const techOptions = Array.from(
    new Set(
      activeProjects
        .flatMap((p: any) => (p.techs || []).map((t: any) => t.name))
        .filter((value: string) => value && value.length > 0)
    )
  ).sort();

  const filteredProjects = activeProjects.filter((project: any) => {
    if (cityFilter !== "all" && project.city !== cityFilter) return false;
    if (typeFilter !== "all" && project.service_type !== typeFilter) return false;
    if (techFilter !== "all") {
      const techNames = (project.techs || []).map((t: any) => t.name);
      if (!techNames.includes(techFilter)) return false;
    }
    return true;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, activityRes, revenueRes] = await Promise.all([
          axios.get("https://graduation-backend-v7om.onrender.com/api/admin/metrics", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://graduation-backend-v7om.onrender.com/api/admin/activity?days=14", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://graduation-backend-v7om.onrender.com/api/dashboard/revenue_over_time", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setMetrics(metricsRes.data);
        setActivity(activityRes.data);

        const normalizedMonthly = (revenueRes.data || [])
          .map((item: any) => ({
            month: item.month,
            value: Number(item.revenue || 0),
            order: Number(item.month_index || 99),
          }))
          .sort((a: any, b: any) => a.order - b.order)
          .map(({ month, value }: any) => ({ month, value }));

        setMonthly(normalizedMonthly);
      } catch (error) {
        console.error("Ошибка при загрузке данных администратора:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return (
    <AdminLayout title="Админ-панель">
      {loading ? (
        <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white">
          Загрузка метрик...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Всего клиентов"
              value={metrics ? metrics.total_clients : 0}
            />
            <StatCard
              title="Активные проекты"
              value={metrics ? metrics.active_projects : 0}
              onClick={openActiveProjects}
            />
            <StatCard
              title="Сообщения сегодня"
              value={metrics ? metrics.messages_today : 0}
            />
            <StatCard
              title="Выручка / прогресс"
              value={metrics ? formatNumber(metrics.revenue_total) : 0}
              subtitle={
                metrics
                  ? `Прогресс: ${metrics.completion_rate}%`
                  : "Прогресс: 0%"
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800">
              <h2 className="text-xl font-semibold mb-2">Активность</h2>
              <p className="text-gray-400 text-sm mb-4">
                Количество новых сервисных работ за последние 14 дней.
              </p>
              <ActivityLineChart data={activity} />
            </div>
            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800">
              <h2 className="text-xl font-semibold mb-2">Месячная статистика</h2>
              <p className="text-gray-400 text-sm mb-4">
                Выручка по завершенным работам.
              </p>
              <MonthlyBarChart data={monthly} />
            </div>
          </div>
        </>
      )}
      {activeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl w-full max-w-3xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Активные проекты</h2>
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setActiveOpen(false)}
              >
                Закрыть
              </button>
            </div>
            {activeLoading ? (
              <div className="text-gray-300">Загрузка...</div>
            ) : activeProjects.length === 0 ? (
              <div className="text-gray-300">Нет активных проектов</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <select
                    className="bg-slate-700 text-white p-2 rounded-md w-full"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  >
                    <option value="all">Все города</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <select
                    className="bg-slate-700 text-white p-2 rounded-md w-full"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Все типы</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    className="bg-slate-700 text-white p-2 rounded-md w-full"
                    value={techFilter}
                    onChange={(e) => setTechFilter(e.target.value)}
                  >
                    <option value="all">Все техники</option>
                    {techOptions.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                </div>
                {filteredProjects.length === 0 ? (
                  <div className="text-gray-300">Ничего не найдено</div>
                ) : null}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {filteredProjects.map((project: any) => (
                  <div
                    key={project.service_id}
                    className="bg-slate-700/70 border border-slate-600 rounded-lg p-4"
                  >
                    <div className="text-sm text-gray-200 font-semibold">
                      #{project.service_id} — {project.customer_name}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {project.city} {project.street}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button
                        className="text-xs text-blue-300 hover:text-blue-200"
                        onClick={() =>
                          setOpenProjectId(
                            openProjectId === project.service_id ? null : project.service_id
                          )
                        }
                      >
                        {openProjectId === project.service_id ? "Скрыть детали" : "Показать детали"}
                      </button>
                    </div>
                    {openProjectId === project.service_id ? (
                      <div className="mt-2 text-xs text-gray-300 space-y-1">
                        <div>
                          Генератор: {project.generator_name || "—"} | Тип: {project.service_type || "—"}
                        </div>
                        <div>
                          Дата: {project.start_date || "—"} {project.start_time || ""}
                        </div>
                        <div>
                          Техники: {(project.techs || []).length > 0
                            ? project.techs.map((t: any) => t.name).join(", ")
                            : "—"}
                        </div>
                        {project.notes ? (
                          <div>Заметки: {project.notes}</div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      <Footer />
    </AdminLayout>
  );
};

export default AdminDashboard;
