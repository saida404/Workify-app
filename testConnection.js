const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database:'HRMProba',
    password: 'saida123',
    port: 5432
});

module.exports = pool

async function testConnection() {
    try {
        // Pokušajte da izvršite jednostavan upit da biste proverili konekciju
        const res = await pool.query('SELECT NOW()');  // Ovo vraća trenutni datum i vreme sa servera
        console.log('Konekcija sa bazom uspešna:', res.rows);
    } catch (err) {
        console.error('Greška pri konektovanju na bazu:', err);
    } finally {
        // Zatvorite konekciju
        await pool.end();
    }
}

testConnection();