var express = require('express');
var router = express.Router();
const verifyJWT = require('../public/javascripts/verifyJWT');
const konkursiController = require('../controllers/konkursiController');
const pool = require('../db/db');

const path = require('path');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/', verifyJWT.verifyJWT,konkursiController.getKonkursInfo);


router.get("/search", verifyJWT.verifyJWT,konkursiController.searchKonkursi);


router.get('/:id/forma', verifyJWT.verifyJWT, konkursiController.getForma);

router.post('/:id/forma/prijava', verifyJWT.verifyJWT,upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'motivacijsko_pismo', maxCount: 1 },
    { name: 'certifikat', maxCount: 1 }
    ]), konkursiController.postPrijava)

router.get('/:id', verifyJWT.verifyJWT,konkursiController.getKonkursDetails);
module.exports = router;
