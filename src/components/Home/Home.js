import React, { useEffect, useState } from 'react'
import style from './Home.module.css'
import { firestore } from '../../shared/fire'
import { CALENDAR_TERMS, CALENDAR_USERS, DAYS, HOURS } from '../../shared/constans'

// calendar
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import './HomeCalendar.css'

// images
import logo from '../../assets/logo512.png'

// list of services
const services = [
    { id: 1, name: "Przegląd", price: '50' },
    { id: 2, name: "Założenie pnomby", price: '180-230' },
    { id: 3, name: "Wybielanie", price: '150' },
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

    // STATE - set service id
    const [displayedMonth, setDisplayedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth()}`) // show today year and month in code: "2020-10" like in DB

    // STATE - set enabled days (e.g.: [{year: 2020, month: 10, day: 28}, {year: 2020, month: 11, day: 4}] -> month 0-11 , day 1-31, NOTE: 0 is first month, month 12 will be 1 of next year, day 32 will be 1 next month)
    const [enabledDays, setEnabledDays] = useState([])

    // STATE - set hours of day
    const [dayHours, setDayHours] = useState([])

    // STATE - poup reservation, false or day number
    const [reservation, setReservation] = useState(false)



    // EFFECT - scroll to top when open tab
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // EFFECT - get data from month collection according to state: displayedMonth
    useEffect(() => {
        // get available days from DB
        firestore.collection(CALENDAR_TERMS).doc(displayedMonth).collection(DAYS).get() // get available days from DB 
            .then(resp => {

                // clear list with all available days in this month fetched from DB
                availableDaysList = []
                // clear list with all available hours in day in this month fetched from DB
                availableHoursList = []

                // save data from DB in lists - all days and hours in month
                resp.forEach(doc => {

                    // make list with all available days in this month
                    const yearMonth = displayedMonth.split('-')
                    const day = { year: parseInt(yearMonth[0]), month: parseInt(yearMonth[1]), day: parseInt(doc.id) }
                    availableDaysList.push(day)

                    // make list with all available hours in days in this month
                    const hoursValue = Object.keys(doc.data()).map(item => [item, doc.data()[item]]).sort() // change object {hour: availability} to array [hour, availability] and sort
                    const dayWithHours = { name: parseInt(doc.id), value: hoursValue }
                    console.log('dayWithHours: ', dayWithHours);
                    availableHoursList.push(dayWithHours)
                })
                setEnabledDays(availableDaysList) // save list of all days in month to state
                console.log('availableHoursList: ', availableHoursList);
            })
            .catch(err => console.log('err', err))
    }, [displayedMonth])




    // call when displayed month change
    const handlerActiveDateChange = ({ activeStartDate, value, view }) => {
        setDisplayedMonth(`${activeStartDate.getFullYear()}-${activeStartDate.getMonth()}`) // set state of visible year and month in code: "2020-10" like in DB
        setEnabledDays([]) // cleaer state of days
        setDayHours([]) // clear state of hours
    }

    // call when click day
    const handlerClickDay = (value, event) => {
        // set state of available and disable hours in clicked day
        const clickedDayHours = availableHoursList.find(item => item.name === value.getDate()).value
        setDayHours(clickedDayHours)
        clickedDay = value.getDate() // save clicked day for reservation
    }

    // function to enable/disable days, fuction call for every visible day in calendar and if return true than disabled day and if return false then enabled day
    const handlerTileDisabled = ({ date, view }) => {
        return (
            // disable all days and enable days from state
            !enabledDays.some(disabledDateItem =>
                date.getFullYear() === disabledDateItem.year && date.getMonth() === disabledDateItem.month && date.getDate() === disabledDateItem.day)
        )
    }


    return (
        <section className={style.background}>

            <h1 className={style.header}>Moduł: KALENDARZ</h1>
            <p className={style.desc}>Przykładowy modół kalendarza służy do rezerwowania terminów. Może służyć do rezerwacji stolików w restauracji, wizyty u specjalisty itp.</p>

            <div className={style.calendar}>
                <div className={style.calendar_container}>

                    {/* reservation popup*/}
                    {
                        reservation &&
                        <div className={style.calendar_reservation}>
                            <p className={style.calendar_reservationText}>Imie</p>
                            <p className={style.calendar_reservationText}>nazwisko</p>
                            <p className={style.calendar_reservationText}>{displayedMonth}</p>
                            <p className={style.calendar_reservationText}>{clickedDay}</p>
                            <p className={style.calendar_reservationText}>{reservation}</p>
                            <button className={style.calendar_reservationButton} onClick={() => setReservation(false)}>Cofnij</button>
                            <button className={style.calendar_reservationButton}>Rezerwuj</button>
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

