var router = require('express').Router()

const userAuthenticate = (req, res, next) => {
    if(req.user) {
        next()
    } else {
        res.send('should be login')
    }
}

router.use(userAuthenticate) // all of router use this middleware

router.get('/shirts', function(req, res){
    res.send('shirts')
 })
 
router.get('/pants', function(req, res){
    res.send('pants')
})

module.exports = router