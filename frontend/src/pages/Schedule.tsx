import { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../components/Footer";
import ServiceRecord from "../components/ServiceRecord";
import Datepicker from "react-tailwindcss-datepicker";
import toast, { Toaster } from "react-hot-toast";

// страница расписания, показывающая месяц, неделю и каждый отдельный день
const Schedule = (props: any) => {
  const [schedule, setSchedule] = useState<any>([]);
  const [employees, setEmployees] = useState<any>([]);
  const [generators, setGenerators] = useState<any>([]);
  const [techs, setTechs] = useState<any>([]);
  const [admin, setAdmin] = useState<boolean>(false);
  const [value, setValue] = useState<any>({
    startDate: null,
    endDate: null,
  });
  // обрабатывает изменение панели поиска
  const handleValueChange = (newValue: any) => {
    setValue(newValue);
  };

  // возвращает все записи об обслуживании с информацией о клиенте
  function getSchedule() {
    // console.log(value);
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/schedule/display",
      headers: {
        Authorization: "Bearer " + props.token,
      },
      data: { startDate: value.startDate, endDate: value.endDate },
    })
      .then((response) => {
        // console.log(response.data);
        if (response.data.services.length != 0) {
          setSchedule(sortArray(response.data.services));
          setEmployees(response.data.team);
          setTechs(response.data.techs);
          setAdmin(response.data.admin);
          setGenerators(response.data.generators);
        } else {
          setSchedule([]); // устанавливает пустой массив, если задания не найдены
        }
      })
      .catch((error) => {
        toast.error("Что-то пошло не так");
        if (error.response) {
          console.log(error.response);
        }
      });
  }
  // сортирует задания от новых к старым
  const sortArray = (arr: any) => {
    arr.sort((a: any, b: any) => {
      const aDateTime = new Date(`${a.start_date} ${a.start_time}`);
      const bDateTime = new Date(`${b.start_date} ${b.start_time}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });
    return arr;
  };

  useEffect(() => {
    getSchedule();
  }, [value]);

  return (
    <>
      <Toaster />
      <div className="flex justify-center mt-5">
        <div className="w-[700px] p-4 bg-slate-700 border-2 border-slate-500 shadow-md shadow-slate-700 mb-2 rounded-xl h-full transition-all duration-300 ease-in-out">
          <h2 className="text-white cap font-roboto text-center text-4xl tracking-wide">
            расписание
          </h2>
          <Datepicker
            useRange={false}
            placeholder="ОТОБРАЖЕНИЕ ВСЕХ РАБОТ"
            inputClassName={"search"}
            // containerClassName={""}
            showShortcuts={true}
            separator={"-"}
            value={value}
            onChange={handleValueChange}
          />
        </div>
      </div>
      {/* schedule */}
      <div className="h-1 rounded-full w-[95%] mx-auto my-2 bg-slate-500" />
      {schedule.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-[90%] m-auto">
          {schedule.map((item: any, index: number) => (
            <ServiceRecord
              item={item}
              key={index}
              employees={employees}
              techs={techs}
              token={props.token}
              getSchedule={getSchedule}
              admin={admin}
              generators={generators}
            />
          ))}
        </div>
      ) : (
        <h3 className="text-center text-[20px] text-gray-200 uppercase mt-4 mb-[100px]">
          Работы не найдены
        </h3>
      )}
      <Footer />
    </>
  );
};

export default Schedule;
