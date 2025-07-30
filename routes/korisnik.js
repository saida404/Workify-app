var express = require('express');
var router = express.Router();
const pool = require('../db/db');
const verifyJWT = require('../public/javascripts/verifyJWT');
const  logout  = require('../controllers/logoutController');
const userController = require('../controllers/userController');


const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/', verifyJWT.verifyJWT, userController.getUserProfile);

router.post('/logout', verifyJWT.verifyJWT, logout.handleLogout);

router.put('/update-education', verifyJWT.verifyJWT, userController.updateEducation);

router.put('/update-bio', verifyJWT.verifyJWT, userController.updateBio);

router.put('/update-radno-iskustvo', verifyJWT.verifyJWT, userController.updateRadnoIskustvo);

router.get('/download-cv', verifyJWT.verifyJWT, userController.downloadCV);



router.post('/upload-cv', verifyJWT.verifyJWT, upload.single('cv-fajl'), async (req, res) => {
    const { title } = req.body;
    const korisnik_id =  req.user.id;
    const file = req.file;
    console.log(korisnik_id);

    if (!file) {
        return res.status(400).json({ error: "Fajl nije poslan" });
    }
    console.log(req.file)

    try {
        const queryCV = 'INSERT INTO cv (file_name, korisnik_id, file_data) VALUES ($1, $2, $3)';
        const values = [title, korisnik_id, file.buffer];


        const result = await pool.query(queryCV, values);

        res.json({ message: "Fajl uspješno spremljen!", fileId: result.rows[0]?.id });
        return;

    } catch (err) {
        console.error("Greška prilikom spremanja u bazu:", err);
        res.status(500).json({ error: "Greška prilikom spremanja fajla." });
    }
});

module.exports = router;