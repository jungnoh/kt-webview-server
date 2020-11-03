require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const firebase = require('firebase-admin');
const morgan = require('morgan');
const fcmStore = require('./store');

const app = express();
const port = process.env.PORT || 3000;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('tiny'));

firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(process.env.FCM_CREDENTIALS)),
  databaseURL: `https://${process.env.FCM_DB}.firebaseio.com`
});

app.get('/', (req, res) => {
  const me = req.cookies.session;
  res.render('index', { me, noUser: false });
});

app.get('/login', (req, res) => {
  res.render('login', {error: false});
});

app.post('/login', (req, res) => {
  if (req.body.password !== '1234') {
    res.render('login', {error: true});
    return;
  }
  res.cookie('session', req.body.username);
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/');
});

app.post('/token', (req, res) => {
  const me = req.cookies.session;
  if (!me) {
    res.status(401).json({success: false});
    return;
  }
  if (!req.body.token) {
    res.status(400).json({success: false});
    return;
  }
  fcmStore.setToken(me, req.body.token);
  res.status(200).json({success: true});
});

app.post('/message', (req, res) => {
  const me = req.cookies.session;
  const {id, content, url} = req.body;

  const token = fcmStore.getToken(id);
  if (!token) {
    res.render('index', { me, noUser: true });
    return;
  }

  firebase.messaging().send({
    data: {
      message: content,
      title: `Message from ${me}`,
      url
    },
    token,
    apns: {
      payload: {
        aps: {
          alert: {
            body: content,
            title: `Message from ${me}`,
          },
          url
        },
      }
    }
  }).then(() => {
    res.render('index', { me, noUser: false });
  }).catch((err) => {
    console.error(err);
    res.status(500).json({success: false});
  });
});

app.listen(port, () => {
  console.log(`Listening at :${port}`);
});
