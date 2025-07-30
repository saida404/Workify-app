const bcrypt = require('bcrypt');
const pool = require('../db/db');

const handleNewUser = async (req, res) => {
    console.log(req.body);
    const {ime,prezime,email,username,password, confirmPassword, grad, strucna_sprema, god_radno_iskustvo} = req.body;

    if (!ime || !prezime || !email || !username || !password || !confirmPassword || !strucna_sprema || !god_radno_iskustvo) {
        return res.status(400).json({'message': 'Sva polja su obavezna.'});
    }

    if(password !== confirmPassword) {
        return res.status(400).json({'message': 'Lozinke se ne podudaraju.'});
    }

    try {
        const emailCheck = await pool.query('SELECT * FROM korisnici WHERE email = $1', [email]);
        if(emailCheck.rows.length > 0) {
            return res.status(409).json({'message': 'Email već postoji.'});
        }

        const usernameCheck = await pool.query('SELECT * FROM korisnici WHERE username = $1', [username]);
        if(usernameCheck.rows.length > 0) {
            return res.status(409).json({message: 'Korisničko ime je zauzeto.'});
        }

        const hashedPwd = await bcrypt.hash(password,10);

        const result = await pool.query(
            'INSERT INTO korisnici (ime, prezime, email, username, password, grad, strucna_sprema, god_radno_iskustvo) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [ime, prezime, email, username, hashedPwd, grad, strucna_sprema, god_radno_iskustvo]
        );

        res.status(201).json({ success: 'Uspešna registracija. Molimo prijavite se.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({'message': 'Greška na serveru'});
    }
}


module.exports = { handleNewUser };
