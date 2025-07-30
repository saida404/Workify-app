const pool = require('../db/db');

const getKonkursInfo = async (req, res) => {
    try {


        const konkursQuery = await pool.query(
            'SELECT id,naziv, naziv_firme, lokacija, pozicija, rok_prijave FROM konkurs WHERE rok_prijave >= CURRENT_DATE'
        );


        if (konkursQuery.rows.length === 0) {
            return res.status(404).render('error', { message: 'Konkursi nisu pronađeni' });
        }


        const konkursiFormatted = konkursQuery.rows.map(konkurs => {
            const formattedDate = new Date(konkurs.rok_prijave).toLocaleDateString('hr-HR');
            return { ...konkurs, rok_prijave: formattedDate };
        });

        res.render('konkursi', { konkursi: konkursiFormatted });

    } catch (err) {
        console.error(err.message);
        res.status(500).render('error', { message: 'Greška na serveru.' });
    }
};

const getKonkursDetails = async (req, res) => {
    const konkursId = req.params.id;
    const userId = req.user.id;

    console.log("Rute je poslan zahtjev za konkurs sa id-om:", konkursId);
    console.log("-----------------", userId);

    try {
        const konkursQuery = await pool.query(
            'SELECT id,naziv,naziv_firme,pozicija,strucna_sprema, opis_posla,lokacija,kvalifikacije, datum_objave, rok_prijave FROM konkurs WHERE id = $1',
            [konkursId]
        );

        if (konkursQuery.rows.length === 0) {
            return res.status(404).render('error', { message: 'Konkurs nije pronađen' });
        }

        const userQuery = await pool.query(
            'SELECT roll FROM korisnici WHERE id = $1',
            [userId]
        );
        const userRoll = userQuery.rows[0].roll;

        res.render('konkurs', { konkurs: konkursQuery.rows[0], userRoll: userRoll });
    } catch (err) {
        console.log('Greška pri dohvaćanju detalja o kokursu:', err.message);
        res.status(500).render('error', {
            message: 'Greška na serveru.',
            error: err
        });
    }
};


const getForma = async (req, res) => {
    const konkursId = req.params.id;
    const userId = req.user.id;

    console.log("Zahjtev poslao korisnik sa id-om",userId, "za konkurs id-om ", konkursId);


    try {
        const poljaQuery = await pool.query(
            'SELECT cv, motivacijsko_pismo, diploma FROM polja_forme WHERE konkurs_id = $1',
            [konkursId]
        );
       // console.log(" polja forme:", poljaQuery.rows);

        const korisnikQuery = await pool.query(
            'SELECT ime, prezime, email, strucna_sprema,roll,grad FROM korisnici WHERE id = $1',
            [userId]
        );


        const konkurs = await  pool.query(
            'SELECT naziv FROM konkurs WHERE id = $1', [konkursId]
        );

        console.log("naziv konkursa ", konkurs.rows[0].naziv);

        console.log("Rezultat korisnika:", korisnikQuery.rows);

        if (poljaQuery.rows.length === 0) {
            console.log("Nema podataka za konkurs sa ID:", konkursId);
            return res.status(404).render('error', { message: 'Konkurs nije pronađen' });
        }

        const { cv, motivacijsko_pismo, diploma } = poljaQuery.rows[0];
        const { ime, prezime, email, strucna_sprema,roll,grad } = korisnikQuery.rows[0];

        console.log("Prikazivanje forme sa podacima korisnika i konkursa...");
        res.render('forma_za_prijavu', {
            konkurs: konkurs.rows[0].naziv,
            id: konkursId,
            korisnik: {
                ime: ime,
                prezime: prezime,
                email: email,
                strucna_sprema: strucna_sprema,
                roll: roll,
                grad: grad
            },
            cv: cv,
            motivacijsko_pismo: motivacijsko_pismo,
            diploma: diploma
        });

    } catch (err) {
        console.error('Greška pri dohvaćanju detalja:', err);
        res.status(500).render('error', { message: 'Greška na serveru.' });
    }
};


