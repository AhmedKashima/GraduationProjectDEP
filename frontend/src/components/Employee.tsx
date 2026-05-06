import {
  RiAdminLine,
  RiUserLine,
  RiLockPasswordLine,
  RiMessage2Fill,
} from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import { formatNumber } from "./Customer";

const time = new Date();

const Employee = ({
  item,
  userID,
  getTeam,
  token,
  setRecipientId,
}: {
  item: any;
  userID: number | undefined;
  getTeam: any;
  token: string;
  setRecipientId: (id: number) => void;
}) => {
  const changePermission = (id: number) => {
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/employees/permission",
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {
        EmployeeID: id,
      },
    })
      .then((response) => {
        toast.success("Разрешение изменено");
        console.log(response);
        getTeam();
      })
      .catch((error) => {
        toast.error("Что-то пошло не так");
        if (error.response) {
          console.log(error.response);
        }
      });
  };

  const deleteEmployee = (id: number) => {
    if (
      confirm(
        "Вы уверены, что хотите удалить этого пользователя?\nЭто действие нельзя отменить."
      ) == true
    ) {
      axios({
        method: "POST",
        url: "https://graduation-backend-v7om.onrender.com/employees/delete",
        headers: {
          Authorization: "Bearer " + token,
        },
        data: {
          EmployeeID: id,
        },
      })
        .then((response) => {
          toast.success("Сотрудник удален");
          console.log(response);
          getTeam();
        })
        .catch((error) => {
          toast.error("Что-то пошло не так");
          if (error.response) {
            console.log(error.response);
          }
        });
    }
  };
  const createCode = (id: number) => {
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/recovery/create",
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {
        EmployeeID: id,
        creationDate:
          time.getFullYear() +
          "-" +
          (time.getMonth() + 1) +
          "-" +
          time.getDate(),
      },
    })
      .then((response) => {
        // toast.success("Recovery Code Created");
        showCode(id);
        console.log(response);
      })
      .catch((error) => {
        toast.error("Что-то пошло не так");
        if (error.response) {
          console.log(error.response);
        }
      });
  };

  const showCode = (id: number) => {
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/recovery/display",
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {
        EmployeeID: id,
      },
    })
      .then((response) => {
        toast.success("Код восстановления: " + response.data.Code, {
          duration: 5000, // toast will stay on the screen longer
        });
        console.log(response);
      })
      .catch((error) => {
        toast.error("Что-то пошло не так");
        if (error.response) {
          console.log(error.response);
        }
      });
  };

  const openChat = (id: number) => {
    setRecipientId(id);
  };

  return (
    <>
      <div
        className={
          "bg-slate-700 text-white p-4 w-full rounded-lg border-2 border-slate-500 shadow-md shadow-slate-700 hover:scale-105 duration-300 ease-in-out transition-all"
        }
      >
        <div className="flex justify-evenly">
          <div className="my-auto hidden sm:block">
            <div className="bg-slate-500 border-2 text-white border-slate-500 p-3 m-4 rounded-full">
              {item.admin ? (
                <RiAdminLine size={70} />
              ) : (
                <RiUserLine size={70} />
              )}
            </div>
            <p className="text-lg text-center text-gray-400 tracking-wide font-bold">
              {item.admin ? "АДМИН" : "ПОЛЬЗОВАТЕЛЬ"}
            </p>
          </div>
          <div>
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-400 tracking-wide">
                  <span className="visible md:hidden text-[12px] mr-1 font-bold text-gray-400 text-center">
                    {item.admin ? "АДМИН" : "ПОЛЬЗОВАТЕЛЬ"} |
                  </span>
                  ID сотрудника: {item.id}
                </p>
                <p className={"text-xl font-bold tracking-wide"}>
                  {`${item.fN} ${item.lN}`}{" "}
                </p>
              </div>
            </div>
            <div className="h-0.5 w-full my-2 bg-slate-500 rounded-xl" />
            <p className="text-md py-0.5 tracking-wide text-gray-200">
              Номер:
              <span className="ml-2">{formatNumber(item.phone)}</span>
            </p>
            <p className="text-md py-0.5 tracking-wide text-gray-200">
              Электронная почта: <span className="ml-2">{item.email}</span>
            </p>
            <p className="text-md py-0.5 tracking-wide text-gray-200">
              Нанят: <span className="ml-2">{item.hiredDate}</span>
            </p>
            {userID !== item.id ? (
              <div className="flex mt-2">
                <div className="flex justify-evenly gap-2">
                  <button
                    onClick={() => createCode(item.id)}
                    className="bg-blue-500 border-2 uppercase border-blue-800 text-sm text-black tracking-wider px-4 py-1 rounded-lg hover:bg-blue-700 transition-all ease-in-out duration-300"
                  >
                    <RiLockPasswordLine size={25} />
                  </button>
                  <button
                    onClick={() => changePermission(item.id)}
                    className="bg-green-500 border-2 uppercase border-green-800 text-sm text-black tracking-wider px-4 py-1 rounded-lg hover:bg-green-700 transition-all ease-in-out duration-300"
                  >
                    {item.admin ? "Сделать пользователем" : "Сделать администратором"}
                  </button>
                  <button
                    onClick={() => deleteEmployee(item.id)}
                    className="bg-red-500 border-2 uppercase border-red-800 text-sm text-black tracking-wider px-4 py-1 rounded-lg hover:bg-red-700 transition-all ease-in-out duration-300"
                  >
                    {item.admin ? "Удалить администратора" : "Удалить пользователя"}
                  </button>
                  <button
                    onClick={() => openChat(item.id)}
                    className="bg-purple-500 border-2 uppercase border-purple-800 text-sm text-black tracking-wider px-4 py-1 rounded-lg hover:bg-purple-700 transition-all ease-in-out duration-300"
                  >
                    <RiMessage2Fill size={25} />
                  </button>
                </div>
              </div>
            ) : (
              <p className=" text-gray-400">В настоящее время в системе</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Employee;
