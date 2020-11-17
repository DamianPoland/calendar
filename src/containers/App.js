import './App.css';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'

// modules
import Nav from '../components/Nav/Nav'
import Home from '../components/Home/Home'
import Admin from '../components/Admin/Admin'
import Footer from '../components/Footer/Footer'
import PrivacyPolicy from '../components/PrivacyPolicy/PrivacyPolicy'

function App() {
  return (
    <BrowserRouter className="App">
      <Nav />
      <Switch>
        <Route path='/home' component={Home} />
        <Route path='/admin' component={Admin} />
        <Route path='/privacy-policy' component={PrivacyPolicy} />
        <Redirect to='/home' />
      </Switch>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
