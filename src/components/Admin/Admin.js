import React, { useState, useEffect } from 'react'
import style from './Admin.module.css'
import { firestore, auth } from '../../shared/fire'
import { CALENDAR, DAYS_RESERVATION, DAYS } from '../../shared/constans'

// components
import Spinner from '../../UI/Spinner/Spinner'
import Alert from '../../UI/Alert/Alert'

// calendar
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import '../../shared/Calendar.css'

// icons
import { ReactComponent as CalendarIcon } from '../../assets/calendar.svg'
import { ReactComponent as PeopleIcon } from '../../assets/people.svg'
import { ReactComponent as Logout } from '../../assets/logout.svg'
import { ReactComponent as EyeOn } from '../../assets/eyeOn.svg'
import { ReactComponent as EyeOff } from '../../assets/eyeOff.svg'

// images
import logo from '../../assets/logo512.png'



// default list off hours in day structure: ["hour", false - hour NOT available(someone made reservation) or true - hour available, false - hour is NOT in DB or true hour is in DB] 
let dafaultdWorkHoursList = [["8:00", true, false], ["9:00", true, false], ["10:00", true, false], ["11:00", true, false], ["12:00", true, false], ["13:00", true, false], ["14:00", true, false], ["15:00", true, false], ["16:00", true, false], ["17:00", true, false], ["18:00", true, false]]


// hours list object to send to DB
let newHoursList = {} // e.g.: { "12:00": true, "13:00": false, "14:00": true }


