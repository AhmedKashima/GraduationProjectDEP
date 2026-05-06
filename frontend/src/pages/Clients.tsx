import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { CgSearch } from "react-icons/cg";
import Footer from "../components/Footer";
import Customer from "../components/Customer";
import axios from "axios";

const Clients = (props: any) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSearch, setShowSearch] = useState<string>(
    "displaying all customers"
  );
  const [customers, setCustomers] = useState<any[]>([{}]);
  const [admin, setAdmin] = useState<boolean>(false);
  const [first, setFirst] = useState<string>("");
  const [last, setLast] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [ZIP, setZIP] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const clearFields = () => {
    setFirst("");
    setLast("");
    setEmail("");
    setCity("");
    setStreet("");
    setPhone("");
    setState("");
    setZIP("");
  };

  function getCustomers() {
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/customer/display",
      headers: {
        Authorization: "Bearer " + props.token,
      },
      data: { Search: searchTerm },
    }).then((response) => {
      // console.log(response);
      const customers = response.data.customers;
      setCustomers(customers);
      setAdmin(response.data.admin);
      if (searchTerm != "") {
        setShowSearch(`${customers.length} результат(ы) для "${searchTerm}"`);
      } else {
        setShowSearch("отображение всех клиентов");
      }
    });
  }

  function addCustomer(e: any) {
    e.preventDefault();
    axios({
      method: "POST",
      url: "https://graduation-backend-v7om.onrender.com/customer/create",
      headers: {
        Authorization: "Bearer " + props.token,
      },
      data: {
        CustomerID: Math.floor(Math.random() * 90000) + 10000,
        "First Name": first.charAt(0).toUpperCase() + first.slice(1),
        "Last Name": last.charAt(0).toUpperCase() + last.slice(1),
        "Phone Number": phone,
        Email: email,
        City: city.charAt(0).toUpperCase() + city.slice(1),
        Street: street,
        State: state,
        "ZIP Code": ZIP,
      },
    })
      .then((response) => {
        toast.success("Клиент добавлен");
        console.log(response);
        clearFields();
        getCustomers();
      })
      .catch((error) => {
        toast.error("Что-то пошло не так"); // update this to say if customer already exists
        clearFields();
        if (error.response) {
          console.log(error.response);
        }
      });
  }
  // когда нажимается клавиша enter, запускается функция поиска
  const onKeyDownHandler = (e: any) => {
    if (e.keyCode === 13) {
      getCustomers();
    }
  };
  useEffect(() => {
    getCustomers();
  }, []);

  return (
    <>
      <Toaster />
      <div className="flex justify-center w-full min-h-screen">
        <div className="w-[80%] max-w-[900px] text-center">
          <div className="bg-slate-700 border-2 border-slate-500 shadow-md shadow-slate-700 mt-5 p-4 rounded-xl transition-all duration-300 ease-in-out">
            <h2 className="text-white cap font-roboto my-2 text-center text-4xl tracking-wide">
              Управление клиентами
            </h2>
            {/* form to add a new client */}
            <form onSubmit={addCustomer}>
              <div className="grid md:grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label>Имя:</label>
                  <input
                    type="text"
                    placeholder="Имя"
                    onChange={(e) => setFirst(e.target.value)}
                    value={first}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label>Фамилия:</label>
                  <input
                    type="text"
                    placeholder="Фамилия"
                    onChange={(e) => setLast(e.target.value)}
                    value={last}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label>Номер телефона:</label>
                  <input
                    type="tel"
                    pattern="[1-9]{1}[0-9]{9}"
                    maxLength={10}
                    placeholder="Номер телефона"
                    onChange={(e) => setPhone(e.target.value)}
                    value={phone}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label>Электронная почта:</label>
                  <input
                    type="email"
                    placeholder="Электронная почта"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label>Адрес улицы:</label>
                  <input
                    type="text"
                    placeholder="Улица"
                    onChange={(e) => setStreet(e.target.value)}
                    value={street}
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label>Город:</label>
                  <input
                    type="text"
                    placeholder="Город"
                    onChange={(e) => setCity(e.target.value)}
                    value={city}
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label>Штат:</label>
                  <input
                    type="text"
                    placeholder="Штат"
                    onChange={(e) => setState(e.target.value)}
                    value={state}
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label>Почтовый индекс:</label>
                  <input
                    type="text"
                    placeholder="Почтовый индекс"
                    onChange={(e) => setZIP(e.target.value)}
                    value={ZIP}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-500 border-2 border-blue-800 text-lg px-4 py-2 rounded-lg mt-4 w-full col-span-2 hover:bg-blue-700 transition-all ease-in-out duration-300"
              >
                Создать профиль
              </button>
            </form>
          </div>
          {/* search bar for clients */}
          <div className="h-1 rounded-full mt-6 bg-slate-700/50" />
          <p className="text-white pt-2 text-2xl">Поиск клиентов</p>
          <div className="flex justify-center">
            <input
              className="mt-4 rounded-lg border-2 tracking-wider border-slate-500 p-2 bg-slate-700 text-white w-full"
              type={"text"}
              placeholder="Поиск клиентов . . ."
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => onKeyDownHandler(e)}
              value={searchTerm}
            />
            <button
              onClick={() => getCustomers()}
              className="border-slate-500 mt-4 ml-2 p-2 rounded-lg h-[45px] border-2 bg-slate-700 text-white hover:bg-blue-500 ease-in-out duration-300 transition-all"
            >
              <CgSearch size={25} />
            </button>
          </div>
          {/* displays customers */}
          {customers.length > 0 ? (
            <>
              <p className="text-gray-100 text-[15px] uppercase text-center pt-4">
                {showSearch}
              </p>

              <ul className="m-4">
                <div className="grid md:grid-cols-1 gap-6">
                  {customers.map((item, index) => (
                    <Customer
                      item={item}
                      key={index}
                      token={props.token}
                      getCustomers={getCustomers}
                      admin={admin}
                    />
                  ))}
                </div>
              </ul>
            </>
          ) : (
            <p className="text-gray-400 text-[15px] uppercase text-center pt-4">
              результаты не найдены
            </p>
          )}
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Clients;
