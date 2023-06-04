const express = require('express');
const path = require('path')
const mysql = require('mysql')
const mail = require('nodemailer')
const uploader = require('express-fileuploader')
const exhand = require('express-handlebars')
const mutilpart = require('connect-multiparty')

const blog = require('../Express/data/datas');
const { request } = require('express');
const port = 8000;
const app = express();
let otp;
request
// console.log(otp)
app.engine('handlebars', exhand.engine())
app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/upload/image', mutilpart());
uploader.use(new uploader.LocalStrategy({
    uploadPath: '/uploads',
    baseUrl: 'http://localhost:8000/uploads/'
}));
// app.use(exhand())
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@#Sanjukumar123',
    database: 'profile'
})
con.connect((err) => {
    if (err) {
        console.log(err)
    }
    else {
        console.log('connected')
    }
})
var transporter = m = mail.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'manojkumarsinghy20@gmail.com',
        pass: 'ryjkmvqagolvmrkd'
    }
})

app.get('/', (req, res) => {
    res.send("Hello World")
})
app.get('/name', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})
app.get('/sanjeev', (req, res) => {
    res.render('home', {
        name: 'my name is sanjeev'
    })
})
app.post('/user_otp', (req, res) => {
    otp = Math.floor(Math.random() * (10001 - 99999 + 1)) + 99999;
    var mailOptions = {
        from: 'manojkumarsinghy20@gmail.com',
        to: 'sk2747267@gmail.com',
        subject: 'This is demo mail send to your',
        text: `Hello This is a random text and the otp is  ${otp}`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log('Youe Email is send with response ' + info.response)
        }
    })
    res.sendFile(path.join(__dirname, 'public/otp.html'))
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/log.html'))
})
app.post('/upload', (req, res) => {
    username = req.body.username
    passw = req.body.password

    con.query(`select phone_no,password,first_name from registered where phone_no=${username} and password='${passw}';`, (err, result, feilds) => {

        if (err) {
            res.send('wrong')
        }
        else {
            console.log(result)
            // res.send(`Hello ${result[0].first_name}`)
            res.render('index', {
                style:'urs.css',
                my_user: result[0].first_name
            })
        }
    })

    // res.send("data Recieved!!")
})
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/register.html'))
})

app.post('/registration', (req, res) => {

    const first_name = req.body.first
    const last_name = req.body.last
    const mail = req.body.mail
    const phone = req.body.phone
    const pass = req.body.pass
    const gender = req.body.gender
    const classes = req.body.classes
    const state = req.body.state
    const pin = req.body.pin
    const opt = req.body.OTPS

    // if(opt==otp){
    //     // con.query(`insert into registered (first_name,last_name,Email,phone_no,password,Gender,class,state,pincode) values('${first_name}','${last_name}','${mail}','${phone}','${pass}','${gender}','${classes}','${state}','${pin}');`, (err, result, feilds) => {
    //     //     if (err) {
    //     //         console.log(err)
    //     //     }
    //     //     else {
    //     //         res.send("This is wonderful")
    //     //     }
    //     // })
    //     res.send('Successfull')
    // }
    // else{
    //     res.send("Wrong OTP")
    // }
    if (opt == otp) {
        res.send("This is working")
    }
    else {
        res.send("This Is Working But not working")
    }
})
app.get('/uploads', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/uploading.html'))
})
app.post('/fileupload', (req, res) => {
    if (req.files) {
        console.log(req.files)
    }
})
app.get('/register/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/error.html'))
})
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/error.html'))
})
app.listen(port, () => {
    console.log(`This App is running on port http://localhost:${port}`)
})

