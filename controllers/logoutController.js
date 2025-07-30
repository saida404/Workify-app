const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../db/db');

const handleLogout = async (req, res) => {
    const refreshToken = req.cookies.jwt;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Nema prijavljenog korisnika.' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM korisnici WHERE refresh_token = $1', [refreshToken]);

        if (userCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Pogrešan refresh token.' });
        }

        const user = userCheck.rows[0];

        await pool.query('UPDATE korisnici SET refresh_token = $1 WHERE id = $2', [null, user.id]);
        console.log('Refresh token uklonjen iz baze.');

        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'Lax',
            secure: false,
            maxAge: 0,
        });
        console.log('Kolačić sa refresh tokenom uklonjen.');

        return res.redirect('/');
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Greška na serveru.' });
    }
};



module.exports = { handleLogout }