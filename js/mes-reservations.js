// js/mes-reservations.js
// Configuration de l'API
const API_URL = 'http://localhost:8000/api';

// Éléments DOM
const codeReservation = document.getElementById('code-reservation');
const rechercherBtn = document.getElementById('rechercher-btn');
const reservationDetails = document.getElementById('reservation-details');
const notFound = document.getElementById('not-found');
const detailFilm = document.getElementById('detail-film');
const detailSeance = document.getElementById('detail-seance');
const detailSieges = document.getElementById('detail-sieges');
const detailStatut = document.getElementById('detail-statut');
const expirationInfo = document.getElementById('expiration-info');
const tempsRestant = document.getElementById('temps-restant');
const annulerBtn = document.getElementById('annuler-btn');
const payerDetailBtn = document.getElementById('payer-detail-btn');

// État de l'application
let currentReservation = null;
let countdownInterval = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    
    // Vérifier si un code de réservation est passé dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        codeReservation.value = code;
        rechercherReservation();
    }
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    rechercherBtn.addEventListener('click', rechercherReservation);
    codeReservation.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rechercherReservation();
        }
    });
    
    annulerBtn.addEventListener('click', annulerReservation);
    payerDetailBtn.addEventListener('click', payerReservation);
}

// Rechercher une réservation par son code
async function rechercherReservation() {
    const code = codeReservation.value.trim();
    
    if (!code) {
        alert('Veuillez entrer un code de réservation');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservations/code/${code}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showNotFound();
                return;
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const reservation = await response.json();
        currentReservation = reservation;
        
        // Récupérer les détails de la séance
        const seanceResponse = await fetch(`${API_URL}/seances/${reservation.seance_id}`);
        if (!seanceResponse.ok) {
            throw new Error(`Erreur HTTP: ${seanceResponse.status}`);
        }
        
        const seance = await seanceResponse.json();
        
        // Récupérer les détails du siège
        const siegeResponse = await fetch(`${API_URL}/sieges/${reservation.siege_id}`);
        if (!siegeResponse.ok) {
            throw new Error(`Erreur HTTP: ${siegeResponse.status}`);
        }
        
        const siege = await siegeResponse.json();
        
        // Afficher les détails
        showReservationDetails(reservation, seance, siege);
    } catch (error) {
        console.error('Erreur lors de la recherche de la réservation:', error);
        alert('Erreur lors de la recherche de la réservation. Veuillez réessayer plus tard.');
    }
}

// Afficher les détails de la réservation
function showReservationDetails(reservation, seance, siege) {
    notFound.classList.add('hidden');
    reservationDetails.classList.remove('hidden');
    
    // Afficher les détails du film
    detailFilm.textContent = seance.film.titre;
    
    // Afficher les détails de la séance
    const date = new Date(seance.startTime);
    detailSeance.textContent = `${date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    })} à ${date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    })} (${seance.type})`;
    
    // Afficher les détails du siège
    detailSieges.textContent = `Rangée ${siege.rangee}, Siège ${siege.numero} (${siege.type})`;
    
    // Afficher le statut
    detailStatut.innerHTML = '';
    const statutSpan = document.createElement('span');
    
    if (reservation.statut === 'Réservé') {
        statutSpan.className = 'statut-reserve';
        statutSpan.textContent = 'Réservé';
        
        // Afficher le temps restant avant expiration
        if (reservation.expire_at) {
            const expireAt = new Date(reservation.expire_at);
            const now = new Date();
            
            if (expireAt > now) {
                expirationInfo.classList.remove('hidden');
                
                // Démarrer le compte à rebours
                startCountdown(expireAt);
                
                // Activer les boutons
                annulerBtn.disabled = false;
                payerDetailBtn.disabled = false;
            } else {
                expirationInfo.classList.add('hidden');
                statutSpan.className = 'statut-annule';
                statutSpan.textContent = 'Expiré';
                
                // Désactiver les boutons
                annulerBtn.disabled = true;
                payerDetailBtn.disabled = true;
            }
        } else {
            expirationInfo.classList.add('hidden');
        }
    } else if (reservation.statut === 'Payé') {
        statutSpan.className = 'statut-paye';
        statutSpan.textContent = 'Payé';
        expirationInfo.classList.add('hidden');
        
        // Désactiver les boutons
        annulerBtn.disabled = true;
        payerDetailBtn.disabled = true;
    } else {
        statutSpan.className = 'statut-annule';
        statutSpan.textContent = 'Annulé';
        expirationInfo.classList.add('hidden');
        
        // Désactiver les boutons
        annulerBtn.disabled = true;
        payerDetailBtn.disabled = true;
    }
    
    detailStatut.appendChild(statutSpan);
}

// Afficher le message "non trouvé"
function showNotFound() {
    reservationDetails.classList.add('hidden');
    notFound.classList.remove('hidden');
    
    // Arrêter le compte à rebours s'il est en cours
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Démarrer le compte à rebours
function startCountdown(expireAt) {
    // Arrêter le compte à rebours précédent s'il existe
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Mettre à jour le temps restant immédiatement
    updateCountdown(expireAt);
    
    // Mettre à jour le temps restant toutes les secondes
    countdownInterval = setInterval(() => {
        const timeLeft = updateCountdown(expireAt);
        
        // Si le temps est écoulé, arrêter le compte à rebours et recharger les détails
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            
            // Recharger les détails de la réservation
            rechercherReservation();
        }
    }, 1000);
}

// Mettre à jour le compte à rebours
function updateCountdown(expireAt) {
    const now = new Date();
    const timeLeft = expireAt - now;
    
    if (timeLeft <= 0) {
        tempsRestant.textContent = '0:00';
        return 0;
    }
    
    // Calculer les minutes et secondes restantes
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    // Formater le temps restant
    tempsRestant.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return timeLeft;
}

// Annuler la réservation
async function annulerReservation() {
    if (!currentReservation) {
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservations/${currentReservation.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        alert('Réservation annulée avec succès');
        
        // Recharger les détails de la réservation
        rechercherReservation();
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la réservation:', error);
        alert('Erreur lors de l\'annulation de la réservation. Veuillez réessayer plus tard.');
    }
}

// Payer la réservation
async function payerReservation() {
    if (!currentReservation) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservations/${currentReservation.id}/payer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        alert('Paiement effectué avec succès!');
        
        // Recharger les détails de la réservation
        rechercherReservation();
    } catch (error) {
        console.error('Erreur lors du paiement:', error);
        alert('Erreur lors du paiement. Veuillez réessayer plus tard.');
    }
}