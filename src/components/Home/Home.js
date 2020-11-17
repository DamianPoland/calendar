import React, { useEffect, useState } from 'react'
import style from './Home.module.css'


const Home = () => {

    // scroll to top when open tab
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])



    return (
        <section className={style.background}>

            Reservation
        </section>
    )
}

export default Home

