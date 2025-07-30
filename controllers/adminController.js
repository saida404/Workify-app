const pool = require('../db/db');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const nodemailer = require('nodemailer');


const getAdminInfo = async (req,res) => {
    try {
        const userdId = req.user.id;

        const userQuery = await pool.query(
            'SELECT id, ime, prezime, username, email FROM korisnici where id = $1', [userdId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).render('errorPage', { message: 'Korisnik nije pronađen.' });
        }

        const user = userQuery.rows[0];

        res.render('adminPage', { user });


    } catch (err) {
        console.error(err.message);
        res.status(500).render('errorPage', { message: 'Greška na serveru.' });
    }
}

const getKorisnici = async (req, res) => {
    try {
        const korisniciQuery = await pool.query(
            'SELECT k.id, k.ime, k.prezime, k.username, k.grad, k.strucna_sprema, ' +
            'COUNT(kk.korisnik_id) AS broj_prijavljenih_konkursa ' +
            'FROM korisnici k ' +
            'LEFT JOIN korisnik_konkurs kk ON k.id = kk.korisnik_id ' +
            'GROUP BY k.id'
        );

        if (korisniciQuery.rows.length === 0) {
            return res.status(404).render('errorPage', { message: 'Nema korisnika u bazi.' });
        }
        console.log(korisniciQuery.rows);
        res.render('adminKorisnici', { korisnici: korisniciQuery.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('errorPage', { message: 'Greška na serveru.' });
    }
};

const getKorisnikInfo = async (req, res) => {
    try {
        const korisnikId = req.params.id;

        const userQuery = await pool.query(
            'SELECT id, ime, prezime, username, email, grad, roll, obrazovanje, biografija, radno_iskustvo, strucna_sprema, god_radno_iskustvo FROM korisnici WHERE id = $1',
            [korisnikId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).render('errorPage', { message: 'Korisnik nije pronađen.' });
        }

        const user = userQuery.rows[0];

        const cvQuery = await pool.query(
            'SELECT file_name FROM cv WHERE korisnik_id = $1 ORDER BY id DESC LIMIT 1',
            [korisnikId]
        );

        const cv = cvQuery.rows.length > 0 ? cvQuery.rows[0].file_name : null;

        console.log("KORISNIK I CV", cv)

        const activeJobsQuery = await pool.query(
            'SELECT k.id, k.naziv, k.naziv_firme, k.pozicija, k.datum_objave , kk.status FROM konkurs k ' +
            'JOIN korisnik_konkurs kk ON k.id = kk.konkurs_id WHERE kk.korisnik_id = $1 AND kk.status IN ($2, $3, $4)',
            [korisnikId, 'aktivno', 'uži krug', 'intervju']
        );

        const archivedJobsQuery = await pool.query(
            'SELECT k.id, k.naziv, k.naziv_firme, k.pozicija, k.datum_objave,  kk.status FROM konkurs k ' +
            'JOIN korisnik_konkurs kk ON k.id = kk.konkurs_id WHERE kk.korisnik_id = $1 AND kk.status IN ($2, $3)',
            [korisnikId, 'zavrseno', 'odbijeno']
        );

        const komentariQuery = await pool.query(
            'SELECT id, komentar, datum FROM komentari WHERE korisnik_id = $1 ORDER BY datum DESC',
            [korisnikId]
        );

        const komentari = komentariQuery.rows;

        res.render('adminKorisnik', {
            title: "KORISNIK",
            user: {
                id: user.id,
                ime: user.ime,
                prezime: user.prezime,
                username: user.username,
                email: user.email,
                grad: user.grad,
                zvanje: user.zvanje,
                god_radno_iskustvo:  user.god_radno_iskustvo,
                strucna_sprema: user.strucna_sprema,
                uloga: user.roll || "Korisnik",
                obrazovanje: user.obrazovanje || "Nema podataka",
                biografija: user.biografija || "Nema podataka",
                radno_iskustvo: user.radno_iskustvo || "Nema podataka"
            },
            activeJobs: activeJobsQuery.rows,
            archivedJobs: archivedJobsQuery.rows,
            cv: cv,
            comments: komentari
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('errorPage', { message: 'Greška na serveru.' });
    }
};


const formatirajDatum = (datum) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(datum).toLocaleDateString('bs-BA', options);
};


const getKonkursi = async (req, res) => {
    try {
        const aktivniKonkursiQuery = await pool.query(
            'SELECT id, naziv, naziv_firme, lokacija, pozicija, rok_prijave FROM konkurs WHERE rok_prijave >= CURRENT_DATE'
        );

        const arhiviraniKonkursiQuery = await pool.query(
            'SELECT id, naziv, naziv_firme, lokacija, pozicija, rok_prijave FROM konkurs WHERE rok_prijave < CURRENT_DATE'
        );

        const aktivniKonkursi = aktivniKonkursiQuery.rows.map(konkurs => ({
            ...konkurs,
            rok_prijave: formatirajDatum(konkurs.rok_prijave)
        }));

        const arhiviraniKonkursi = arhiviraniKonkursiQuery.rows.map(konkurs => ({
            ...konkurs,
            rok_prijave: formatirajDatum(konkurs.rok_prijave)
        }));

        res.render('adminKonkursi', {
            aktivniKonkursi,
            arhiviraniKonkursi
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).render('error', { message: 'Greška na serveru.' });
    }
};

const deleteKonkurs = async (req, res) => {
    const { id } = req.params;

    try {
        const konkursExists = await pool.query('SELECT * FROM konkurs WHERE id = $1', [id]);

        if (konkursExists.rows.length === 0) {
            return res.status(404).json({ message: 'Konkurs nije pronađen' });
        }

        await pool.query('DELETE FROM konkurs WHERE id = $1', [id]);

        res.status(200).json({ message: 'Konkurs uspešno obrisan' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška pri brisanju konkursa.' });
    }
};


const getEvents = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events');
        console.log('Događaji su uspešno preuzeti:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Greška pri dobijanju događaja:', err);
        res.status(500).json({ error: 'Greška pri dobijanju događaja' });
    }
};

const addEvents = async (req, res) => {
    const { title, start, end, description, location } = req.body;
    console.log('POST /events: Dodavanje novog događaja');
    console.log('Podaci za novi događaj:', { title, start, end, description, location });

    try {
        const result = await pool.query(
            'INSERT INTO events (title, start, endTime, description, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, start, end, description, location]
        );
        console.log('Novi događaj uspešno dodat:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Greška pri dodavanju događaja:', err);
        res.status(500).json({ error: 'Greška pri dodavanju događaja' });
    }
};



const deleteEvents = async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /events/${id}: Brisanje događaja sa ID-jem ${id}`);

    try {
        const result = await pool.query('DELETE FROM events WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            console.warn(`Događaj sa ID-jem ${id} nije pronađen za brisanje`);
            return res.status(404).json({ error: 'Događaj nije pronađen' });
        }
        console.log(`Događaj sa ID-jem ${id} uspešno obrisan`);
        res.json({ message: 'Događaj je obrisan' });
    } catch (err) {
        console.error(`Greška pri brisanju događaja sa ID-jem ${id}:`, err);
        res.status(500).json({ error: 'Greška pri brisanju događaja' });
    }
};



const addKonkurs = async (req, res) => {
    const {
        naziv,
        naziv_firme,
        pozicija,
        strucna_sprema,
        opis_posla,
        lokacija,
        rok_prijave,
        kvalifikacije,
        tip_zaposljenja,
        cv_obavezno,
        motivacijsko_pismo_obavezno,
        diploma_obavezno
    } = req.body;

    const cv = cv_obavezno ? true : false;
    const motivacijsko_pismo = motivacijsko_pismo_obavezno ? true : false;
    const diploma = diploma_obavezno ? true : false;


    try {
        const result = await pool.query(
            'INSERT INTO konkurs (naziv, naziv_firme, pozicija, strucna_sprema, opis_posla, lokacija, rok_prijave, kvalifikacije, tip_zaposljenja) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
            [naziv, naziv_firme, pozicija, strucna_sprema, opis_posla, lokacija, rok_prijave, kvalifikacije, tip_zaposljenja]
        );

        const konkursId = result.rows[0].id;

        await pool.query(
            'INSERT INTO polja_forme (konkurs_id, cv, motivacijsko_pismo, diploma) VALUES ($1, $2, $3, $4)',
            [konkursId, cv, motivacijsko_pismo, diploma]
        );

        res.status(201).json({ message: 'Konkurs kreiran i obavezni dokumenti postavljeni.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Greška prilikom kreiranja konkursa.' });
    }
};


const getPrijave = async (req, res) => {
    try {
        const konkursId = req.params.id;

        console.log("RUTA PRIJAVA SA ID ", konkursId);

        const prijaveQuery = await pool.query(
            `SELECT id, konkurs_id, korisnik_id, ime, prezime, grad, cv, motivacijsko_pismo, certifikat, iskustvo 
             FROM prijava 
             WHERE konkurs_id = $1 `,
            [konkursId]
        );

        const poljaQuery = await pool.query(
            `SELECT cv, motivacijsko_pismo, diploma 
             FROM polja_forme 
             WHERE konkurs_id = $1`,
            [konkursId]
        );



        if (poljaQuery.rows.length === 0) {
            return res.status(404).json({ message: 'polja  nisu definisana za dati konkurs.'});
        }

        const korisnikIds = prijaveQuery.rows.map(prijava => prijava.korisnik_id);

        console.log("id korisnika: ", korisnikIds);

        const bodoviMap = {};
        for (let korisnikId of korisnikIds) {
            const bodoviQuery = await pool.query(
                `SELECT bodovi FROM korisnik_konkurs WHERE korisnik_id = $1 AND konkurs_id = $2`,
                [korisnikId, konkursId]
            );

            if (bodoviQuery.rows.length > 0) {
                bodoviMap[korisnikId] = bodoviQuery.rows[0].bodovi;
            } else {
                bodoviMap[korisnikId] = 0;
            }
        }

        console.log("bodovi korisnika", bodoviMap)



        const polja = poljaQuery.rows[0];

        console.log("PRIJAVA IMA POLJA: ", polja);

        const prijave = prijaveQuery.rows.map(prijava => {
            const bodovi = bodoviMap[prijava.korisnik_id];
            return {
                id: prijava.id,
                ime: prijava.ime,
                prezime: prijava.prezime,
                grad: prijava.grad,
                iskustvo: prijava.iskustvo,
                korisnik_id: prijava.korisnik_id,
                bodovi: bodovi,
                ...(polja.cv && { cv: prijava.cv }),
                ...(polja.motivacijsko_pismo && { motivacijsko_pismo: prijava.motivacijsko_pismo }),
                ...(polja.diploma && { certifikat: prijava.certifikat })
            };
        });

        console.log("PRIJAVEEE ",prijave);

        res.render('adminPrijave', { prijave: prijave.length > 0 ? prijave : [] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};


const downloadMotivacjisko = async (req, res) => {
    try {
        const prijavaId = req.params.id;

        const result = await pool.query(
            `SELECT motivacijsko_pismo, ime, prezime FROM prijava WHERE id = $1`,
            [prijavaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Motivacijsko pismo nije pronađeno.' });
        }

        const { motivacijsko_pismo: fileBuffer, ime, prezime } = result.rows[0];

        const prilagodjenoIme = encodeURIComponent(ime);
        const prilagodjenoPrezime = encodeURIComponent(prezime);

        const fileName = `motivacijsko_pismo_${prilagodjenoIme}_${prilagodjenoPrezime}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);


        res.send(fileBuffer);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};

const downloadCV = async (req, res) => {
    try {
        const CVId = req.params.id;

        const result = await pool.query(
            `SELECT cv, ime, prezime FROM prijava WHERE id = $1`,
            [CVId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cv  nije pronađen' });
        }

        const { cv: fileBuffer, ime, prezime } = result.rows[0];

        const prilagodjenoIme = encodeURIComponent(ime);
        const prilagodjenoPrezime = encodeURIComponent(prezime);

        const fileName = `cv_${prilagodjenoIme}_${prilagodjenoPrezime}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);


        res.send(fileBuffer);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};


const generateChart = async (data, labels) => {
    const width = 400;
    const height = 300;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Broj prijava',
                data: data,
                backgroundColor: ['rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(54, 162, 235, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };


    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
};

const getStatistika = async (req, res) => {
    try {
        const konkursiQuery = await pool.query('SELECT * FROM konkurs');

        if (konkursiQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Nema konkursa u bazi.' });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="statistika_konkursa.pdf"');
        doc.pipe(res);

        doc.fontSize(18).text('Statistika o Konkursima', { align: 'center' });
        doc.moveDown();

        for (let konkurs of konkursiQuery.rows) {
            const konkursId = konkurs.id;

            const prijaveQuery = await pool.query(
                `SELECT COUNT(*) AS broj_prijava 
                 FROM prijava 
                 WHERE konkurs_id = $1`,
                [konkursId]
            );

            const brojPrijava = prijaveQuery.rows[0].broj_prijava;

            const cvQuery = await pool.query(
                `SELECT COUNT(*) AS broj_prijava_cv 
                 FROM prijava 
                 WHERE konkurs_id = $1 AND cv IS NOT NULL`,
                [konkursId]
            );

            const motivacijskoQuery = await pool.query(
                `SELECT COUNT(*) AS broj_prijava_motivacijsko 
                 FROM prijava 
                 WHERE konkurs_id = $1 AND motivacijsko_pismo IS NOT NULL`,
                [konkursId]
            );

            const brojPrijavaCV = cvQuery.rows[0].broj_prijava_cv;
            const brojPrijavaMotivacijsko = motivacijskoQuery.rows[0].broj_prijava_motivacijsko;

            doc.fontSize(14).text(`Konkurs: ${konkurs.naziv}`, { underline: true });
            doc.text(`Broj prijava: ${brojPrijava}`);
            doc.text(`Broj prijava sa CV-om: ${brojPrijavaCV}`);
            doc.text(`Broj prijava sa motivacijskim pismom: ${brojPrijavaMotivacijsko}`);
            doc.moveDown();

            const chartData = [brojPrijava, brojPrijavaCV, brojPrijavaMotivacijsko];
            const chartLabels = ['Sve prijave', 'Prijave sa CV-om', 'Prijave sa motivacijskim pismom'];
            const chartBuffer = await generateChart(chartData, chartLabels);

            doc.image(chartBuffer, { fit: [500, 300], align: 'center' });
            doc.addPage();
        }


        doc.end();
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};



const sendIntervju = async (req, res) => {
    console.log("POSLANA RUTA INDERVJU")
    const korisnikId = req.params.id;
    const { interviewDate } = req.body;

    try {
        const result = await pool.query('SELECT email FROM korisnici WHERE id = $1', [korisnikId]);

        if (result.rows.length === 0) {
            throw new Error('Korisnik nije pronađen.');
        }

        const korisnikEmail = result.rows[0].email;

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'appworkify@gmail.com',
                pass: 'osnxskudkhxbjrpp'
            },
        });

        let info = await transporter.sendMail({
            from: '"AppWorkify" <appworkify{gmail.com}>',
            to: korisnikEmail,
            subject: "Poziv na intervju",
            html: ` <h1>Čestitamo!</h1>
                    <p>Pozvani ste na intervju za posao.</p>
                    <p>Datum intervjua: <strong>${interviewDate}</strong></p>
                    <p>Molimo vas da potvrdite prisustvo.</p>
                    <a href=""><button>Potvrdi</button></a>`,
        });

        console.log(`Email poslan korisniku: ${korisnikEmail}`);

        return res.send(`
            <div class="success-message">
                <h2>Email je uspešno poslat korisniku: ${korisnikEmail}</h2>
                <p>Poziv na intervju je uspešno poslat sa datumom: ${interviewDate}</p>
            </div>
        `);

    } catch (err) {
        console.log("Greška prilikom slanja maila,", err.message);
        return res.status(500).send(`
            <div class="error-message">
                <h2>Došlo je do greške.</h2>
                <p>Greška prilikom slanja e-maila. Pokušajte ponovo kasnije.</p>
            </div>
        `);
    }
}
const sendStatus = async (req, res) => {
    const prijavaId = req.params.id;
    const { status } = req.body;

    console.log(status);

    console.log("KLIKNUTA PRIJAVAAAA",req.body);

    try {

        const korisnikIdQuery = await pool.query('SELECT korisnik_id, konkurs_id from prijava where id = $1', [prijavaId]);



        const korisnikId = korisnikIdQuery.rows[0].korisnik_id;
        const konkursId =  korisnikIdQuery.rows[0].konkurs_id;


        const result = await pool.query('SELECT email FROM korisnici WHERE id = $1', [korisnikId]);

        if (result.rows.length === 0) {
            throw new Error('Korisnik nije pronađen.');
        }

        const korisnikEmail = result.rows[0].email;

        let noviStatus = status;

      /*  if (status === 'uzi_krug') {
            noviStatus = 'Uži krug';
        }*/



        await pool.query(
            'UPDATE korisnik_konkurs SET status = $1 WHERE korisnik_id = $2 AND konkurs_id = $3',
            [status, korisnikId, konkursId]
        );

        const konkursQuery = await pool.query('SELECT naziv, pozicija FROM konkurs WHERE id = $1', [konkursId]);
        if (konkursQuery.rows.length === 0) {
            throw new Error('Konkurs nije pronađen.');
        }
        const konkurs = konkursQuery.rows[0];

        console.log(`Status prijave ažuriran za korisnika: ${korisnikEmail} i konkurs: ${konkurs.naziv}`);

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'appworkify@gmail.com',
                pass: 'osnxskudkhxbjrpp'
            },
        });

        let info = await transporter.sendMail({
            from: '"AppWorkify" <appworkify@gmail.com>',
            to: korisnikEmail,
            subject: "Promjena statusa prijave",
            html:  `<h6>Poštovani,</h6>
                    <p>status vaše prijave za konkurs: ${konkurs.naziv} za poziciju ${konkurs.pozicija} je promijenjen.</p>
                    <p>Trenutni status vaše prijave je: ${status}</p>
                    <br>
                    <p>Vaš Workify tim.</p>
                    `,
        });

        console.log(`Email poslan korisniku: ${korisnikEmail}`);



    } catch (err) {
        console.log("Greška prilikom slanja maila,", err.message);
        return res.status(500).json({ error: 'Greška prilikom slanja e-maila.' });
    }
}


const dodajKomentar = async (req, res) => {
    const korisnikId = req.params.id;
    const { komentar } = req.body;

    console.log('KOMENTAAAAR',korisnikId, komentar)

    if (!komentar || komentar.trim() === '') {
        return res.status(400).json({ error: 'Komentar ne može biti prazan.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO komentari (korisnik_id, komentar, datum) VALUES ($1, $2, NOW()) RETURNING id',
            [korisnikId, komentar]
        );

        const noviKomentarId = result.rows[0].id;

        console.log(`Komentar uspješno dodan! ID: ${noviKomentarId}`);

        return res.json({ success: true, komentarId: noviKomentarId });
    } catch (err) {
        console.error("Greška pri dodavanju komentara:", err.message);
        return res.status(500).json({ error: 'Greška prilikom dodavanja komentara.' });
    }
}


const searchPrijave = async (req,res) => {
    try {
        const { firma, bodovi, status, naziv_konkursa, naziv_firme, pozicija,sort } = req.query;

        console.log("RUTA PRIJAVA SA QUERY ", req.query);

        let prijaveQueryText =
           'SELECT p.id, p.konkurs_id, p.korisnik_id, p.ime, p.prezime, p.grad, p.cv, ' +
            'p.motivacijsko_pismo, p.certifikat, p.iskustvo, k.bodovi, k.status, ko.naziv AS naziv_konkursa, ko.naziv_firme, ko.pozicija ' +
            'FROM prijava p '+
            'JOIN korisnik_konkurs k ON p.korisnik_id = k.korisnik_id AND p.konkurs_id = k.konkurs_id '+
            'JOIN konkurs ko ON p.konkurs_id = ko.id '+
            'WHERE 1=1 '
        ;
        const queryParams = [];

        if (firma) {
            prijaveQueryText += ` AND LOWER(ko.naziv_firme) LIKE LOWER($${queryParams.length + 1})`;
            queryParams.push(`%${firma}%`);
        }
        if (bodovi) {
            prijaveQueryText += ` AND k.bodovi >= $${queryParams.length + 1}`;
            queryParams.push(Number(bodovi));
        }
        if (status) {
            prijaveQueryText += ` AND k.status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }
        if (naziv_konkursa) {
            prijaveQueryText += ` AND LOWER(ko.naziv) LIKE LOWER($${queryParams.length + 1})`;
            queryParams.push(`%${naziv_konkursa}%`);
        }
        if (naziv_firme) {
            prijaveQueryText += ` AND LOWER(ko.naziv_firme) LIKE LOWER($${queryParams.length + 1})`;
            queryParams.push(`%${naziv_firme}%`);
        }
        if (pozicija) {
            prijaveQueryText += ` AND LOWER(ko.pozicija) LIKE LOWER($${queryParams.length + 1})`;
            queryParams.push(`%${pozicija}%`);
        }

        if (sort === 'bodovi_asc') {
            prijaveQueryText += ' ORDER BY k.bodovi ASC';
        } else if (sort === 'bodovi_desc') {
            prijaveQueryText += ' ORDER BY k.bodovi DESC';
        }


        const prijaveQuery = await pool.query(prijaveQueryText, queryParams);



        res.render('adminPrijaveSearch', { prijave: prijaveQuery.rows });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};

const crtajStatistika = async (req, res) => {
    try {
        const konkursiQuery = await pool.query('SELECT * FROM konkurs');

        if (konkursiQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Nema konkursa u bazi.' });
        }

        const korisniciQuery = await pool.query('SELECT id, ime, prezime FROM korisnici');


        const korisnikStatistika = [];

        for (let korisnik of korisniciQuery.rows) {
            const korisnikId = korisnik.id;
            const imePrezime = `${korisnik.ime} ${korisnik.prezime}`;

            const statusQuery = await pool.query(
                `SELECT status, COUNT(*) AS broj
                 FROM korisnik_konkurs
                 WHERE korisnik_id = $1
                 GROUP BY status`,
                [korisnikId]
            );

            const statusPrijava = {
                aktivno: 0,
                uziKrug: 0,
                odbijeno: 0
            };

            statusQuery.rows.forEach(row => {
                if (row.status === 'aktivno') statusPrijava.aktivno = row.broj;
                if (row.status === 'uži krug') statusPrijava.uziKrug = row.broj;
                if (row.status === 'odbijeno') statusPrijava.odbijeno = row.broj;
            });

            korisnikStatistika.push({
                id : korisnikId,
                imePrezime,
                statusPrijava
            });
        }


        console.log("KORISNIK STATISTIKA, ", korisnikStatistika);

        const statistika = [];

        for (let konkurs of konkursiQuery.rows) {
            const konkursId = konkurs.id;

            const prijaveQuery = await pool.query(
                `SELECT COUNT(*) AS broj_prijava 
                 FROM prijava 
                 WHERE konkurs_id = $1`,
                [konkursId]
            );

            const brojPrijava = parseInt(prijaveQuery.rows[0].broj_prijava, 10);


            statistika.push({
                naziv: konkurs.naziv,
                brojPrijava: brojPrijava
            });
        }

        console.log("STATISTIKA: ", statistika);

        res.render('adminGrafovi', {
            statistika: JSON.stringify(statistika),
            korisnikStatistika: korisnikStatistika
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};


module.exports = {getAdminInfo, getKorisnici, getKorisnikInfo, getKonkursi,
                  deleteKonkurs,getEvents, addEvents,deleteEvents, addKonkurs, getPrijave, downloadMotivacjisko,
                  downloadCV, getStatistika, sendIntervju , sendStatus, dodajKomentar, searchPrijave, crtajStatistika};