import React, { useState, useEffect } from 'react'
import './App.css';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import { auth } from '../shared/fire'

// modules
import Nav from '../components/Nav/Nav'
import Home from '../components/Home/Home'
import Admin from '../components/Admin/Admin'
import Footer from '../components/Footer/Footer'
import PrivacyPolicy from '../components/PrivacyPolicy/PrivacyPolicy'
import AlertPrivacy from '../UI/AlertPrivacy/AlertPrivacy'

function App() {


  // ----------------------- START LOGIN --------------------------//
  const [isLogin, setIsLogin] = useState(false)
  useEffect(() => {
    auth.onAuthStateChanged(user => {
      user ? setIsLogin(true) : setIsLogin(false)

      if (user) {
        user.getIdTokenResult()
        // .then(token => console.log("admin: ", token.claims.admin))
      }

    })
  }, [])
  // ----------------------- END LOGIN --------------------------//



  return (
    <BrowserRouter className="App">
      <Nav />
      <Switch>
        <Route path='/home' component={Home} />
        <Route path='/admin' render={props => <Admin {...props} isLogin={isLogin} />} />
        <Route path='/privacy-policy' component={PrivacyPolicy} />
        <Redirect to='/home' />
      </Switch>
      <AlertPrivacy />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
