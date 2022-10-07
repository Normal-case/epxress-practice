const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended : true}))
app.use('/public', express.static('public'))

const methodOverride = require('method-override')
app.use(methodOverride('_method'))

const passport = require('passport')
const LocalStrategy = require('passport-local')
const session = require('express-session')

app.use(session({ secret : 'secret code', resave : true, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

var db
const MongoClient = require('mongodb').MongoClient

app.set('view engine', 'ejs')

MongoClient.connect('mongodb+srv://rozi:N5tCLmyfIytnmTQR@cluster0.zbansj1.mongodb.net/?retryWrites=true&w=majority', (error, client) => {

    if(error) {
        return console.log(error)
    }

    db = client.db('todoapp')

    app.listen(8080, () => {
        console.log('listening on 8080')
    })
})



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/write', (req, res) => {
    // res.sendFile(__dirname + '/write.ejs')
    res.render('write.ejs')
})

app.post('/add', (req, res) => {
    res.send('get message')
    db.collection('counter').findOne({name: 'postCount'}, (error, result) => {
        var totalPost = result.totalPost
        var postContents = { _id: totalPost + 1, title: req.body.title, date: req.body.date, author: req.user._id}
        db.collection('post').insertOne(postContents, () => {
            db.collection('counter').updateOne({name: 'postCount'}, { $inc: {totalPost: 1}}, (error, result) => {
                if(error) return console.log(error)
            })
        })

    })
})

app.get('/list', (req, res) => {

    db.collection('post').find().toArray((error, result) => {
        res.render('list.ejs', { posts: result })
    })
    
})

app.get('/edit/:id', (req, res) => {

    db.collection('post').findOne({_id: parseInt(req.params.id)}, (error, result) => {
        console.log(result)
        res.render('edit.ejs', { post : result })
    })
})

app.delete('/delete', (req, res) => {

    req.body._id = parseInt(req.body._id)

    var deleteContent = { _id: req.body._id, author: req.user._id }
    db.collection('post').deleteOne(deleteContent, (error, result) => {
        if(error) return console.log(error)

        res.status(200).send({message: 'success'})
    })
})

app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({_id: parseInt(req.params.id)}, (error, result) => {
        res.render('detail.ejs', { data : result})
    })
})

app.put('/edit', (req, res) => {
    db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set : { title: req.body.title, date: req.body.date} }, (error, result) => {
        console.log('update clear')
        res.redirect('/list')
    })
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), (req, res) => {
    res.redirect('/')
})

app.get('/profile', loginCheck, (req, res) => {
    console.log(req.user)
    res.render('profile.ejs', { user: req.user})
})

function loginCheck(req, res, next) {
    if(req.user){
        next()
    } else {
        res.send('should be login')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }))

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((username, done) => {

    db.collection('login').findOne({id : username}, (error, result) => {
        done(null, result)
    })
})

app.get('/search', (req, res) => {

    db.collection('post').find({ $text: { $search: req.query.value } }).toArray((error, result) => {
        console.log(result)
        res.render('search.ejs', { posts : result })
    })
})

app.post('/register', (req, res) => {
    db.collection('login').insertOne({ id : req.body.id, pw : req.body.pw }, (error, result) => {
        res.redirect('/')
    })
})