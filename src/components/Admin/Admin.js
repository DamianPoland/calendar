import React, { useEffect } from 'react'
import style from './Admin.module.css'


const Admin = () => {

    // scroll to top when open tab
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <section className={style.background}>
            Admin
        </section>
    )
}

export default Admin

