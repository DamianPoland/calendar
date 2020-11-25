import React, { useEffect, useState } from 'react'
import style from './Home.module.css'
import { firestore } from '../../shared/fire'
import { CALENDAR, DAYS_RESERVATION, DAYS } from '../../shared/constans'

// components
import AlertSmall from '../../UI/AlertSmall/AlertSmall'


// calendar
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import '../../shared/Calendar.css'


// images
import logo from '../../assets/logo512.png'


// list of services
const services = [
    { id: 1, name: "Opcja 1", price: '50' },
    { id: 2, name: "Opcja 2", price: '100' },
    { id: 3, name: "Opcja 3", price: '150' },
]


// list with all available days fetched from DB
let availableDaysList = []


// list with all available hours in days fetched from DB
let availableHoursList = []


// clicked day
let clickedDay = ''


const Home = () => {


    // STATE - set service id
    const [service, setService] = useState(services[0].id)


    // STATE - set displayed month
    const [displayedMonth, setDisplayedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth()}`) // show today year and month in code: "2020-10" like in DB


    // STATE - set enabled days - empty on the begining and fetched from DB (e.g.: [{year: 2020, month: 10, day: 28}, {year: 2020, month: 11, day: 4}] -> month 0-11 , day 1-31, NOTE: 0 is first month, month 12 will be 1 of next year, day 32 will be 1 next month)
    const [enabledDays, setEnabledDays] = useState([])


    // STATE - set hours of day
    const [dayHours, setDayHours] = useState([])


    // STATE - poup reservation, false or day number
    const [reservation, setReservation] = useState(false)

    // STATE - poup alert "reservation done"
    const [alertSmall, setAlertSmall] = useState(false)

    // STATE - input Name
    const [inputName, setInputName] = useState('') // input value
    const [inputNameIsInvalid, setInputNameIsInvalid] = useState(false) // only for set isValid/inInvalid before send

    // STATE - input Email
    const [inputEmail, setInputEmail] = useState('') // input value
    const [inputEmailIsInvalid, setInputEmailIsInvalid] = useState(false) // only for set isValid/inInvalid before send

    // STATE - input Agreenent
    const [inputAgreenent, setAgreenent] = useState(false) // input value
    const [inputAgreenentInvalid, setInputAgreenentIsInvalid] = useState(false) // only for set isValid/inInvalid before send


    // EFFECT - scroll to top when open tab
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])



    // EFFECT - get live data (snapshot) from month collection according to state: displayedMonth
    useEffect(() => {

        // get available days from DB
        const listener = firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).onSnapshot(
            resp => {

                // clear list with all available days in this month fetched from DB
                availableDaysList = []

                // clear list with all available hours in day in this month fetched from DB
                availableHoursList = []

                // save data from DB in lists - all days and hours in month
                resp.forEach(doc => {

                    // if no data then not show (if doc exist in DB but has no data)
                    if (Object.keys(doc.data()).length === 0) {
                        return
                    }

                    // make list with all available days in this month
                    const yearMonth = displayedMonth.split('-')
                    const day = { year: parseInt(yearMonth[0]), month: parseInt(yearMonth[1]), day: parseInt(doc.id) }
                    availableDaysList.push(day)

                    // make list with all available hours in days in this month
                    const hoursValue = Object.keys(doc.data()).map(item => [item, doc.data()[item]]) // change object {hour: availability} to array [hour, availability]
                    hoursValue.sort((a, b) => parseInt(a[0]) - parseInt(b[0])) // sort
                    const dayWithHours = { name: parseInt(doc.id), value: hoursValue }
                    availableHoursList.push(dayWithHours)
                })

                // save list of all days in month to state
                setEnabledDays(availableDaysList)

                // clear reservation
                setReservation(false)
            },
            err => console.log('err', err))

        //cleanup listener
        return () => listener()

    }, [displayedMonth])


    // call when displayed month change
    const handlerActiveDateChange = ({ activeStartDate, value, view }) => {

        // set state of visible year and month in code: "2020-10" like in DB => useEffect will start
        setDisplayedMonth(`${activeStartDate.getFullYear()}-${activeStartDate.getMonth()}`)

        // cleaer state of days
        setEnabledDays([])

        // clear state of hours
        setDayHours([])
    }

    // call when click day
    const handlerClickDay = (value, event) => {

        // set state of available and disable hours in clicked day
        const clickedDayHours = availableHoursList.find(item => item.name === value.getDate()).value
        setDayHours(clickedDayHours)

        // save clicked day for reservation
        clickedDay = value.getDate()
    }

    // function to enable/disable days, fuction call for every visible day in calendar and if return true than disabled day and if return false then enabled day
    const handlerTileDisabled = ({ date, view }) => {
        return (

            // disable all days and enable days from state
            !enabledDays.some(disabledDateItem =>
                date.getFullYear() === disabledDateItem.year && date.getMonth() === disabledDateItem.month && date.getDate() === disabledDateItem.day)
        )
    }

    // function to sent reservation to DB
    const sendReservation = () => {

        // validation input data
        let isInvalid = false

        // name validation if is min 3 chars
        if (inputName.trim().length < 3) {
            setInputNameIsInvalid(true)
            isInvalid = true
        } else {
            setInputNameIsInvalid(false)
        }

        //email validation
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(String(inputEmail).toLowerCase())) {
            setInputEmailIsInvalid(true)
            isInvalid = true
        } else {
            setInputEmailIsInvalid(false)
        }

        // name validation if is min 3 chars
        if (!inputAgreenent) {
            setInputAgreenentIsInvalid(true)
            isInvalid = true
        } else {
            setInputAgreenentIsInvalid(false)
        }


        //check if all inputs are valid
        if (isInvalid) {
            return
        }

        // in DB: update hour that is reserved add add reservation data
        firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${clickedDay}`).update({ [reservation]: false }) // update hour that is reserved
            .then(() => firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS_RESERVATION).doc(`${clickedDay}`).update({ [reservation]: { name: inputName, email: inputEmail, type: services.find(item => item.id === service).name } })) // add add reservation data
            .then(() => {
                console.log('success set documents: ', CALENDAR, displayedMonth, DAYS, clickedDay)

                // show alert 'reservation done
                setAlertSmall(true)

            }) // no response
            .catch(err => console.log('err', err))

        // close reservation popup
        setReservation(false)

        // clear state of hours
        setDayHours([])

        console.log("sent reservation");
    }


    return (
        <section className={style.background}>

            {/* alert  */}
            {alertSmall && <AlertSmall description="Dodano rezerwację." hide={() => setAlertSmall(false)} />}


            {/* header */}
            <h1 className={style.header}>Testowy moduł: KALENDARZ</h1>
            <p className={style.desc}>Przykładowy modół kalendarza służy do rezerwowania terminów. Może służyć do rezerwacji stolików w restauracji, wizyty u specjalisty itp.</p>


            <div className={style.calendar}>
                <div className={style.calendar_container}>


                    {/* reservation popup*/}
                    {
                        reservation &&
                        <div className={style.calendar_reservation}>
                            <div className={style.calendar_header}>
                                <img className={style.calendar_headerImg} src={logo} alt='logo' />
                                <p className={style.calendar_headerDesc}>Nazwa Firmy</p>
                            </div>
                            <p className={style.calendar_reservationText}>{`Rezerwacja terminu: ${displayedMonth.split('-')[0]}-${parseInt(displayedMonth.split('-')[1]) + 1}-${clickedDay}, godz: ${reservation}`}</p>
                            <p className={style.calendar_reservationText}>{`Usługa: ${services.find(item => item.id === service).name}`}</p>
                            <div className={style.inputContainer}>
                                <input onChange={event => setInputName(event.target.value)} value={inputName} onFocus={() => setInputNameIsInvalid(false)} className={`${style.input} ${inputNameIsInvalid && style.inputIsInvalid}`} type='text' required />
                                <label className={style.label}>Twoje imię:</label>
                            </div>
                            <div className={style.inputContainer}>
                                <input onChange={event => setInputEmail(event.target.value)} value={inputEmail} onFocus={() => setInputEmailIsInvalid(false)} className={`${style.input} ${inputEmailIsInvalid && style.inputIsInvalid}`} type='text' required />
                                <label className={style.label}>Twój e-mail:</label>
                            </div>
                            <div className={style.inputCheckBoxContainer}>
                                <input onChange={event => setAgreenent(event.target.checked ? true : false)} onFocus={() => setInputAgreenentIsInvalid(false)} className={`${style.inputCheckBox} ${inputAgreenentInvalid && style.inputIsInvalidCheckBox}`} type='checkbox' />
                                <label className={style.labelCheckBox}>Zapoznałem się i akceptuję regulamin serwisu.</label>
                            </div>



                            <button className={style.calendar_reservationButton} onClick={() => setReservation(false)}>Cofnij</button>
                            <button className={style.calendar_reservationButton} onClick={sendReservation}>Rezerwuj</button>
                        </div>
                    }


                    {/* company description*/}
                    <div className={style.calendar_header}>
                        <img className={style.calendar_headerImg} src={logo} alt='logo' />
                        <p className={style.calendar_headerDesc}>Nazwa Firmy</p>
                    </div>


                    {/* choose service */}
                    <div className={style.calendar_service}>
                        <p className={style.calendar_serviceDesc}>Wybierz usługę:</p>
                        <select className={style.calendar_serviceList} onChange={e => setService(parseInt(e.target.value))}>
                            {services.map(item => <option key={item.id} value={item.id}> {`${item.name}, Cena: ${item.price}zł`} </option>)}
                        </select>
                    </div>


                    {/* choose date */}
                    <div className={style.calendar_date}>
                        <p className={style.calendar_dateDesc}>Wybierz datę i godzinę:</p>
                        <Calendar
                            defaultView="month"
                            maxDetail="month"
                            minDetail="month"
                            maxDate={new Date(`${new Date().getFullYear() + 1}, ${new Date().getMonth() + 1}, ${new Date().getDate()}`)}
                            minDate={new Date(`${new Date().getFullYear()}, ${new Date().getMonth() + 1}, ${new Date().getDate()}`)}
                            onActiveStartDateChange={handlerActiveDateChange}
                            onClickDay={handlerClickDay}
                            showFixedNumberOfWeeks={true}
                            tileDisabled={handlerTileDisabled}
                        />
                    </div>


                    {/* available days */}
                    {dayHours.length !== 0
                        && <div className={style.calendar_hours}>
                            <p className={style.calendar_hoursDesc}>Dostępne godziny:</p>
                            <div className={style.calendar_hoursList}>
                                {dayHours.map(item => {
                                    return (
                                        <p style={{ background: item[1] ? "rgb(0, 200, 0)" : "rgb(200, 0, 0)", cursor: item[1] ? "pointer" : "default" }}
                                            className={style.calendar_hoursListItem}
                                            onClick={() => item[1] && setReservation(item[0])}
                                            key={item[0]}>{item[0]}</p>
                                    )
                                })}
                            </div>
                        </div>
                    }

                </div>
            </div>
        </section>
    )
}

export default Home

