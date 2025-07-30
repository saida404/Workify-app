var express = require('express');
var router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const pool = require("../db/db");


router.get('/', async function (req, res, next) {
  const token = req.cookies['jwt'];
  let userType = 'none';

  if (!token) {
    console.log('Nema tokena, korisnik je gost.');
    return res.render('landingpage', { userType });
  }

  console.log('Token je prisutan, pokušavamo verifikaciju...');
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      console.error('Greška pri verifikaciji tokena:', err.message);
      return res.status(403).json({ message: 'Greška pri verifikaciji tokena' });
    }

    console.log("Token verifikovan", decoded);
    const userId = decoded.id;

    try {
      console.log('Dohvaćanje uloge za korisnika sa ID-om:', userId);
      const result = await pool.query('SELECT roll FROM korisnici WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        console.error("Korisnik nije pronađen u bazi, ID:", userId);
        return res.status(404).json({ message: "Korisnik nije u bazi" });
      }

      const roll = result.rows[0].roll;
      console.log("Korisnik sa ID-om:", userId, "i ulogom:", roll);

      if (roll === 'admin') {
        userType = 'admin';
        console.log("Korisnik je administrator.");
        return res.render('landingpage', { userType });
      } else if (roll === 'korisnik') {
        userType = 'korisnik';
        console.log("Korisnik je običan korisnik.");
        return res.render('landingpage', { userType });
      } else {
        console.error("Nepoznata uloga korisnika:", roll);
        return res.status(400).json({ message: "Nepoznata uloga" });
      }
    } catch (dbError) {
      console.error('Greška prilikom dohvaćanja korisnika iz baze:', dbError.message);
      return res.status(500).json({ message: "Greška na serveru" });
    }
  });
});

router.get('/registration', function(req, res, next) {
  res.render('registration');
});


router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/send-message', async (req, res) => {
  const { ime, prezime, email, naslov, poruka } = req.body;

  console.log(req.body);

  if (!ime || !prezime || !email || !poruka ) {
    return res.status(400).json({ success: false, message: 'Sva polja su obavezna!' });
  }

  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'appworkify@gmail.com',
      pass: 'osnxskudkhxbjrpp'
    },
  });


  try {
    let info = await transporter.sendMail({
      from: email,
      to: 'appworkify@gmail.com',
      subject: `Upit od ${ime} ${prezime}: ${naslov}`,
      text: poruka,
      html: `
            <h3>${naslov}</h3>
            <p><strong>Ime i prezime:</strong> ${ime} ${prezime}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Poruka:</strong></p>
            <p>${poruka}</p>
        `
    });

    res.redirect('/?success=true');  } catch (err) {
    console.error('Greška pri slanju emaila:', err);
    res.status(500).json({ success: false, message: 'Došlo je do greške. Pokušajte ponovo.' });
  }
});

module.exports = router;
