import { CgProfile, CgWorkAlt } from "react-icons/cg";
import { IoMdArrowRoundBack, IoMdTrash } from "react-icons/io";
import { toast, Toaster } from "react-hot-toast";
import Footer from "../components/Footer";
import { formatNumber } from "../components/Customer";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const History = (props: any) => {
  const [admin, setAdmin] = useState<boolean>(false);
  const { customerID } = useParams();
  const [display, setDisplay] = useState<boolean>(false);
  const [item, setItem] = useState<any>();
  const [currentGenID, setCurrentGenID] = useState<any>();
  const [date, setDate] = useState<any>();
  const [time, setTime] = useState<any>();
  const [serviceType, setServiceType] = useState<any>([]);
  const [generators, setGenerators] = useState<any[]>([]);
  const [jobNotes, setJobNotes] = useState<any>();
  const [work, setWork] = useState<any[]>([]);

  const clearFields = () => {
    setDate("");
    setTime("");
    setGenerators([]);
    getGenerators();
    setServiceType([]); // does not reset for some reason
    setJobNotes("");
  };
  const serviceTypes: string[] = [
    "Установка",
    "Обслуживание",
    "Ремонт",
    "Диагностика",
    "Другое",
  ];

  const getGenerators = () => {
    axios({
      method: "GET",
      url: "https://graduation-backend-v7om.onrender.com/generators/details",
      headers: {
        Authorization: "Bearer " + props.token,
      },
    })
      .then((response) => {
        setGenerators(response.data);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
        }
      });
  };
  const getData = (id: number) => {
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/customer/details",
      headers: {
        Authorization: "Bearer " + props.token,
      },
      data: { clientID: id },
    })
      .then((response) => {
        setItem(response.data.details);
        setDisplay(true);
        setAdmin(response.data.admin);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
        }
      });
  };
  // might be able to just import this function from customer component
