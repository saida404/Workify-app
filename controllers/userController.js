const pool = require('../db/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const userQuery = await pool.query(
            'SELECT id, ime, prezime, username, email, grad, roll, obrazovanje, biografija, radno_iskustvo, strucna_sprema, god_radno_iskustvo FROM korisnici WHERE id = $1',
            [userId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).render('errorPage', { message: 'Korisnik nije pronađen.' });
        }

        const user = userQuery.rows[0];

        const cvQuery = await pool.query(
            'SELECT file_name FROM cv WHERE korisnik_id = $1 ORDER BY id DESC LIMIT 1',
            [userId]
        );

        const cv = cvQuery.rows.length > 0 ? cvQuery.rows[0].file_name : null;

        const aktivniKonkursiQuery = await pool.query(
            'SELECT k.id, k.naziv, k.naziv_firme, k.pozicija, k.datum_objave,  kk.status FROM konkurs k ' +
            'JOIN korisnik_konkurs kk ON k.id = kk.konkurs_id WHERE kk.korisnik_id = $1 AND kk.status IN ($2, $3, $4)',
            [userId, 'aktivno', 'uži krug', 'intervju']
        );

        const arhiviraniKonkursiQuery = await pool.query(
            'SELECT k.id, k.naziv, k.naziv_firme, k.pozicija, k.datum_objave, kk.status FROM konkurs k ' +
            'JOIN korisnik_konkurs kk ON k.id = kk.konkurs_id WHERE kk.korisnik_id = $1 AND kk.status IN ($2, $3)',
            [userId, 'zavrseno', 'odbijeno']
        );

        res.render('profilePage', {
            title: "KORISNIK",
            user: {
                ime: user.ime,
                prezime: user.prezime,
                username: user.username,
                email: user.email,
                grad: user.grad,
                strucna_sprema: user.strucna_sprema,
                roll: user.roll || "Korisnik",
                god_radno_iskustvo:  user.god_radno_iskustvo,
                obrazovanje: user.obrazovanje || "Nema podataka",
                biografija: user.biografija || "Nema podataka",
                radno_iskustvo: user.radno_iskustvo || "Nema podataka"
            },
            activeJobs: aktivniKonkursiQuery.rows,
            archivedJobs: arhiviraniKonkursiQuery.rows,
            cv: cv
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('errorPage', { message: 'Greška na serveru.' });
    }
};

const updateEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { education } = req.body;

        if (!education) {
            return res.status(400).send('Education data is required');
        }

        const result = await pool.query(
            'UPDATE korisnici SET obrazovanje = $1 WHERE id = $2',
            [education, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Education updated successfully');
    } catch (err) {
        console.error('Error updating education:', err.message);
        res.status(500).send('Error updating education');
    }
};

const updateBio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { biografija } = req.body;

        if (!biografija) {
            return res.status(400).send('Biografija data is required');
        }

        const result = await pool.query(
            'UPDATE korisnici SET biografija = $1 WHERE id = $2',
            [biografija, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Biografija updated successfully');
    } catch (err) {
        console.error('Error updating biografija:', err.message);
        res.status(500).send('Error updating biografija');
    }
};

const updateRadnoIskustvo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { radno_iskustvo } = req.body;

        if (!radno_iskustvo) {
            return res.status(400).send('Radno iskustvo data is required');
        }

        const result = await pool.query(
            'UPDATE korisnici SET radno_iskustvo = $1 WHERE id = $2',
            [radno_iskustvo, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Radno iskustvo updated successfully');
    } catch (err) {
        console.error('Error updating radno iskustvo:', err.message);
        res.status(500).send('Error updating radno iskustvo');
    }
};

const downloadCV = async (req, res) => {
    try {
        const userId = req.user.id;

        const userQuery = await pool.query('SELECT ime, prezime FROM korisnici WHERE id = $1', [userId]);

        const korisnik = userQuery.rows[0];

        const result = await pool.query(
            'SELECT file_name, file_data FROM cv WHERE korisnik_id = $1 ORDER BY id DESC LIMIT 1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cv nije pronađen' });
        }

        const { cv: fileBuffer, ime, prezime } = result.rows[0];

        const prilagodjenoIme = encodeURIComponent(korisnik.ime);
        const prilagodjenoPrezime = encodeURIComponent(korisnik.prezime);

        const fileName = `cv_${prilagodjenoIme}_${prilagodjenoPrezime}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        res.send(fileBuffer);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};


module.exports = {
    getUserProfile,
    updateEducation,
    updateBio,
    updateRadnoIskustvo,downloadCV

};