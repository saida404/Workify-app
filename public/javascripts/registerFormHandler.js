document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const ime = document.getElementById('ime').value;
    const prezime = document.getElementById('prezime').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const grad = document.getElementById('grad').value;
    const strucna_sprema = document.getElementById('strucna_sprema').value;
    const god_radno_iskustvo = document.getElementById('god_radno_iskustvo').value;

    if (password !== confirmPassword) {
        document.getElementById('message').textContent = 'Lozinke se ne podudaraju!';
        return;
    }

    const data = {
        ime,
        prezime,
        email,
        username,
        password,
        confirmPassword,
        grad,
        strucna_sprema,
        god_radno_iskustvo
    };

    console.log('Podaci koji se šalju na server:', data);
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = '/login';
        } else {
            const result = await response.json();
            document.getElementById('message').textContent = result.message || 'Greška prilikom registracije.';
        }
    } catch (error) {
        console.error('Greška:', error);
        document.getElementById('message').textContent = 'Došlo je do greške. Pokušajte ponovo kasnije.';
    }
});
