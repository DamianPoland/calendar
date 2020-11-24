import React, { useState, useEffect } from 'react'
import style from './Admin.module.css'
import { firestore } from '../../shared/fire'
import { CALENDAR, DAYS_RESERVATION, DAYS } from '../../shared/constans'


// calendar
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import '../../shared/Calendar.css'


// icons
import { ReactComponent as CalendarIcon } from '../../assets/calendar.svg'
import { ReactComponent as PeopleIcon } from '../../assets/people.svg'


// images
import logo from '../../assets/logo512.png'


// list off hours in day structure: ["hour", false - hour NOT available(someone made reservation) or true - hour available, false - hour is NOT in DB or true hour is in DB] 
let dafaultdWorkHoursList = [["8:00", true, false], ["9:00", true, false], ["10:00", true, false], ["11:00", true, false], ["12:00", true, false], ["13:00", true, false], ["14:00", true, false], ["15:00", true, false], ["16:00", true, false], ["17:00", true, false], ["18:00", true, false]]


// list with all added days fetched from DB
let addedDaysList = []


// list with all added hours in days fetched from DB
let addedHoursList = []

// hours list object to send to DB
let newHoursList = {} // e.g.: { "12:00": true, "13:00": false, "14:00": true }


const Admin = () => {


    // STATE - set displayed month
    const [displayedMonth, setDisplayedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth()}`) // show today year and month in code: "2020-10" like in DB


    // STATE - set work days - empty on the begining and fetched from DB (e.g.: [{ year: 2020, month: 10, day: 28 }, { year: 2020, month: 11, day: 4 }] -> month 0 - 11, day 1 - 31, NOTE: 0 is first month, month 12 will be 1 of next year, day 32 will be 1 next month)
    const [workDays, setWorkDays] = useState([])


    // STATE - set hours of day
    const [dayHours, setDayHours] = useState([])

    // STATE - set clicked day
    const [clickedDay, setClickedDay] = useState()


    // EFFECT - scroll to top when open tab
    // useEffect(() => {
    //     window.scrollTo(0, 0)
    // }, [])


    // EFFECT - get data from month collection according to state: displayedMonth
    useEffect(() => {

        // clear clickedDay when change month
        setClickedDay()

        // get days with added hours from DB 
        firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).get()
            .then(resp => {

                // clear list with all added days in this month fetched from DB
                addedDaysList = []

                // clear list with all added hours in day in this month fetched from DB
                addedHoursList = []

                // save data from DB in lists - all days and hours in month
                resp.forEach(doc => {

                    // if no data then not show (if doc exist in DB but has no data)
                    if (Object.keys(doc.data()).length === 0) {
                        return
                    }

                    // make list with all added days in this month
                    const yearMonth = displayedMonth.split('-')
                    const day = { year: parseInt(yearMonth[0]), month: parseInt(yearMonth[1]), day: parseInt(doc.id) }
                    addedDaysList.push(day)

                    // make list with all added hours in days in this month
                    const hoursValue = Object.keys(doc.data()).map(item => [item, doc.data()[item]]).sort() // change object {hour: availability} to array [hour, availability] and sort
                    const dayWithHours = { name: parseInt(doc.id), value: hoursValue }
                    addedHoursList.push(dayWithHours)
                })

                // save list of all added days in month to state
                setWorkDays(addedDaysList)
            })
            .catch(err => console.log('err', err))
    }, [displayedMonth])



    // EFFECT - call when click day according to state: clickedDay
    useEffect(() => {

        // if state clickedDay is null (first render) then return
        if (!clickedDay) {
            return
        }

        // clear hours list object to send to DB
        newHoursList = {}

        // get json object of day number and hours (from DB) only one clicked day 
        let clickedDayHours = addedHoursList.find(item => item.name === clickedDay)

        // check if clickedDayHours is undefined (if no data about this day is in DB)
        if (!clickedDayHours) {

            // set dafaultdWorkHoursList as finalWorkHoursList to state setDayHours
            setDayHours(dafaultdWorkHoursList)

            // create empty document in DB with clicked day for hours and clicked day for reservations, doc('2021-0') => year-month,  first month is 0
            firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${clickedDay}`).set({}) //set empty doc in DB: calendar/{year-month}/days/{clickedDay}
                .then(() => firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS_RESERVATION).doc(`${clickedDay}`).set({})) //set empty doc in DB: calendar/{year-month}/days_reservation/{clickedDay}
                .then(() => console.log('success set documents: ', CALENDAR, displayedMonth, DAYS, clickedDay)) // no response
                .catch(err => console.log('err', err))
            return

        } else {

            // get array of hours (from DB) only one clicked day 
            clickedDayHours = clickedDayHours.value
        }

        //add data from DB to dafaultdWorkHoursList 
        const finalWorkHoursList = dafaultdWorkHoursList.map(item => {

            // must copy element of array because is by reference
            let copiedArrayItem = [item[0], item[1], item[2]]

            // check if the same item is in array clickedDayHours
            for (let i = 0; i < clickedDayHours.length; i++) {
                const element = clickedDayHours[i];

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

        console.log("finalWorkHoursList: ", finalWorkHoursList);

        // set finalWorkHoursList to state
        setDayHours(finalWorkHoursList)

    }, [clickedDay])


    // call when displayed month change
    const handlerActiveDateChange = ({ activeStartDate, value, view }) => {

        // set state of visible year and month in code: "2020-10" like in DB => useEffect displayedMonth will start
        setDisplayedMonth(`${activeStartDate.getFullYear()}-${activeStartDate.getMonth()}`)

        // cleaer state of days
        setWorkDays([])

        // clear state of hours
        setDayHours([])
    }


    // function to add description to evey day, if is data in db then add "terminy" if not then add "pusto"
    const handlerTileContent = ({ date, view }) => {
        return (
            !workDays.some(disabledDateItem =>
                date.getFullYear() === disabledDateItem.year && date.getMonth() === disabledDateItem.month && date.getDate() === disabledDateItem.day)
                ? <p>pusto</p>
                : <p style={{ color: "rgba(0,200,0,1)", fontSize: "1rem", fontWeight: "bold" }}>terminy</p>
        )
    }


    // update list of available hours in DB
    const sendData = () => {
        firestore.collection(CALENDAR).doc(displayedMonth).collection(DAYS).doc(`${clickedDay}`).update(newHoursList)
            .then(() => console.log('success')) // no response
            .catch(err => console.log('err', err))
    }


    // add or delete hours from hours list object when check/uncheck
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

    return (
        <section className={style.background}>


            {/* header */}
            <h1 className={style.header}>Moduł: KALENDARZ - ADMIN</h1>
            <p className={style.desc}>System CMS służy do zarządzania kalendarzem. Edytowanie, usuwanie i dodawanie zawartości. Skontaktuj się z nami i uzyskaj dostęp.</p>


            {/* nav */}
            <nav className={style.nav}>
                <img className={style.nav_img} src={logo} alt='logo' />
                <div className={style.nav_item}>
                    <div className={style.nav_icon}>
                        <CalendarIcon />
                    </div>
                    <p className={style.nav_text}>Terminy</p>
                </div>
                <div className={style.nav_item}>
                    <div className={style.nav_icon}>
                        <PeopleIcon />
                    </div>
                    <p className={style.nav_text}>Klieńci</p>
                </div>
            </nav>


            {/* moduł ADMIN */}
            <div className={style.calendar}>


                <div className={style.calendar_container}>


                    {/* company description*/}
                    <div className={style.calendar_header}>
                        <img className={style.calendar_headerImg} src={logo} alt='logo' />
                        <p className={style.calendar_headerDesc}>Nazwa Firmy</p>
                    </div>

                    {/* choose date */}
                    <div className={style.calendar_date}>
                        <p className={style.calendar_dateDesc}>Wybierz datę i godzinę:</p>
                        <Calendar
                            defaultView="month"
                            maxDetail="month"
                            minDetail="month"
                            onActiveStartDateChange={handlerActiveDateChange}
                            onClickDay={(value, event) => setClickedDay(value.getDate())}
                            showFixedNumberOfWeeks={true}
                            tileContent={handlerTileContent} // add desc to day
                            tileDisabled={({ date }) => date.getMonth() !== parseInt(displayedMonth.split("-")[1])} // disable days in other months
                        />
                    </div>

                    {/* available days */}
                    {dayHours.length !== 0
                        && <div className={style.calendar_hours}>
                            <div className={style.calendar_hoursTop}>
                                <p className={style.calendar_hoursDesc}>Dodaj godziny:</p>
                                <button className={style.calendar_hoursButton} onClick={sendData}>Zapisz</button>
                            </div>
                            <div className={style.calendar_hoursList}>
                                {dayHours.map(item => {
                                    return (
                                        <div className={style.calendar_hoursListItem} key={`${clickedDay} ${item[0]}`}>
                                            <input className={style.calendar_hoursListItemInput} disabled={item[2] ? true : false} defaultChecked={false} onChange={hoursListhandler} type="checkbox" name={item[0]} value={item[0]} />
                                            <label className={style.calendar_hoursListItemLabel} htmlFor={item[0]}>{item[0]}</label>
                                            {item[2] && <p className={style.calendar_hoursListItemDesc}>{item[1] ? "Już dodano, nikt jeszcze się nie wpisał" : "Termin dodany i ZAREZERWOWANY."}</p>}
                                        </div>
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

export default Admin

