import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CgProfile } from "react-icons/cg";
import AdminLayout from "../../components/admin/AdminLayout";
import Footer from "../../components/Footer";
import { formatNumber } from "../../components/Customer";

const AdminClientDetails = ({ token }: { token: string }) => {
  const { clientId } = useParams();
  const [client, setClient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!clientId) return;
      try {
        const [clientRes, servicesRes] = await Promise.all([
          axios.post(
            "https://graduation-backend-v7om.onrender.com/customer/details",
            { clientID: Number(clientId) },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axios.post(
            "https://graduation-backend-v7om.onrender.com/service/details",
            { CustomerID: Number(clientId) },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);
        setClient(clientRes.data.details);
        setServices(servicesRes.data || []);
      } catch (error: any) {
        if (error.response && error.response.status === 409) {
          setServices([]);
        } else {
          console.error("Ошибка при загрузке клиента:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [clientId, token]);

  const parseDate = (value?: string) => {
    if (!value) return null;
    const iso = new Date(value);
    if (!Number.isNaN(iso.getTime())) return iso;
    const parts = value.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      const normalizedYear = year.length === 2 ? `20${year}` : year;
      const parsed = new Date(`${normalizedYear}-${month}-${day}`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const now = new Date();
  const periodDays = periodFilter === "all" ? null : Number(periodFilter);

  const filteredServices = services.filter((service) => {
    if (statusFilter === "active" && service.ServicePerformed) return false;
    if (statusFilter === "completed" && !service.ServicePerformed) return false;
    if (periodDays) {
      const date = parseDate(service.Date);
      if (!date) return false;
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > periodDays) return false;
    }
    return true;
  });

  const messages = useMemo(() => {
    return filteredServices
      .filter((item) => item.Notes)
      .map((item) => ({
        text: item.Notes,
        date: item.Date,
        time: item.Time,
      }));
  }, [filteredServices]);

  const activeProjects = services.filter((item) => !item.ServicePerformed).length;

  return (
    <AdminLayout title="Профиль клиента">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="/admin/clients">
          <button className="bg-slate-600 border-2 border-slate-500">
            Назад к списку
          </button>
        </a>
      </div>

      {loading ? (
        <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white">
          Загрузка данных клиента...
        </div>
      ) : client ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800 lg:col-span-2">
              <div className="flex items-center gap-4">
                <CgProfile size={64} className="text-white" />
                <div>
                  <h2 className="text-2xl font-semibold">
                    {client.FirstName} {client.LastName}
                  </h2>
                  <p className="text-gray-400">
                    Статус: {activeProjects > 0 ? "Активный" : "Без активных проектов"}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-sm uppercase">Телефон</p>
                  <p>{formatNumber(client.Phone)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm uppercase">Email</p>
                  <p>{client.Email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm uppercase">Адрес</p>
                  <p>
                    {client.Street}, {client.City}, {client.State} {client.ZIP}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800">
              <p className="text-gray-400 text-sm uppercase">Активные проекты</p>
              <div className="text-4xl font-bold text-white mt-2">
                {activeProjects}
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Всего проектов: {services.length}
              </p>
            </div>
          </div>

          <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-4 shadow-md shadow-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label>Период</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                >
                  <option value="all">Все периоды</option>
                  <option value="7">Последние 7 дней</option>
                  <option value="30">Последние 30 дней</option>
                  <option value="90">Последние 90 дней</option>
                </select>
              </div>
              <div>
                <label>Статус</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Все статусы</option>
                  <option value="active">В процессе</option>
                  <option value="completed">Завершенные</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800">
              <h2 className="text-xl font-semibold mb-3">Проекты</h2>
              {filteredServices.length > 0 ? (
                <div className="space-y-3">
                  {filteredServices.map((item, index) => (
                    <div
                      key={`${item.ServiceID || index}`}
                      className="bg-slate-700/70 border border-slate-600 rounded-xl p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {item.ServiceType} • {item.Generator}
                        </p>
                        <span
                          className={
                            item.ServicePerformed
                              ? "text-green-400 text-sm"
                              : "text-yellow-300 text-sm"
                          }
                        >
                          {item.ServicePerformed ? "Завершено" : "В процессе"}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-2">
                        Старт: {item.Date} {item.Time}
                      </p>
                      {item.FinishDate ? (
                        <p className="text-gray-400 text-sm">
                          Завершено: {item.FinishDate} {item.FinishTime || ""}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Проекты отсутствуют.</p>
              )}
            </div>

            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800">
              <h2 className="text-xl font-semibold mb-3">Сообщения / заметки</h2>
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.date}-${index}`}
                      className="bg-slate-700/70 border border-slate-600 rounded-xl p-4"
                    >
                      <p className="text-gray-200">{msg.text}</p>
                      <p className="text-gray-400 text-xs mt-2">
                        {msg.date} {msg.time}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Сообщений пока нет.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white">
          Клиент не найден.
        </div>
      )}
      <Footer />
    </AdminLayout>
  );
};

export default AdminClientDetails;
