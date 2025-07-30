const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../db/db');


const handleLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Korisničko ime i lozinka su obavezni.' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM korisnici WHERE username = $1', [username]);

        if (userCheck.rows.length === 0) {
            return res.status(401).json({ message: 'Neispravno korisničko ime.' });
        }

        const user = userCheck.rows[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: 'Neispravna lozinka.' });
        }

        const accessTokenPayload = {
            UserInfo: {
                id: user.id,
                username: user.username,
                roll: user.roll,
            },
        };

        console.log('Payload access token-a:----------', accessTokenPayload);


        const accessToken = jwt.sign(
            {
                UserInfo: {
                    id: user.id,
                    username: user.username,
                    roll: user.roll,
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        await pool.query('UPDATE korisnici SET refresh_token = $1 WHERE username = $2', [refreshToken, username]);
        console.log("UPISAN REFRESH U BAZU");
        console.log("ACCES TOOKEN ", accessToken);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
        });
        //console.log("Tajni ključ za generisanje tokena:", process.env.ACCESS_TOKEN_SECRET);




        return res.status(200).json({
            message: 'Prijava uspješna!',
            accessToken
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Greška na serveru.' });
    }
};

module.exports = { handleLogin };
