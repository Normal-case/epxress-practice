const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended : true}))
app.use('/public', express.static('public'))

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
    res.sendFile(__dirname + '/write.html')
})

app.post('/add', (req, res) => {
    res.send('get message')
    db.collection('counter').findOne({name: 'postCount'}, (error, result) => {
        var totalPost = result.totalPost
        db.collection('post').insertOne({ _id: totalPost + 1, title: req.body.title, date: req.body.date}, () => {
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

app.delete('/delete', (req, res) => {

    req.body._id = parseInt(req.body._id)
    db.collection('post').deleteOne(req.body, (error, result) => {
        if(error) return console.log(error)

        res.status(200).send({message: 'success'})
    })
})

app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({_id: parseInt(req.params.id)}, (error, result) => {
        res.render('detail.ejs', { data : result})
    })
})