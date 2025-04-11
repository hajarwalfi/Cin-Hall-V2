// Inscription
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const response = await fetch('http://127.0.0.1:8000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error during registration:', data);
      alert('Registration failed: ' + (data.message || 'Unknown error'));
      return;
    }

    console.log('Registration successful:', data);
    if (data.token) {
      localStorage.setItem('token', data.token); // Save JWT
      window.location.href = '/profile.html'; // Redirect to profile page
    }
  } catch (error) {
    console.error('Error during registration:', error);
    alert('A network error occurred. Please try again.');
  }
});
  
  // Connexion
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
  
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('Error during login:', data);
        alert('Login failed: ' + (data.error || 'Invalid credentials'));
        return;
      }
  
      console.log('Login successful:', data);
      if (data.access_token) {
        localStorage.setItem('token', data.access_token); // Save JWT
        window.location.href = '/profile.html'; // Redirect to profile page
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('A network error occurred. Please try again.');
    }
  });
  