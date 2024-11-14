document.querySelector('.signup-link').addEventListener('click', function(event) {
    event.preventDefault();
    document.querySelector('.login-form').style.display = 'none';
    document.querySelector('.signup-form').style.display = 'block';
});

document.querySelector('.login-link').addEventListener('click', function(event) {
    event.preventDefault();
    document.querySelector('.signup-form').style.display = 'none';
    document.querySelector('.login-form').style.display = 'block';
});

// Add an event listener to the button
document.getElementById('loginbtn').addEventListener('click', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('userID', data.userID); // Guarda el ID de usuario en localStorage
            localStorage.setItem('nombreUsuario', data.nombreUsuario);
            localStorage.setItem('fotoUsuario', data.fotoUsuario);
            window.location.href = 'chats.html'; // Redirige a la página de chats
        } else {
            alert('Usuario o contraseña incorrectos');
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
    }
});

document.getElementById("signupbtn").addEventListener("click", function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Redirect to principal.html
    window.location.href = "inicioyregistro.html";
});