const postPrijava = async (req, res) => {
    console.log("ruta za slanje prijave pozvana ");
   try {
       const konkurs_id = req.params.id;
       const korisnik_id = req.user.id;
       const{ime,prezime,email, strucna_sprema,grad,iskustvo, god_radno_iskustvo} = req.body;

       console.log("Korisnik id: ", korisnik_id, " konkurs id:  ", konkurs_id);

       const konkursQuery = await pool.query(
           'SELECT strucna_sprema, lokacija FROM konkurs WHERE id = $1',
           [konkurs_id]
       );
       const konkurs = konkursQuery.rows[0];

       let bodovi = 0;

       if (strucna_sprema === konkurs.strucna_sprema) {
           bodovi += 1;
       }

       if (grad === konkurs.lokacija) {
           bodovi += 1;
       }

       if (iskustvo) {
           bodovi += 1;
       }

       if (god_radno_iskustvo <= 2) {
           bodovi += 1;
       } else if (god_radno_iskustvo <= 5 && god_radno_iskustvo >= 2) {
           bodovi += 2;
       } else if (god_radno_iskustvo > 5) {
           bodovi +=3;
       }

       const cv = req.files['cv'] ? req.files['cv'][0].buffer : null;
       const motivacijsko_pismo = req.files['motivacijsko_pismo'] ? req.files['motivacijsko_pismo'][0].buffer : null;
       const certifikat = req.files['certifikat'] ? req.files['certifikat'][0].buffer : null;

       const prijavaQuery = await pool.query(
           'INSERT INTO prijava (konkurs_id, korisnik_id, ime, prezime, grad, cv, motivacijsko_pismo, certifikat, iskustvo, bodovi)'+
           ' VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10 )', [ konkurs_id, korisnik_id, ime, prezime, grad,
           cv, motivacijsko_pismo, certifikat, iskustvo || false, bodovi]);

       const korisnikKonkursQuerry = await  pool.query(
           'INSERT INTO korisnik_konkurs (konkurs_id,korisnik_id, status, bodovi) VALUES ($1,$2,$3, $4)',[konkurs_id,korisnik_id,'aktivno',bodovi]
       );

       res.status(200).redirect('/');
   } catch (err) {
       console.error('Greška prilikom prijave:', err);
       res.status(500).send('Došlo je do greške!');

   }
}

const searchKonkursi = async (req, res) => {
    const korisnik_id = req.user.id;
    try {
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const sort = req.query.sort || "naziv";
        const order = req.query.order || 'asc';

        const offset = page * limit;

        const userQuery = await pool.query('SELECT roll from korisnici WHERE id = $1', [korisnik_id]);

        const uloga = userQuery.rows[0].roll;

        //console.log("KORISNIK ULOGE:",uloga)


        const konkursiQuery =
            "SELECT k.id, k.naziv, k.naziv_firme, k.pozicija, k.strucna_sprema, k.lokacija " +
            "FROM konkurs k " +
            "WHERE k.naziv ILIKE $1 OR " +
            "k.naziv_firme ILIKE $1 OR " +
            "k.pozicija ILIKE $1 OR " +
            "k.strucna_sprema ILIKE $1 OR " +
            "k.lokacija ILIKE $1 " +
            "ORDER BY " + sort + " " + order + " " +
            "LIMIT $2 OFFSET $3";

        const totalQuery =
            "SELECT COUNT(*) AS total " +
            "FROM konkurs k " +
            "WHERE k.naziv ILIKE $1 OR " +
            "k.naziv_firme ILIKE $1 OR " +
            "k.pozicija ILIKE $1 OR " +
            "k.strucna_sprema ILIKE $1 OR " +
            "k.lokacija ILIKE $1";

        const values = [`%${search}%`, limit, offset];

        const konkursiResult = await pool.query(konkursiQuery, values);
        const totalResult = await pool.query(totalQuery, [`%${search}%`]);

        const response = {
            error: false,
            total: totalResult.rows[0].total,
            page: page + 1,
            limit,
            konkursi: konkursiResult.rows,
        };

        const total = totalResult.rows.length > 0 ? totalResult.rows[0].total : 0;
        const konkursi = konkursiResult.rows;

        //res.status(200).json(response);
        console.log("konkursiResult:", konkursiResult.rows);
        console.log("totalResult:", totalResult.rows);

        res.render('searchKonkursi', {
            konkursi:  konkursi,
            total: total,
            page: parseInt(page),
            limit: limit,
            sort: sort,
            order: order,
            search: search,
            uloga: uloga
        });
    } catch (err) {
        console.log(err, 'DOSLO JE DO GRESKE NA SEARH');
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
}

module.exports = { getKonkursInfo,getKonkursDetails, getForma, postPrijava,searchKonkursi };