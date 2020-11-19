import React, { useEffect } from 'react'
import style from './Admin.module.css'
import { firestore } from '../../shared/fire'
import { CALENDAR_TERMS, CALENDAR_USERS, DAYS, HOURS } from '../../shared/constans'


const Admin = () => {

    // scroll to top when open tab
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const sendData = () => {
        // with adjust key (func set make new doc or overwrite existing, func update not overwrite)
        // firestore.collection(CALENDAR_TERMS).doc('2021-00').collection(DAY).doc('04-08').set({ name: 'exName4', surName: 'exSurName4', email: "ex@ex.com4", desc: 'exDescription something4' })
        //     .then(() => console.log('success')) // no response
        //     .catch(err => console.log('err', err))

        // set available term, doc('2021-0') => year-month,  first month is 0
        firestore.collection(CALENDAR_TERMS).doc('2020-10').collection(DAYS).doc('26').update({ "18:00": false })
            .then(() => console.log('success')) // no response
            .catch(err => console.log('err', err))

    }

    return (
        <section className={style.background}>
            <button onClick={sendData}>send data</button>
        </section>
    )
}

export default Admin

