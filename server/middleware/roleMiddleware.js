require('dotenv').config();

module.exports = function(requiredRole){
    return function (req, res, next){

        try{

            const userRole = req.user.role;
        
        if(userRole === requiredRole){
            next ()
        } else {
            return res.status(403).json({
                massege:'У вас недостаточно прав ждя это действия'
            });
        }

        }catch(err){
            console.error('Ошибка при проверке роли', err);
            return res.status(403).json({
                message: 'Ошибка при проверке роли'
            })
        }
    }
}
