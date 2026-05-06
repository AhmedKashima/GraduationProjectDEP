import { useEffect, useState } from "react";
import axios from "axios";
import { CgSearch } from "react-icons/cg";
import AdminLayout from "../../components/admin/AdminLayout";
import Footer from "../../components/Footer";
import { formatNumber } from "../../components/Customer";

const AdminClients = ({ token }: { token: string }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadClients = (term: string) => {
    setLoading(true);
    axios
      .post(
        "https://graduation-backend-v7om.onrender.com/customer/display",
        { Search: term },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setClients(response.data.customers || []);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке клиентов:", error);
        setClients([]);
      })
      .finally(() => setLoading(false));
  };

  const loadServices = () => {
    axios
      .post(
        "https://graduation-backend-v7om.onrender.com/service/details",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setServices(response.data || []);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке проектов:", error);
        setServices([]);
      });
  };

  useEffect(() => {
    loadClients("");
    loadServices();
  }, []);

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

  const clientMeta = clients.reduce((acc: any, client: any) => {
    acc[client.ID] = {
      lastDate: null,
      active: false,
    };
    return acc;
  }, {});

  services.forEach((service) => {
    const customerId = service.CustomerID;
    if (!clientMeta[customerId]) return;
    const serviceDate = parseDate(service.Date);
    if (serviceDate) {
      if (!clientMeta[customerId].lastDate || serviceDate > clientMeta[customerId].lastDate) {
        clientMeta[customerId].lastDate = serviceDate;
      }
    }
    if (service.ServicePerformed === false) {
      clientMeta[customerId].active = true;
    }
  });

  const now = new Date();
  const periodDays = periodFilter === "all" ? null : Number(periodFilter);

  const filteredClients = clients.filter((client) => {
    const meta = clientMeta[client.ID];
    if (!meta) return true;
    if (statusFilter === "active" && !meta.active) return false;
    if (statusFilter === "inactive" && meta.active) return false;
    if (periodDays && meta.lastDate) {
      const diff = (now.getTime() - meta.lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > periodDays) return false;
    }
    if (periodDays && !meta.lastDate) return false;
    return true;
  });

  return (
    <AdminLayout title="Клиенты">
      <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-4 shadow-md shadow-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-gray-200">
            Поиск и фильтрация клиентов для администрирования.
          </div>
          <div className="flex w-full lg:w-auto">
            <input
              className="rounded-lg border-2 tracking-wider border-slate-500 p-2 bg-slate-700 text-white w-full lg:w-[280px]"
              type="text"
              placeholder="Поиск клиента..."
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadClients(searchTerm);
                }
              }}
              value={searchTerm}
            />
            <button
              onClick={() => loadClients(searchTerm)}
              className="border-slate-500 ml-2 p-2 rounded-lg border-2 bg-slate-700 text-white hover:bg-blue-500 ease-in-out duration-300 transition-all"
            >
              <CgSearch size={22} />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label>Период активности</label>
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
            <label>Статус проектов</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Без активных</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white">
            Загрузка клиентов...
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-4 shadow-lg shadow-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-gray-300 text-sm uppercase tracking-widest pb-3 border-b border-slate-600">
              <div>Клиент</div>
              <div>Город</div>
              <div>Email</div>
              <div>Телефон</div>
              <div>Статус</div>
              <div>Действия</div>
            </div>
            <div className="divide-y divide-slate-700">
              {filteredClients.map((client) => {
                const meta = clientMeta[client.ID] || {};
                return (
                  <div
                    key={client.ID}
                    className="grid grid-cols-1 md:grid-cols-6 gap-4 py-3 text-gray-100"
                  >
                    <div className="font-semibold">
                      {client.FirstName} {client.LastName}
                    </div>
                    <div>{client.City}</div>
                    <div className="truncate">{client.Email}</div>
                    <div>{formatNumber(client.Phone)}</div>
                    <div>
                      {meta.active ? (
                        <span className="text-yellow-300">Активный</span>
                      ) : (
                        <span className="text-gray-400">Нет активных</span>
                      )}
                    </div>
                    <div>
                      <a href={`/admin/clients/${client.ID}`}>
                        <button className="bg-blue-500 border-2 border-blue-800">
                          Открыть
                        </button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white">
            Клиенты не найдены.
          </div>
        )}
      </div>
      <Footer />
    </AdminLayout>
  );
};

export default AdminClients;
