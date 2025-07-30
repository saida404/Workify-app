var express = require('express');
var router = express.Router();
const verifyJWTadmin = require('../public/javascripts/verifyJWTadmin')
const adminController = require('../controllers/adminController');
const pool = require('../db/db');

router.get('/', verifyJWTadmin.verifyJWTadmin, adminController.getAdminInfo);
router.get('/korisnici', verifyJWTadmin.verifyJWTadmin, adminController.getKorisnici);
router.get('/konkursi',verifyJWTadmin.verifyJWTadmin, adminController.getKonkursi);
router.delete('/konkursi/:id',verifyJWTadmin.verifyJWTadmin ,adminController.deleteKonkurs);

router.get('/kalendar', verifyJWTadmin.verifyJWTadmin, (req, res) => {
    res.render('kalendar');

});

router.get('/events', adminController.getEvents);

router.post('/events', adminController.addEvents);

router.get('/forme-konkursi', (req,res) => {
    res.render('adminForme');
});

router.get('/statistika', verifyJWTadmin.verifyJWTadmin, adminController.getStatistika)

router.get('/grafovi', verifyJWTadmin.verifyJWTadmin, adminController.crtajStatistika);


router.post('/kreiraj-konkurs', verifyJWTadmin.verifyJWTadmin ,adminController.addKonkurs);

//router.get('/kreiraj-formu/:id', adminController.getForm);

router.get('/prijave-search', verifyJWTadmin.verifyJWTadmin, adminController.searchPrijave);

router.post('/send-intervju/:id', verifyJWTadmin.verifyJWTadmin, adminController.sendIntervju);

router.put('/update-status/:id', verifyJWTadmin.verifyJWTadmin, adminController.sendStatus)

router.delete('/events/:id', adminController.deleteEvents);

router.get('/korisnik/:id',verifyJWTadmin.verifyJWTadmin, adminController.getKorisnikInfo);

router.post('/korisnik/:id/dodaj-komentar', verifyJWTadmin.verifyJWTadmin, adminController.dodajKomentar);

router.get('/prijave/:id', verifyJWTadmin.verifyJWTadmin, adminController.getPrijave)

router.get('/download/motivacijsko/:id', verifyJWTadmin.verifyJWTadmin, adminController.downloadMotivacjisko);

router.get('/download/cv/:id', verifyJWTadmin.verifyJWTadmin, adminController.downloadCV);


module.exports = router;
