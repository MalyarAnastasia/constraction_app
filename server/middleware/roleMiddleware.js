module.exports = function(requiredRoles) { 
    return function (req, res, next) {
        try {
            if (!req.user || req.user.role === undefined) {
                return res.status(403).json({ message: "Ошибка роли: данные пользователя не найдены." });
            }

            const userRole = req.user.role;

            if (requiredRoles.includes(userRole)) {
                next(); 
            } else {
                return res.status(403).json({ message: 'У вас недостаточно прав для этого действия' });
            }

        } catch (err) {
            console.error('Ошибка при проверке роли:', err);
            return res.status(403).json({ message: 'Ошибка при проверке роли' });
        }
    }
}