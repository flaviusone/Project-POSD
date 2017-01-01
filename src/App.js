import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import FlatButton from 'material-ui/FlatButton';
import AppBar from 'material-ui/AppBar';
import LoginForm from './LoginForm.js';
import Projects from './Projects.js';
import * as firebase from "firebase";
import { Tabs } from 'antd';
import _ from 'lodash';

const TabPane = Tabs.TabPane;

import './App.css';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCNNEa_v41Vmn9_JrWdjD-i08XXLBLIrfA",
  authDomain: "proiect-psd.firebaseapp.com",
  databaseURL: "https://proiect-psd.firebaseio.com",
  storageBucket: "proiect-psd.appspot.com",
  messagingSenderId: "535681694530"
};
firebase.initializeApp(config);

class App extends Component {
  constructor(props) {
    super(props);

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this._logoutCurrentUser = this._logoutCurrentUser.bind(this);

    this.state = {
      loggedIn: false,
      loggedUser: null,
      loggedUserId: null,
      loggedUserName: null
    }
  }

  componentDidMount() {
    const postsRef = firebase.database().ref('posts/');

    firebase.auth().onAuthStateChanged(firebaseUser => {
      let userEmail, userId, userName;

      if(firebaseUser) {
        userEmail = firebaseUser.email;
        userId = firebaseUser.uid;

        firebase.database().ref('/users/' + userId).once('value').then(
          (snapshot) => {
            userName = snapshot.val().username;

            this.setState({loggedUserName: userName})
          });

        postsRef.once('value', (snapshot) => {
          // Filter only owner's projects
          if(this.state.loggedIn) {
            const loggedUserProjects = _.filter(snapshot.val(), (project) => {
              return _.isEqual(project.ownerId, this.state.loggedUserId);
            })
            debugger;
            this.setState({
              loggedUserProjects
            })
          }
        });
      }
      this.setState({
        loggedIn: !!firebaseUser,
        loggedUser: userEmail || null,
        loggedUserId: userId || null,
        loggedUserName: userName || null
      })
    })

    postsRef.on('value', (snapshot) => {
      // Filter only owner's projects
      if(this.state.loggedIn) {
        const loggedUserProjects = _.filter(snapshot.val(), (project) => {
          return _.isEqual(project.ownerId, this.state.loggedUserId);
        })

        this.setState({
          loggedUserProjects
        })
      }
    });
  }

  render() {
    const {loggedIn, loggedUser} = this.state;

    return (
      <div className="app">
        <MuiThemeProvider>
          <AppBar
            title="Decont Proiecte Cercetare"
            iconElementLeft={loggedIn ? <div>User: {loggedUser}</div>
                                      : <div></div>}
            iconStyleLeft={{color: "white", fontSize: 16, position: "absolute",
                            top: 10, display: "inline-block"}}
            iconElementRight={
              loggedIn ? <FlatButton label="Logout"
                                     onClick={this._logoutCurrentUser} />
                       : null}
            iconStyleRight={{position: "absolute", right: 25}} />
        </MuiThemeProvider>

        {!this.state.loggedIn ? this._renderLoginForm()
                              : this._renderTabs()}
      </div>
    );
  }

  onFormSubmit(values) {
    if(values && values.register) {
      this._registerNewUser(values);
    } else {
      this._loginUser(values);
    }
  }

  _registerNewUser(values) {
    const {email, password, name} = values;

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((firebaseUser) => {
        const {email, uid} = firebaseUser;

        firebase.database().ref('users/' + uid).set({
          username: name,
          email: email,
        });
      })
      .catch(
        function(error) {
          alert(error.message);
      });
  }

  _logoutCurrentUser() {
    firebase.auth().signOut().then(() => {}, (error) => {
      alert(error.message);
    });
  }

  _loginUser(values) {
    const {email, password} = values;

    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(
        function(error) {
          alert(error.message);
      });
  }

  _renderLoginForm() {
    return <LoginForm className='login-form' onFormSubmit={this.onFormSubmit}/>;
  }

  _renderTabs() {
    return <Tabs defaultActiveKey="1">
      <TabPane tab="Proiecte" key="1">{this._renderProjects()}</TabPane>
      <TabPane tab="Ordine cerute" key="2">Content of Tab Pane 2</TabPane>
    </Tabs>
  }

  _renderProjects() {
    const {loggedUserId, loggedUserName, loggedUserProjects} = this.state;
    return <Projects userId={loggedUserId} userName={loggedUserName}
                     projects={loggedUserProjects}/>;
  }
}

export default App;