const deleteCustomer = (id: number) => {
    if (
      confirm(
        "Вы уверены, что хотите удалить этого клиента?\nЭто действие нельзя отменить."
      ) == true
    ) {
      axios({
        method: "POST",
        url: "https://graduation-backend-v7om.onrender.com/customer/delete",
        headers: {
          Authorization: "Bearer " + props.token,
        },
        data: { CustomerID: id },
      })
        .then((response) => {
          console.log(response);
          history.back();
        })
        .catch((error) => {
          if (error.response) {
            console.log(error.response);
          }
        });
    }
  };

  const createJob = (e: any) => {
    e.preventDefault();
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/service/create",
      headers: {
        Authorization: "Bearer " + props.token,
      },
      data: {
        ServiceID: Math.floor(Math.random() * 90000) + 10000,
        CustomerID: customerID,
        GeneratorID: currentGenID,
        ServicePerformed: false,
        ServiceType: serviceType,
        Date: date,
        Time: time,
        Notes: jobNotes,
      },
    })
      .then((response) => {
        toast.success("Задание добавлено");
        console.log(response);
        getWork(Number(customerID));
        clearFields();
      })
      .catch((error) => {
        toast.error("Что-то пошло не так");
        clearFields();
        if (error.response) {
          console.log(error.response);
        }
      });
  };

  const getWork = (id: number) => {
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/service/details",
      headers: {
        Authorization: "Bearer " + props.token,
      },
      data: { CustomerID: id },
    })
      .then((response) => {
        setWork(response.data);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
        }
      });
  };
  useEffect(() => {
    getData(Number(customerID)); // searches customer by their ID
    getWork(Number(customerID));
    getGenerators();
  }, []);

  return (
    <>
      <Toaster />
      <div className="bg-slate-700 w-full max-w-[900px] my-5 mx-auto border-2 border-slate-500 text-white p-4 rounded-lg shadow-lg shadow-slate-700">
        {display ? (
          <>
            <div className="flex justify-between w-full">
              <a href="/clients">
                <button
                  className={
                    "flex uppercase px-4 py-1.5 rounded-lg text-sm border-slate-500 hover:bg-blue-500 transition-all ease-in-out duration-300"
                  }
                >
                  <IoMdArrowRoundBack className="text-white mr-2" size={20} />{" "}
                  назад
                </button>
              </a>
              <div className="flex">
                <div className="my-auto">
                  {admin ? (
                    <button
                      onClick={() => deleteCustomer(item.ID)}
                      className={
                        "flex uppercase px-4 py-1.5 rounded-lg text-sm border-slate-500 hover:bg-red-500 transition-all ease-in-out duration-300"
                      }
                    >
                      <IoMdTrash className="text-white mr-2" size={20} />
                      Удалить клиента
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="bg-slate-700 mt-2 rounded-xl h-0.5 w-full" />
            <div className="flex py-2 justify-around w-full">
              <div className="my-auto">
                <div className="flex justify-center">
                  <CgProfile size={100} />
                </div>
                <p className="text-[30px] tracking-wider">
                  {item.FirstName} {item.LastName}
                </p>
                <p className="text-gray-400 text-center text-sm">
                  Клиент: #{item.ID}
                </p>
              </div>
              <div className="my-auto text-lg">
                <div className="tracking-wide">
                  <p className="text-gray-300 text-start pt-2">
                    Телефон:{" "}
                    <span className="text-white">
                      {formatNumber(item.Phone)}
                    </span>
                  </p>
                  <p className="text-gray-300 text-start py-1">
                    Электронная почта: <span className="text-white">{item.Email}</span>
                  </p>
                </div>
                <div className="tracking-wide">
                  <p className="text-gray-300 mt-2 text-start py-1">
                    Адрес: <br />
                    <span className="text-white">
                      {item.Street} {item.City},
                    </span>
                    <br />
                    <span className="text-white">
                      {item.State}, {item.ZIP}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-500 my-4 rounded-xl h-0.5 w-full" />
            {/* create job form */}
            <form onSubmit={createJob}>
              <div className="grid md:grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label>Дата:</label>
                  <input
                    type="date"
                    required
                    onChange={(e) => setDate(e.target.value)}
                    value={date}
                  />
                </div>
                <div className="col-span-2">
                  <label>Время:</label>
                  <input
                    type="time"
                    required
                    onChange={(e) => setTime(e.target.value)}
                    value={time}
                  />
                </div>
                <div className="col-span-2">
                  <label>Генератор:</label>
                  <select
                    required
                    onChange={(e) => {
                      setJobNotes(e.target.value.split(",")[0]);
                      setCurrentGenID(e.target.value.split(",")[1]);
                    }}
                  >
                    <option value={"default"}>(Пожалуйста, выберите значение)</option>
                    {generators.map((gen, index) => (
                      <option key={index} value={[gen.gNotes, gen.gID]}>
                        {gen.gName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label>Тип услуги:</label>
                  <select
                    required
                    onChange={(e) => {
                      setServiceType(e.target.value);
                    }}
                  >
                    <option value={"default"}>(Пожалуйста, выберите значение)</option>
                    {serviceTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label>Примечания:</label>
                  <textarea
                    className="h-[100px]"
                    onChange={(e) => setJobNotes(e.target.value)}
                    value={jobNotes}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-500 border-2 text-black border-blue-800 text-lg px-4 py-2 rounded-lg my-4 w-full col-span-2 hover:bg-blue-700 transition-all ease-in-out duration-300"
              >
                Создать задание
              </button>
            </form>
            {/* job history for client */}
            {work.length > 0 ? (
              <>
                <div className="bg-slate-500 mt-1 rounded-xl h-0.5 w-full" />
                <div className="hidden md:flex my-2 justify-center">
                  <div className="my-auto">
                    <CgWorkAlt className="text-white" size={30} />
                  </div>
                  <div className="my-auto ml-2 mt-1">
                    <p className="tracking-wider text-lg">История работ</p>
                  </div>
                </div>
              </>
            ) : null}
            {/* display each individual job */}
            {work.map((item, index) => (
              <div
                key={index}
                className="bg-slate-600 hidden md:block border-2 border-slate-500 text-white p-4 my-2 rounded-lg shadow-md shadow-slate-700"
              >
                <div className="flex text-sm justify-between px-2 tracking-wider capitalize">
                  <div>
                    <div className="text-gray-100">{item.Generator}</div>
                    <div className="text-gray-200">{item.ServiceType}</div>
                  </div>
                  <div>
                    <div className="text-gray-100">{item.Date}</div>
                    <div className="text-gray-200">{item.Time}</div>
                  </div>
                </div>
                <div className="bg-slate-500 mt-2 rounded-xl h-0.5 w-full" />
                <div className="p-2 text-gray-200 tracking-wider capitalize">
                  {item.Notes}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
      <Footer />
    </>
  );
};

export default History;
