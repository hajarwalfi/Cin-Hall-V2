const token = localStorage.getItem('token');

async function getUserProfile() {
  if (!token) {
    alert('You are not logged in! Redirecting to login page...');
    window.location.href = '/login.html';
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Session expired! Redirecting to login...');
        localStorage.removeItem('token'); // Remove invalid token
        window.location.href = '/login.html';
      } else {
        const errorData = await response.json();
        console.error('Error fetching profile:', errorData);
        alert('An error occurred while fetching your profile.');
      }
      return;
    }

    const user = await response.json();
    document.getElementById('user-name').textContent = user.user.name;
    document.getElementById('user-email').textContent = user.user.email;

  } catch (error) {
    console.error('Network error:', error);
    alert('A network error occurred. Please try again later.');
  }
}

getUserProfile();