const Admin = props => {


    // EFFECT - scroll to top when open tab
    // useEffect(() => {
    //     window.scrollTo(0, 0)
    // }, [])


    // STATE - left nav tabs
    const [displayedTab, setDisplayedTab] = useState("terms") // tabs: "terms" "clients"

    // STATE - show/hide spinner
    const [showSpinner, setShowSpinner] = useState(false)

    // STATE - show/hide error(alert)
    const [showAlert, setShowAlert] = useState(false)

    // STATE - show/hide error(alert) LOGIN
    const [showAlertLogin, setShowAlertLogin] = useState(false)



    // ----------------------- START LOGIN --------------------------//


    // STATE - input Email
    const [inputLoginEmail, setInputLoginEmail] = useState('') // input value
    const [inputLoginEmailIsInvalid, setInputLoginEmailIsInvalid] = useState(false) // only for set isValid/inInvalid before send

    // STATE - input Password
    const [inputLoginPassword, setInputLoginPassword] = useState('') // input value
    const [inputLoginPasswordIsInvalid, setInputLoginPasswordIsInvalid] = useState(false) // only for set isValid/inInvalid before send

    // STATE - input Agreenent
    const [inputLoginAgreenent, setInputLoginAgreenent] = useState(false) // input value
    const [inputLoginAgreenentIsInvalid, setInputLoginAgreenentIsInvalid] = useState(false) // only for set isValid/inInvalid before send

    // STATE - show/hide password
    const [showPassword, setShowPassword] = useState('password') // 'password' or 'text'

    // function to sent reservation to DB
    const handlerLogin = () => {

        // validation input data
        let isInvalid = false

        //email validation
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(String(inputLoginEmail).toLowerCase())) {
            setInputLoginEmailIsInvalid(true)
            isInvalid = true
        } else {
            setInputLoginEmailIsInvalid(false)
        }

        // password validation if is min 3 chars
        if (inputLoginPassword.trim().length < 3) {
            setInputLoginPasswordIsInvalid(true)
            isInvalid = true
        } else {
            setInputLoginPasswordIsInvalid(false)
        }

        // name validation if is min 3 chars
        if (!inputLoginAgreenent) {
            setInputLoginAgreenentIsInvalid(true)
            isInvalid = true
        } else {
            setInputLoginAgreenentIsInvalid(false)
        }

        //check if all inputs are valid
        if (isInvalid) {
            return
        }

        //login to DB
        auth.signInWithEmailAndPassword(inputLoginEmail, inputLoginPassword)
            .catch(err => setShowAlertLogin({ name: "Nie udało się zalogować!", details: err.message }))

        // signin to DB
        // auth.createUserWithEmailAndPassword(inputLoginEmail, inputLoginPassword)
        //     .catch(err => console.log(err.message))
    }

    // ----------------------- END LOGIN -----------------------------------//



    // ----------------------- START MONTH CHANGE --------------------------//

    // STATE - set displayed month
    const [displayedMonth, setDisplayedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth()}`) // default today, show today year and month in code: "2020-10" like in DB

    // STATE - set loaded days for month from DB
    const [loadedMonth, setLoadededMonth] = useState([])

    // EFFECT (terms) - get live data HOURS (snapshot) from month collection according to state: displayedMonth
    useEffect(() => {

        //show spinner
        setShowSpinner(true)

        // get days with added hours from DB 
        const listenerMonth = firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).onSnapshot(
            resp => {

                // help list with all added days in month fetched from DB
                let addedDaysList = []

                // save data from DB in lists - all days in month
                resp.forEach(doc => {

                    // if no data then not show (if doc exist in DB but has no data)
                    if (Object.keys(doc.data()).length === 0) {
                        return
                    }

                    // make list with all added days in this month
                    const yearMonth = displayedMonth.split('-')
                    const day = { year: parseInt(yearMonth[0]), month: parseInt(yearMonth[1]), day: parseInt(doc.id) }
                    addedDaysList.push(day)

                })

                // save list of all added days in month to state
                setLoadededMonth(addedDaysList)

                //hide spinner
                setShowSpinner(false)

            },
            err => {

                //hide spinner
                setShowSpinner(false)

                // show alert
                setShowAlert({ name: "", details: err.message })
            })

        //cleanup listener
        return () => listenerMonth()

    }, [displayedMonth])


    // call when displayed month change
    const handlerActiveDateChange = ({ activeStartDate, value, view }) => {

        // set state of visible year and month in code: "2020-10" like in DB => useEffect displayedMonth will start
        setDisplayedMonth(`${activeStartDate.getFullYear()}-${activeStartDate.getMonth()}`)

        // clear state of days
        setDisplayedDay()
        setLoadedDayHours([])
        setLoadedDayReservations([])
    }

    // function to add description to evey day, if is no data add "pusto"
    const handlerTileContent = ({ date, view }) => {
        return (
            !loadedMonth.some(disabledDateItem =>
                date.getFullYear() === disabledDateItem.year && date.getMonth() === disabledDateItem.month && date.getDate() === disabledDateItem.day)
                ? <p>pusto</p>
                : null
        )
    }

    // function to add class to evey day, if is data in db then add background
    const handlerTileClassName = ({ date, view }) => {
        return (
            !loadedMonth.some(disabledDateItem =>
                date.getFullYear() === disabledDateItem.year && date.getMonth() === disabledDateItem.month && date.getDate() === disabledDateItem.day)
                ? null
                : "react-calendar__added-class-to-tile-custom"
        )
    }

    // ----------------------- END MONTH CHANGE --------------------------//




    // ----------------------- START DAY CHANGE --------------------------//


    // STATE - set displayed day - empty on the begining and when clicked put number
    const [displayedDay, setDisplayedDay] = useState()

    // STATE - set all hours of day (tab terms)
    const [loadedDayHours, setLoadedDayHours] = useState([])

    // STATE - set all reservations of day (tab clients)
    const [loadedDayReservations, setLoadedDayReservations] = useState([])


    // EFFECT - call when click day according to state: displayedDay
    useEffect(() => {

        // return when clicked day null
        if (!displayedDay) {
            return
        }

        // if no document about this day is in DB - then create documents in DB
        if (!loadedMonth.some(item => item.day === displayedDay)) {

            // set dafaultdWorkHoursList as finalWorkHoursList to state setLoadedDayHours
            setLoadedDayHours(dafaultdWorkHoursList)

            // create empty document in DB with day for hours and day_reservation for reservations, doc('2021-0') => year-month,  first month is 0
            firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${displayedDay}`).set({}) //set empty doc in DB: calendar/{year-month}/days/{displayedDay}
                .then(() => firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS_RESERVATION).doc(`${displayedDay}`).set({})) //set empty doc in DB: calendar/{year-month}/days_reservation/{displayedDay}
                .then(() => console.log('success set documents: ', CALENDAR, displayedMonth, DAYS, displayedDay)) // no response
                .catch(err => setShowAlert({ name: "", details: err.message }))
        }

        // get live data (snapshot) added hours in day from DB
        const listenerDay = firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${displayedDay}`).onSnapshot(
            resp => {

                // return when document not exist yet in DB
                if (!resp.data()) {
                    return
                }

                // get hours of one day and make array
                const arrayOfHours = Object.keys(resp.data()).map(item => [item, resp.data()[item]])

                //add data from DB to dafaultdWorkHoursList 
                const finalWorkHoursList = dafaultdWorkHoursList.map(item => {

                    // must copy element - not reference
                    let copiedArrayItem = [...item]

                    // check if the same item is in arrayOfHours
                    for (let i = 0; i < arrayOfHours.length; i++) {
                        const element = arrayOfHours[i];

                        // modify element in array if is in DB
                        if (copiedArrayItem[0] === element[0]) {

                            // check avalibility ( check if somebody made reservation)
                            copiedArrayItem[1] = element[1]

                            // always true because item is in DB
                            copiedArrayItem[2] = true
                        }
                    }
                    return copiedArrayItem
                })

                // set finalWorkHoursList to state
                setLoadedDayHours(finalWorkHoursList)
            },
            err => setShowAlert({ name: "", details: err.message }))

        // get live data (snapshot) added reservations in day from DB 
        const listenerReservations = firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS_RESERVATION).doc(`${displayedDay}`).onSnapshot(
            resp => {

                // return when document not exist yet in DB
                if (!resp.data()) {
                    return
                }

                // get one day reservation and make arra
                const arrayOfReservation = Object.keys(resp.data()).map(item => [item, resp.data()[item]])
                const arrayOfReservationSorted = arrayOfReservation.sort((a, b) => parseInt(a[0]) - parseInt(b[0]))

                // save one day reservations array to state
                setLoadedDayReservations(arrayOfReservationSorted)
            },
            err => setShowAlert({ name: "", details: err.message }))

        //cleanup listener
        return () => {
            listenerDay()
            listenerReservations()
        }

    }, [displayedDay])


    // ----------------------- END DAY CHANGE --------------------------//





    // ----------------------- START UPDATE HOURS LIST IN DB --------------------------//

    // add or delete hours from hours list object when check/uncheck checkbox
    const hoursListhandler = e => {

        // get hour name
        const hour = e.target.name

        if (e.target.checked) {

            // add new hour to hours list object with true - new hour and available
            newHoursList = { ...newHoursList, [hour]: true }

        } else {

            // delate new hour from hours list
            delete newHoursList[hour]
        }

        console.log(newHoursList);
    }

    // update list of added hours in DB
    const sendData = () => {
        firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${displayedDay}`).update(newHoursList)
            .then(() => { // no response
                console.log('success')

                // clear newHoursList
                newHoursList = []

            })
            .catch(err => setShowAlert({ name: "", details: err.message }))
    }

    // ----------------------- END UPDATE HOURS LIST IN DB --------------------------//





    return (
        <section className={style.background}>


            {/* nav */}
            <nav className={style.nav}>
                <img className={style.nav_img} src={logo} alt='logo' />
                <div style={{ background: displayedTab === "terms" && "rgba(106, 12, 210, 0.8)" }} className={style.nav_item} onClick={() => setDisplayedTab("terms")}>
                    <div className={style.nav_icon}>
                        <CalendarIcon />
                    </div>
                    <p className={style.nav_text}>Terminy</p>
                </div>
                <div style={{ background: displayedTab === "clients" && "rgba(106, 12, 210, 0.8)" }} className={style.nav_item} onClick={() => setDisplayedTab("clients")}>
                    <div className={style.nav_icon}>
                        <PeopleIcon />
                    </div>
                    <p className={style.nav_text}>Klienci</p>
                </div>
                {props.isLogin &&
                    <div className={`${style.nav_item} ${style.nav_itemLogout}`} onClick={() => auth.signOut()}>
                        <div className={style.nav_icon}>
                            <Logout />
                        </div>
                        <p className={style.nav_text}>Wyloguj</p>
                    </div>
                }
            </nav>


            {/* header */}
            <h1 className={style.header}>Testowy moduł: KALENDARZ - ADMIN</h1>
            <p className={style.desc}>System CMS służy do zarządzania kalendarzem. Edytowanie, usuwanie i dodawanie zawartości.</p>


            {/* logOut - login screen */}
            {!props.isLogin &&
                <div className={style.login}>
                    {showAlertLogin && <Alert alertName={showAlertLogin.name} alertDetails={showAlertLogin.details} click={() => setShowAlertLogin(false)} />}
                    <p className={style.login_desc}>Aby uzyskać dstęp zapytaj o login i hasło korzystając z kontaktów: <a className={style.login_a} href="https://studio-www.com/contact" target='blank'>studio-www.com/contact</a></p>
                    <div className={style.login_inputContainer}>
                        <input onChange={event => setInputLoginEmail(event.target.value)} value={inputLoginEmail} onFocus={() => setInputLoginEmailIsInvalid(false)} className={`${style.login_input} ${inputLoginEmailIsInvalid && style.login_inputIsInvalid}`} type='text' required />
                        <label className={style.login_label}>E-mail:</label>
                    </div>
                    <div className={style.login_inputContainer}>
                        <input onChange={event => setInputLoginPassword(event.target.value)} value={inputLoginPassword} onFocus={() => setInputLoginPasswordIsInvalid(false)} className={`${style.login_input} ${inputLoginPasswordIsInvalid && style.login_inputIsInvalid}`} type={showPassword} required />
                        <label className={style.login_label}>Hasło:</label>
                        <div className={style.login_icon} onClick={() => setShowPassword(i => i === "password" ? "text" : "password")}>
                            {showPassword === "password" ? <EyeOn /> : <EyeOff />}
                        </div>
                    </div>
                    <div className={style.inputCheckBoxContainer}>
                        <input onChange={event => setInputLoginAgreenent(event.target.checked ? true : false)} onFocus={() => setInputLoginAgreenentIsInvalid(false)} className={`${style.login_inputCheckBox} ${inputLoginAgreenentIsInvalid && style.login_inputIsInvalidCheckBox}`} type='checkbox' />
                        <label className={style.login_labelCheckBox}>Zapoznałem się i akceptuję <a className={style.login_a} href="/privacy-policy">politykę prywatności</a>.</label>
                    </div>
                    <div className={style.login_buttonsContainer}>
                        <button className={style.login_button} onClick={handlerLogin}>Zaloguj</button>
                    </div>
                </div>}


            {/* logIn - section calendar */}
            {props.isLogin &&
                <div className={style.calendar}>
                    <div className={style.calendar_container}>


                        {/* company description*/}
                        <div className={style.calendar_header}>
                            <img className={style.calendar_headerImg} src={logo} alt='logo' />
                            <p className={style.calendar_headerDesc}>Nazwa Firmy</p>
                        </div>


                        {/* choose date */}
                        <div className={style.calendar_date}>
                            <p className={style.calendar_dateDesc}>Wybierz datę:</p>
                            <div className={style.calendar_dateContainer}>
                                {showSpinner && <Spinner />}
                                {showAlert && <Alert alertName={showAlert.name} alertDetails={showAlert.details} click={() => setShowAlert(false)} />}
                                <Calendar
                                    defaultView="month"
                                    maxDetail="month"
                                    minDetail="month"
                                    onActiveStartDateChange={handlerActiveDateChange}
                                    onClickDay={(value, event) => setDisplayedDay(value.getDate())}
                                    showFixedNumberOfWeeks={true}
                                    tileClassName={handlerTileClassName} // add desc to day
                                    tileContent={handlerTileContent} // add desc to day
                                    tileDisabled={({ date }) => date.getMonth() !== parseInt(displayedMonth.split("-")[1])} // disable days in other months
                                />
                            </div>
                        </div>


                        {/* nav tab terms (available days) */}
                        {displayedTab === "terms" && loadedDayHours.length !== 0 &&
                            <div className={style.calendar_hours}>
                                <div className={style.calendar_hoursTop}>
                                    <p className={style.calendar_hoursDesc}>Dodaj godziny:</p>
                                    <button className={style.calendar_hoursButton} onClick={sendData}>Zapisz</button>
                                </div>
                                <div className={style.calendar_hoursList}>
                                    {loadedDayHours.map(item => {
                                        return (
                                            <div className={style.calendar_hoursListItem} key={`${displayedDay} ${item[0]}`}>
                                                <input className={style.calendar_hoursListItemInput} disabled={item[2] ? true : false} defaultChecked={false} onChange={hoursListhandler} type="checkbox" name={item[0]} value={item[0]} />
                                                <label className={style.calendar_hoursListItemLabel} htmlFor={item[0]}>{item[0]}</label>
                                                {item[2] && <p className={style.calendar_hoursListItemDesc}>{item[1] ? "Już dodano, nikt jeszcze się nie wpisał." : "ZAREZERWOWANY."}</p>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }


                        {/* nav tab clients  */}
                        {displayedTab === "clients" && loadedDayReservations.length === 0 && displayedDay &&
                            <div className={style.calendar_hours}>
                                <div className={style.calendar_hoursTop}>
                                    <p className={style.calendar_hoursDesc}>Brak rezerwacji.</p>
                                </div>
                            </div>
                        }
                        {displayedTab === "clients" && loadedDayReservations.length !== 0 &&
                            <div className={style.calendar_hours}>
                                <div className={style.calendar_hoursTop}>
                                    <p className={style.calendar_hoursDesc}>Zarezerwowane terminy:</p>
                                </div>
                                <div className={style.calendar_hoursList}>
                                    {loadedDayReservations.map(item => {
                                        return (
                                            <div className={style.calendar_reservationListItem} key={`${displayedMonth}-${displayedDay}-${item[0]}`}>
                                                <p className={style.calendar_reservationListItemDate}>{`Data: ${displayedMonth.split('-')[0]}-${parseInt(displayedMonth.split('-')[1]) + 1}-${displayedDay}, godz: ${item[0]}, usługa: ${item[1].type}`}</p>
                                                <p className={style.calendar_reservationListItemDesc}>{`Imię: ${item[1].name}`}</p>
                                                <p className={style.calendar_reservationListItemDesc}>{`E-mail: ${item[1].email}`}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }
        </section>
    )
}

export default Admin

