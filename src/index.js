import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Previewer from './previewer';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<Previewer />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
