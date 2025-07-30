const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../../db/db')
const verifyJWTadmin = (req,res,next) => {

    const token = req.cookies['jwt'];
    if(!token) {
        return res.status(401).json({message: 'Token nije pružen'});
    }

    jwt.verify(token,process.env.REFRESH_TOKEN_SECRET,async (err,decoded) => {
        if(err) {
            return res.status(403).json({message: 'Greška pri verifikaciji tokena'});
        } else {
            console.log("Token verifikovan", decoded);

            const userId = decoded.id;

           try {
               const result = await pool.query('SELECT roll FROM korisnici WHERE id = $1', [userId]);
               if(result.rows.length === 0) {
                   return res.status(404).json({mesagge: "Korsinik nije u bazi"});
               }

               const roll = result.rows[0].roll;
               console.log("Korisnik sa ID-om: ", userId, ' i ulogom ',roll);

               if (roll !== 'admin') {
                   return res.status(403).json({ message: "Pristup zabranjen, niste admin." });
               }

               req.user = { id: userId, roll: roll };
               next();

           } catch (err) {
               console.error('Greška pri upitu za korisnika:', err);
               return res.status(500).json({ message: 'Greška pri pristupu bazi' });
           }
        }
    });
};

module.exports = {verifyJWTadmin};