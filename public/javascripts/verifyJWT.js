const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyJWT = (req, res, next) => {
    console.log('Kolačići dostupni u zahtjevu:', req.cookies);

    const token = req.cookies['jwt'];
    console.log('Dohvaćeni cookie jwt:', token);
    if (!token) {
        return res.status(401).json({ message: 'Token nije pružen' });
    }

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({message: 'Greška pri verifikaciji tokena '});
        } else {
            console.log("Token uspješno verifikovan:", decoded);

            req.user = { id: decoded.id, roll: decoded.roll };

            console.log('Korisnik sa ID-om:', req.user.id, 'i ulogom:', req.user.roll);
            next();
        }
    });



};

module.exports = {verifyJWT};
