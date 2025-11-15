require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }

    try {
        const token = req.headers.authorization.split(' ')[1]; 

        if (!token) {
            return res.status(401).json({ message: "Ошибка авторизации (Токен отсутствует)" });
        }

        const secret = process.env.JWT_SECRET;
        const decodedData = jwt.verify(token, secret);

        req.user = decodedData;
        next(); 

    } catch (e) {
        console.error('Ошибка верификации токена:', e.message);
        return res.status(403).json({ message: "Ошибка авторизации (Токен недействителен или истек)" });
    }
};