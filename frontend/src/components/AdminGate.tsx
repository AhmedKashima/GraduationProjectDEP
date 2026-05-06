import { useEffect, useState } from "react";
import axios from "axios";

const AdminGate = ({
  token,
  removeToken,
  children,
}: {
  token: string | null;
  removeToken: () => void;
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    axios
      .get("https://graduation-backend-v7om.onrender.com/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setIsAdmin(Boolean(response.data.Admin));
        setLoading(false);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          removeToken();
        }
        setLoading(false);
      });
  }, [token, removeToken]);

  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white">
          Загрузка данных администратора...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center mt-10">
        <div className="bg-slate-700 border-2 border-slate-500 rounded-xl p-6 text-white max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-2">Доступ ограничен</h2>
          <p className="text-gray-300">
            Этот раздел доступен только администраторам.
          </p>
          <a href="/" className="inline-block mt-4">
            <button className="bg-blue-500 border-2 border-blue-800">Вернуться</button>
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGate;
