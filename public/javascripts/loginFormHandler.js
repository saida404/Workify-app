document.getElementById('loginForm').addEventListener('submit', async(e) => {
    e.preventDefault();

    const username  = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = {
        username,
        password
    }
    console.log('podaci koji se šalju na server: ', data);

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = '/';


        }
    } catch (error) {
        console.error('Greška:', error);
        document.getElementById('message').textContent = 'Došlo je do greške. Pokušajte ponovo kasnije.';
    }
});
