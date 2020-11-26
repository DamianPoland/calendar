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


const Home = () => {


    // EFFECT - scroll to top when open tab
    // useEffect(() => {
    //     window.scrollTo(0, 0)
    // }, [])



    // ----------------------- START MONTH CHANGE --------------------------//


    // STATE - set displayed month
    const [displayedMonth, setDisplayedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth()}`) // default today, show today year and month in code: "2020-10" like in DB

    // STATE - set loaded days for month from DB
    const [loadedMonth, setLoadededMonth] = useState([])

    // EFFECT - get live data (snapshot) from month collection according to state: displayedMonth
    useEffect(() => {

        // get available days in month from DB
        const listenerMonth = firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).onSnapshot(
            resp => {

                // help list with all available days fetched from DB
                let availableDaysList = []

                // save data from DB in lists - all days in month
                resp.forEach(doc => {

                    // if no data then not show (if doc exist in DB but has no data)
                    if (Object.keys(doc.data()).length === 0) {
                        return
                    }

                    // make list with all available days in this month
                    const yearMonth = displayedMonth.split('-')
                    const day = { year: parseInt(yearMonth[0]), month: parseInt(yearMonth[1]), day: parseInt(doc.id) }
                    availableDaysList.push(day)

                })

                // save list of all days in month to state
                setLoadededMonth(availableDaysList)

            },
            err => console.log('err', err))

        //cleanup listener
        return () => listenerMonth()

    }, [displayedMonth])


    // call when displayed month change
    const handlerActiveDateChange = ({ activeStartDate, value, view }) => {

        // set state of visible year and month in code: "2020-10" like in DB => useEffect will start
        setDisplayedMonth(`${activeStartDate.getFullYear()}-${activeStartDate.getMonth()}`)

        // cleaer state of days
        setDisplayedDay()
        setLoadedDay([])
    }


    // function to enable/disable days, fuction call for every visible day in calendar and if return true than disabled day and if return false then enabled day
    const handlerTileDisabled = ({ date, view }) => {
        return (
            !loadedMonth.some(disabledDateItem =>
                date.getFullYear() === disabledDateItem.year && date.getMonth() === disabledDateItem.month && date.getDate() === disabledDateItem.day)
        )
    }

    // ----------------------- END MONTH CHANGE --------------------------//





    // ----------------------- START DAY CHANGE --------------------------//


    // STATE - set displayed days - empty on the begining and when clicked put number
    const [displayedDay, setDisplayedDay] = useState()


    // STATE - set array of hours in displayed day fetched from DB (e.g.: [{year: 2020, month: 10, day: 28}, {year: 2020, month: 11, day: 4}] -> month 0-11 , day 1-31
    const [loadedDay, setLoadedDay] = useState([])


    // EFFECT - get live data (snapshot) from day document according to state: displayedDay
    useEffect(() => {

        // return when displayed day is null
        if (!displayedDay) {
            return
        }

        // get live data (snapshot) added hours in day from DB
        const listenerDay = firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${displayedDay}`).onSnapshot(
            resp => {

                // return when document not exist in DB
                if (!resp.data()) {
                    return
                }

                // get hours of one day and make array
                const arrayOfHours = Object.keys(resp.data()).map(item => [item, resp.data()[item]])
                const arrayOfHoursSorted = arrayOfHours.sort((a, b) => parseInt(a[0]) - parseInt(b[0]))

                // save one day reservations array to state
                setLoadedDay(arrayOfHoursSorted)
            },
            err => console.log('err', err))

        //cleanup listener
        return () => listenerDay()

    }, [displayedDay])


    // ----------------------- END DAY CHANGE --------------------------//





    // ----------------------- START RESERVATION --------------------------//


    // STATE - set service id
    const [service, setService] = useState(services[0].id)

    // STATE - show/hide popup reservation, false or day number
    const [reservation, setReservation] = useState(false)

    // STATE - popup alert "reservation done"
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
        firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${displayedDay}`).update({ [reservation]: false }) // update hour that is reserved
            .then(() => firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS_RESERVATION).doc(`${displayedDay}`).update({ [reservation]: { name: inputName, email: inputEmail, type: services.find(item => item.id === service).name } })) // add add reservation data
            .then(() => {
                console.log('success set documents: ', CALENDAR, displayedMonth, DAYS, displayedDay)

                // show alert 'reservation done
                setAlertSmall(true)

                // clear inputs
                setInputName('')
                setInputEmail('')

            }) // no response
            .catch(err => console.log('err', err))

        // close reservation popup
        setReservation(false)

    }

    // function to cancel reservation to DB
    const cancelReservation = () => {
        setReservation(false)
        setInputNameIsInvalid(false)
        setInputEmailIsInvalid(false)
        setInputAgreenentIsInvalid(false)
    }

    // ----------------------- END RESERVATION --------------------------//






    return (
        <section className={style.background}>

            {/* alert  */}
            {alertSmall && <AlertSmall description="Dodano rezerwację." hide={() => setAlertSmall(false)} />}


            {/* header */}
            <h1 className={style.header}>Testowy moduł: KALENDARZ</h1>
            <p className={style.desc}>Przykładowy moduł kalendarza służy do rezerwowania terminów np: stolików w restauracji, wizyty u specjalisty itp.</p>


            {/* calendar container */}
            <div className={style.calendar}>
                <div className={style.calendar_container}>


                    {/* reservation popup*/}
                    <div className={`${style.calendar_reservation} ${reservation && style.calendar_reservationVisible}`}>
                        <div className={style.calendar_reservationHeader}>
                            <img className={style.calendar_reservationHeaderImg} src={logo} alt='logo' />
                            <p className={style.calendar_reservationHeaderDesc}>Nazwa Firmy</p>
                        </div>
                        <p className={style.calendar_reservationText1}>{`Rezerwacja terminu: ${displayedMonth.split('-')[0]}-${parseInt(displayedMonth.split('-')[1]) + 1}-${displayedDay}, godz: ${reservation}`}</p>
                        <p className={style.calendar_reservationText2}>{`Usługa: ${services.find(item => item.id === service).name}`}</p>
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
                        <div className={style.calendar_reservationButtonsContainer}>
                            <button className={style.calendar_reservationButton} onClick={cancelReservation}>Cofnij</button>
                            <button className={style.calendar_reservationButton} onClick={sendReservation}>Rezerwuj</button>
                        </div>
                    </div>


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
                            onClickDay={(value, event) => setDisplayedDay(value.getDate())}
                            showFixedNumberOfWeeks={true}
                            tileDisabled={handlerTileDisabled}
                        />
                    </div>


                    {/* available days */}
                    {loadedDay.length !== 0 &&
                        <div className={style.calendar_hours}>
                            <p className={style.calendar_hoursDesc}>Dostępne godziny:</p>
                            <div className={style.calendar_hoursList}>
                                {loadedDay.map(item => {
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

