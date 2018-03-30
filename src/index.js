import React from 'react';
import ReactDOM from 'react-dom';
import AppContainer from './App';
import TaskList from './components/TaskList.jsx';
import app from './reducers/index.js';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import './index.css';

let store = createStore(app);
console.log(browserHistory);

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path='/' component={AppContainer}>
      </Route>
      <Route path='/taskList' component={TaskList}></Route>
    </Router>
  </Provider>,
  document.getElementById('root')
);