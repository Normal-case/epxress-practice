var router = require('express').Router()

router.get('/sports', function(req, res){
    res.send('sports')
 })
 
router.get('/game', function(req, res){
    res.send('game')
})

module.exports = router