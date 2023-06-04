const express = require('express');
const path = require('path')
const mysql = require('mysql')
const uplo = require('express-fileupload')
const node_mail = require('nodemailer')
const bodyParser = require('body-parser');
const exhand = require('express-handlebars');
const alert = require('alert')
const data = require('./data/datas')
const session = require('express-session')
const config = require('./config/confindential');
const { Cookie } = require('express-session');
var otp;
const bycrypt = require('bcrypt')


const port = 3000;
const app = express();

app.engine('handlebars', exhand.engine())
app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

app.use(session({
    secret: config.secret_key,
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + (30 * 86400 * 1000))

}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(uplo())


const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: config.data_password,
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
const transporter = node_mail.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: config.email_user,
        pass: config.emai_password
    }
})
// app.use((req, res, next) => {
//     if (req.session.user) {
//         res.render('index',{
//             my_user: req.session.user[0].first_name,
//             style: 'urs.css',
//             title: 'URS-Education Point'
//         })
//     }
//     else{
//         next()
//     }
// })
const sessionChecker = (req, res, next) => {
    if (req.session.user) {
        //    res.redirect('/gopal')
        res.render('index', {
            my_user: req.session.user[0].first_name,
            style: 'urs.css',
            title: 'URS-Education Point'
        })
    }
    else {
        next()
    }
}
app.get('/profile', (req, res) => {
    res.render('profile', {

        title: 'Profile',
        style: 'urs.css'
    })
})
app.get('/', sessionChecker, (req, res) => {
    // res.sendFile(path.join(__dirname, 'public/index.html'))
    res.sendFile(path.join(__dirname, 'public/index.html'))
})
app.get('/name', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})

app.get('/information', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/up.html'))
})
app.get('/sanjeev', (req, res) => {
    console.log(req.session.user)
    con.query(`update registered set is_verified = 1 where Email = '${req.session.user}'`, (err, result, feilds) => {
        if (err) {
            res.send("Email Not Verified")
        }
        else {
            req.session.destroy((err) => {
                res.redirect('/login')
            })
        }
    })
})
app.post('/uploadd', (req, res) => {
    if (req.files) {
        console.log(req.files)
        var file = req.files.files
        var filename = file.name
        console.log(filename)
        file.mv('./uploads/image/' + filename, (err) => {
            if (err) {
                res.send("File Uploading Unsucessfull")
            }
            else {
                con.query(`insert into image_upload(img_address) values('C:/Users/91875/OneDrive/Desktop/Express/uploads/image/${filename}')`)
                res.send("File Uploaded")
            }
        })
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        console.log("Logged Out")
        res.redirect('/login')
    })
})
app.get('/login', sessionChecker, (req, res) => {
    console.log(req.session.user)
    res.render('login',
        {
            //  msg:'This is working',
            style: 'login.css',
            title: 'login',
        })
})
app.post('/upload', (req, res) => {
    username = req.body.username
    passw = (req.body.password)
    console.log(passw)
    try {
        con.query(`select stu_id,Email,phone_no,password,first_name,is_verified from registered where Email = '${username}' `, (err, result, feilds) => {
            
            if (bycrypt.compareSync(passw, result[0].password) && result[0].is_verified == 1) {
               
                    req.session.user = result
                    console.log(req.session.user)
                    // req.session.authorized = true
                    res.render('index', {
                        my_user: result[0].first_name, 
                        style: 'urs.css',
                        title: 'URS-Education Point'
                    })
            }
            if (!bycrypt.compareSync(passw, result[0].password)){
                res.send("Wrong Password or Username ! Please Try Again")
            }
            if(username != result[0].Email){
                res.send("Wrong Password or Username ! Please Try Again")
            }
            if (result[0].is_verified != 1) {
                req.session.user = username
                const mailOptions = {
                    from: 'manojkumarsinghy20@gmail.com',
                    to: `${result[0].Email}`,
                    subject: 'This is demo mail send to your',
                    text: `Hello This is a random text and this is working by my express app`,
                    html: `<p> ${result[0].first_name} please <a href='http://127.0.0.1:3000/sanjeev'>Click here to verify</a> </p>`
                    // link:'http://www.google.com'
                };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        res.send("Something Went Wrong Please Try Again")
                    }
                    else {
                        console.log("Email send with response " + info.response)
                        res.send("This is wonderful !! <a href='https://mail.google.com/mail/u/0/#inbox'>Verify Your Gmail</a>")
                    }
                })
            }
            if(err){
                res.send("Error To hai pr pta nhi kha hai..tum dhundo isko")
            }
        })
    }

    catch { 
        res.send("This Will Happen")
    }
})
app.get('/register', sessionChecker, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/register.html'))
})

