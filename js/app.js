const API_URL = 'http://localhost:8000/api';

const filmsContainer = document.getElementById('films-container');
const filterSelect = document.getElementById('seance-filter');
const loadingElement = document.getElementById('loading');

async function fetchFilms() {
    try {
      console.log("Tentative de récupération des films depuis:", `${API_URL}/films`);
      
      const response = await fetch(`${API_URL}/films`);
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données reçues:", data);
      return data;
    } catch (error) {
      console.error("Erreur détaillée:", error);
      throw error;
    }
  }

async function fetchFilmDetails(filmId) {
  const response = await fetch(`${API_URL}/films/${filmId}`);
  const data = await response.json();
  return data;
}

function createFilmCard(film, seances = []) {
  const filmCard = document.createElement('div');
  filmCard.className = 'film-card';

  // Convertir l'URL YouTube en URL d'intégration si nécessaire
  let videoUrl = film.bandeAnnonce || '';
  if (videoUrl.includes('youtube.com/watch?v=')) {
    videoUrl = videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
  } else if (videoUrl.includes('youtu.be/')) {
    videoUrl = videoUrl.replace('youtu.be/', 'youtube.com/embed/');
  }

  filmCard.innerHTML = `
    <h2 class="text-xl font-bold mb-2">${film.titre}</h2>
    <img src="${film.photo}" alt="${film.titre}" class="w-full h-48 object-cover mb-2">
    <p class="mb-2">${film.description}</p>
    <p class="mb-2">Durée : ${film.duree} min | Genre : ${film.genre} | Âge minimum : ${film.ageMin}</p>
    <div class="aspect-w-16 aspect-h-9 mb-4">
      <iframe class="w-full h-48" src="${videoUrl}" frameborder="0" allowfullscreen></iframe>
    </div>
    <div class="seances">
      <h4 class="font-bold mb-2">Séances</h4>
      <ul class="space-y-2">
        ${seances.map(seance => `
          <li class="p-2 ${seance.type === 'VIP' ? 'bg-yellow-100' : 'bg-gray-100'} rounded">
            ${new Date(seance.startTime).toLocaleString()} - ${seance.type} - ${seance.langue}
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  return filmCard;
}

async function displayFilms(filterType = '') {
 
  loadingElement.style.display = 'block';
  
 
  filmsContainer.innerHTML = '';

  try {
   
    const films = await fetchFilms();
    console.log('Films:', films);
    
    for (const film of films) {
      const filmDetails = await fetchFilmDetails(film.id);
      console.log('Film details:', filmDetails);
      
      const filteredSeances = filterType
        ? filmDetails.seances.filter(seance => seance.type === filterType)
        : filmDetails.seances;
      
      // Créer et ajouter la carte du film
      const filmCard = createFilmCard(filmDetails, filteredSeances);
      filmsContainer.appendChild(filmCard);
    }
  } catch (error) {
    console.error('Erreur:', error);
    filmsContainer.innerHTML = '<p class="text-red-500">Erreur lors du chargement des films</p>';
  } finally {
    // Masquer le chargement
    loadingElement.style.display = 'none';
  }
}

// Écouteur d'événement pour le filtre
filterSelect.addEventListener('change', () => {
  const selectedType = filterSelect.value;
  displayFilms(selectedType);
});

// Charger les films au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  displayFilms();
});