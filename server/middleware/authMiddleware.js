require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next){
    if (req.method === "OPTIONS") {
        next()
    };
    
    try{
        const token = req.headers.authorization.split(' ')[1];
        if(!token){
            return res.status(401).json({
                massege:'Ошибка авторизации (токен отсутствует)'
            })
        };

        const secret = process.env.JWT_SECRET;
        const DecotedData = jwt.verify(token, secret);
        req.user = DecotedData;
        next();

    }catch(err){
        console.error('Ошибка аторизации (токен)', err);
        return res.status(403).json({
            massege: 'Ошибка авторизации (токен недействителен)'
        })
    }
};