app.post('/change_password', (req, res) => {
    const opt = req.body.verify_code
    if (opt == otp) {
        res.sendFile(path.join(__dirname, 'public/change_pass.html'))
    }
    else {
        res.send("Wrong OTP please Try Again")
    }
})
app.post('/registration', (req, res) => {
    var first_name = req.body.first
    var last_name = req.body.last
    var mail = req.body.mails
    var phone = req.body.phone
    var pass = bycrypt.hashSync(req.body.pass, 10)
    var gender = req.body.gender
    var classes = req.body.classes
    var state = req.body.state
    var pin = req.body.pin
    req.session.user = mail
    console.log(mail)
    console.log(first_name)
    console.log(gender)
    con.query(`insert into registered (first_name,last_name,Email,phone_no,password,Gender,class,state,pincode) values('${first_name}','${last_name}','${mail}','${phone}','${pass}','${gender}','${classes}','${state}','${pin}');`, (err, result, feilds) => {
        if (err) {
            res.send('hello error yhi tha')
        }
        else {
            const mailOptions = {
                from: 'manojkumarsinghy20@gmail.com',
                to: `${mail}`,
                subject: 'This is demo mail send to your',
                text: `Hello This is a random text and this is working by my express app`,
                html: `<p> ${first_name} please <a href='http://127.0.0.1:3000/sanjeev'>Click here to verify</a> </p>`
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    res.send("You are Not verified please try again")
                }
                else {
                    console.log("Email send with response " + info.response)
                    res.send("This is wonderful !! <a href='https://mail.google.com/mail/u/0/#inbox'>Verify Your Gmail</a>")
                }
            })
        }
    })
})
app.get('/deactivate_page',(req,res)=>{
    res.sendFile(path.join(__dirname,'public/confirm.html'))
})
app.get('/uploads', (req, res) => {
    con.query('select img_address from image_upload where img_id=7;', (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log(result[0].img_address)
            res.render('profile', {
                imag: result[0].img_address
            })
        }
    })
})

app.post('/forgot_password', (req, res) => {
    var mail = req.body.phone_no
    req.session.user = mail
    otp = Math.floor(Math.random() * (10001 - 99999 + 1)) + 99999;
    const mailOptions = {
        from: 'manojkumarsinghy20@gmail.com',
        to: `${mail}`,
        subject: 'This is demo mail send to your',
        text: `Verification code for the new password is ${otp}`,
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            res.send("OTP not sent please try again")
        }
        else {
            console.log("Email send with response " + info.response)
            res.sendFile(path.join(__dirname, 'public/verify.html'))
        }
    })
})
app.post('/deactive',(req,res)=>{
    const passw= req.body.passwrd
    console.log(req.session.user[0].Email)
    if(bycrypt.compareSync(passw,req.session.user[0].password)){
        con.query(`delete from registered where Email= '${req.session.user[0].Email};'`,(err,result)=>{
            if(err){
                res.send("Sorry There is problem for deactivation your Account")
            }
            else{
                res.sendFile(path.join(__dirname,'public/register.html'))
            }
        })
    }
    else{
        res.send("Nhi chal rha ye to")
    }
})


app.post('/front_end',(req,res)=>{
    res.send("Hello This is also Working........")
})
app.post('/update_password', (req, res) => {
    // const email = req.body.Email
    const salt = bycrypt.genSaltSync(10)
    console.log(salt)
    const pass1 = bycrypt.hashSync(req.body.new_pass, salt)
    const pass2 = req.body.new_pass1
    console.log(req.session.user)
    con.query(`update registered set password = '${pass1}' where Email = '${req.session.user}';`, (err, result, feilds) => {
        if (err) {
            res.send(err)
        }
        else {
            alert("Password Updated Successfully")
            req.session.destroy((err) => {
                res.redirect('/login')
            })
        }
    })
})
app.get('/register/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/error.html'))
})
app.get('/gopal', (req, res) => {
    res.send("Hello Gopal Im working with you and you can lets me off")
})
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/error.html'))
})
app.listen(port, "127.0.0.1", () => {
    console.log(`This App is running on port http://127.0.0.1:${port}`)
})
