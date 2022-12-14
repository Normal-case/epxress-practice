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
app.use('/shop', require('./routes/shop.js'))
app.use('/board/sub', require('./routes/board.js'))

const { ObjectId } = require('mongodb')

let multer = require('multer')
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/image')
    },
    filename : (req, file, cb) => {
        cb(null, file.originalname)
    }
})

var upload = multer({ storage : storage })

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
  }, function (inputId, inputPassword, done) {
    //console.log(inputId, inputPassword);
    db.collection('login').findOne({ id: inputId }, function (error, result) {
      if (error) return done(error)
  
      if (!result) return done(null, false, { message: 'Invalid ID' })
      if (inputPassword == result.pw) {
        return done(null, result)
      } else {
        return done(null, false, { message: 'Invalid Password' })
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

app.get('/upload', (req, res) => {
    res.render('upload.ejs')
})

app.post('/upload', upload.single('profile'), (req, res) => {
    res.send('upload complete')
})

app.get('/image/:imageName', (req, res) => {
    res.sendFile( __dirname + '/public/image/' + req.params.imageName )
})

app.post('/chatroom', loginCheck, (req, res) => {

    var saveData = {
        title: 'chat room',
        member: [ObjectId(req.body.authorId), req.user._id],
        date: new Date()
    }

    db.collection('chatroom').insertOne(saveData).then((result) => {
        res.send('success')
    })
})

app.get('/chat', loginCheck, (req, res) => {

    db.collection('chatroom').find( { member: req.user._id }).toArray().then((result) => {
        res.render('chat.ejs', { data : result})
    })
    
})

app.post('/message', loginCheck, (req, res) => {

    var saveData = {
        parent: req.body.parent,
        content: req.body.content,
        userid: req.user._id,
        data: new Date()
    }

    db.collection('message').insertOne(saveData).then(() => {
        console.log('db save success')
        res.send('db save success')
    })
})


app.get('/message/:id', loginCheck, (req, res) => {

    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    });

    db.collection('message').find({ parent : req.params.id }).toArray().then((result) => {
        res.write('event: test\n')
        res.write('data: ' + JSON.stringify(result) + '\n\n')
    })

    const pipeline = [
        { $match: { 'fullDocument.parent' : req.params.id } }
    ]
    const collection = db.collection('message')
    const changeStream = collection.watch(pipeline)
    changeStream.on('change', (result) => {
        res.write('event: test\n')
        res.write('data: ' + JSON.stringify([result.fullDocument]) + '\n\n')
    })
    
})