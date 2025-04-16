
const API_URL = 'http://localhost:8000/api';

const filmsContainer = document.getElementById('films-container');
const filterSelect = document.getElementById('seance-filter');
const loadingElement = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayFilms();
    
    // Écouteur d'événement pour le filtre
    filterSelect.addEventListener('change', () => {
        const selectedType = filterSelect.value;
        displayFilms(selectedType);
    });
});

/**
 * Récupérer tous les films depuis l'API
 */
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

/**
 * Récupérer les détails d'un film et ses séances
 */
async function fetchFilmDetails(filmId) {
    try {
        console.log("Tentative de récupération des détails du film:", filmId);
        
        const response = await fetch(`${API_URL}/films/${filmId}`);
        console.log("Statut de la réponse détails:", response.status);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Détails reçus:", data);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des détails du film ${filmId}:`, error);
        // Retourner un objet avec des valeurs par défaut
        return {
            film: null,
            seances: []
        };
    }
}

/**
 * Afficher tous les films avec leurs séances
 */
async function displayFilms(filterType = '') {
    showLoading(true);
    hideError();
    filmsContainer.innerHTML = '';

    try {
        // Récupérer tous les films
        const films = await fetchFilms();
        console.log('Films:', films);
        
        if (films.length === 0) {
            filmsContainer.innerHTML = '<p class="text-center col-span-full">Aucun film disponible</p>';
            return;
        }
        
        // Créer une carte pour chaque film
        for (const film of films) {
            try {
                // Essayer de récupérer les détails et séances
                const filmDetails = await fetchFilmDetails(film.id);
                
                // Si les détails ne sont pas disponibles, utiliser les données de base
                const filmToDisplay = filmDetails.film || film;
                
                // Filtrer les séances si nécessaire
                const seances = filmDetails.seances || [];
                const filteredSeances = filterType 
                    ? seances.filter(seance => seance.type === filterType)
                    : seances;
                
                // Créer et ajouter la carte du film
                const filmCard = createFilmCard(filmToDisplay, filteredSeances);
                filmsContainer.appendChild(filmCard);
            } catch (detailError) {
                console.error(`Erreur pour le film ${film.id}:`, detailError);
                
                // En cas d'erreur, afficher le film avec les données de base
                const filmCard = createFilmCard(film, []);
                filmsContainer.appendChild(filmCard);
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError(`Erreur lors du chargement des films: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Créer une carte de film avec ses séances
 */
function createFilmCard(film, seances = []) {
    if (!film) return null;

    const filmCard = document.createElement('div');
    filmCard.className = 'film-card';

    // Convertir l'URL YouTube en URL d'intégration
    const embedUrl = getEmbedUrl(film.bandeAnnonce || '');

    // Créer le HTML pour les séances
    const seancesHTML = seances.length > 0
        ? seances.map(seance => {
            const date = new Date(seance.startTime);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            const formattedTime = date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="seance-item ${seance.type === 'VIP' ? 'seance-vip' : 'seance-normal'}">
                    <div class="flex justify-between">
                        <span>${formattedDate} à ${formattedTime}</span>
                        <span class="font-bold">${seance.type}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                        Langue: ${seance.langue}
                    </div>
                </div>
            `;
        }).join('')
        : '<p class="text-gray-500">Aucune séance disponible</p>';

    // Construire le HTML de la carte
    filmCard.innerHTML = `
        <img src="${film.photo || ''}" alt="${film.titre || 'Film'}" class="film-poster">
        <div class="film-card-content">
            <h2 class="text-xl font-bold mb-2">${film.titre || 'Sans titre'}</h2>
            <p class="film-description text-gray-700">${film.description || 'Aucune description'}</p>
            
            <div class="flex flex-wrap gap-2 my-3">
                <span class="px-2 py-1 bg-gray-200 rounded">${formatDuration(film.duree || 0)}</span>
                <span class="px-2 py-1 bg-blue-100 rounded">${film.genre || 'Genre inconnu'}</span>
                <span class="px-2 py-1 bg-red-100 rounded">${film.ageMin || ''}+</span>
            </div>
            
            ${embedUrl ? `
                <div class="trailer-container">
                    <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                </div>
            ` : ''}
            
            <div class="mt-4">
                <h4 class="font-bold mb-2">Séances</h4>
                ${seancesHTML}
            </div>
        </div>
    `;

    return filmCard;
}


function showLoading(show) {
    loadingElement.style.display = show ? 'block' : 'none';
}


function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}


function hideError() {
    errorMessage.classList.add('hidden');
}


function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
}


function getEmbedUrl(url) {
    if (!url) return '';
    
    
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    
    if (youtubeMatch && youtubeMatch[1]) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    return url;
}