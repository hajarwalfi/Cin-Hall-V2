// js/reservation.js
// Configuration de l'API
const API_URL = 'http://localhost:8000/api';

// Éléments DOM
const seanceSelect = document.getElementById('seance-select');
const filmInfo = document.getElementById('film-info');
const filmTitre = document.getElementById('film-titre');
const filmGenre = document.getElementById('film-genre');
const filmDuree = document.getElementById('film-duree');
const seanceDate = document.getElementById('seance-date');
const seanceType = document.getElementById('seance-type');
const reservationContainer = document.getElementById('reservation-container');
const siegesContainer = document.getElementById('sieges-container');
const selectionInfo = document.getElementById('selection-info');
const siegesSelectionnes = document.getElementById('sieges-selectionnes');
const totalPrice = document.getElementById('total-price');
const reserverBtn = document.getElementById('reserver-btn');
const confirmationContainer = document.getElementById('confirmation-container');
const reservationCode = document.getElementById('reservation-code');
const payerBtn = document.getElementById('payer-btn');
const retourBtn = document.getElementById('retour-btn');

// État de l'application
let seances = [];
let selectedSeance = null;
let carteSieges = {};
let selectedSeats = [];
let prixStandard = 9.50;
let prixVIP = 15.00;
let currentReservationCode = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadSeances();
    setupEventListeners();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    seanceSelect.addEventListener('change', handleSeanceChange);
    reserverBtn.addEventListener('click', handleReservation);
    payerBtn.addEventListener('click', handlePayment);
    retourBtn.addEventListener('click', () => window.location.href = 'index.html');
}

// Charger toutes les séances
async function loadSeances() {
    try {
        const response = await fetch(`${API_URL}/seances`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        seances = await response.json();
        renderSeanceOptions(seances);
    } catch (error) {
        console.error('Erreur lors du chargement des séances:', error);
        alert('Impossible de charger les séances. Veuillez réessayer plus tard.');
    }
}

// Afficher les options de séances dans le select
function renderSeanceOptions(seances) {
    // Vider les options existantes sauf la première
    while (seanceSelect.options.length > 1) {
        seanceSelect.remove(1);
    }
    
    // Trier les séances par date
    seances.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Ajouter les nouvelles options
    seances.forEach(seance => {
        const option = document.createElement('option');
        option.value = seance.id;
        
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
        
        option.textContent = `${seance.film.titre} - ${formattedDate} à ${formattedTime} (${seance.type})`;
        seanceSelect.appendChild(option);
    });
}

// Gérer le changement de séance
async function handleSeanceChange() {
    const seanceId = seanceSelect.value;
    
    if (!seanceId) {
        filmInfo.classList.add('hidden');
        reservationContainer.classList.add('hidden');
        return;
    }
    
    selectedSeance = seances.find(s => s.id == seanceId);
    
    if (selectedSeance) {
        // Afficher les informations du film et de la séance
        filmTitre.textContent = selectedSeance.film.titre;
        filmGenre.textContent = selectedSeance.film.genre;
        filmDuree.textContent = formatDuration(selectedSeance.film.duree);
        
        const date = new Date(selectedSeance.startTime);
        seanceDate.textContent = `${date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })} à ${date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        
        seanceType.textContent = selectedSeance.type;
        seanceType.classList.remove('bg-green-100', 'bg-yellow-100');
        seanceType.classList.add(selectedSeance.type === 'VIP' ? 'bg-yellow-100' : 'bg-green-100');
        
        filmInfo.classList.remove('hidden');
        reservationContainer.classList.remove('hidden');
        confirmationContainer.classList.add('hidden');
        
        // Charger la carte des sièges
        await loadCarteSieges(seanceId);
    }
}

// Charger la carte des sièges pour une séance
async function loadCarteSieges(seanceId) {
    try {
        const response = await fetch(`${API_URL}/seances/${seanceId}/carte-sieges`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        carteSieges = await response.json();
        renderCarteSieges(carteSieges);
    } catch (error) {
        console.error('Erreur lors du chargement de la carte des sièges:', error);
        alert('Impossible de charger la carte des sièges. Veuillez réessayer plus tard.');
    }
}

// Afficher la carte des sièges
function renderCarteSieges(carteSieges) {
    siegesContainer.innerHTML = '';
    selectedSeats = [];
    updateSelectionInfo();
    
    // Trier les rangées
    const rangees = Object.keys(carteSieges).sort();
    
    rangees.forEach(rangee => {
        const rangeeDiv = document.createElement('div');
        rangeeDiv.className = 'rangee';
        
        // Étiquette de la rangée
        const rangeeLabel = document.createElement('div');
        rangeeLabel.className = 'rangee-label';
        rangeeLabel.textContent = rangee;
        rangeeDiv.appendChild(rangeeLabel);
        
        // Sièges de la rangée
        const sieges = carteSieges[rangee];
        const numeros = Object.keys(sieges).sort((a, b) => parseInt(a) - parseInt(b));
        
        numeros.forEach(numero => {
            const siege = sieges[numero];
            const siegeDiv = document.createElement('div');
            
            // Déterminer la classe CSS en fonction du type et de la disponibilité
            let siegeClass = 'siege';
            
            if (siege.type === 'Standard') {
                siegeClass += ' siege-standard';
            } else if (siege.type === 'VIP') {
                siegeClass += ' siege-vip';
            } else if (siege.type === 'Couple') {
                siegeClass += ' siege-couple';
            }
            
            if (!siege.disponible) {
                siegeClass += ' siege-reserve';
            } else {
                siegeClass += ' siege-disponible';
            }
            
            siegeDiv.className = siegeClass;
            siegeDiv.textContent = numero;
            siegeDiv.dataset.id = siege.id;
            siegeDiv.dataset.rangee = rangee;
            siegeDiv.dataset.numero = numero;
            siegeDiv.dataset.type = siege.type;
            siegeDiv.dataset.estCoupleAvec = siege.est_couple_avec;
            
            // Ajouter un écouteur d'événement pour la sélection du siège
            if (siege.disponible) {
                siegeDiv.addEventListener('click', () => handleSiegeClick(siegeDiv, siege));
            }
            
            rangeeDiv.appendChild(siegeDiv);
        });
        
        siegesContainer.appendChild(rangeeDiv);
    });
}

// Gérer le clic sur un siège
function handleSiegeClick(siegeDiv, siege) {
    // Vérifier si le siège est déjà sélectionné
    const index = selectedSeats.findIndex(s => s.id === siege.id);
    
    if (index !== -1) {
        // Désélectionner le siège
        selectedSeats.splice(index, 1);
        siegeDiv.classList.remove('siege-selectionne');
        
        // Si c'est un siège de couple, désélectionner aussi l'autre siège
        if (siege.type === 'Couple' && siege.est_couple_avec) {
            const siegeCoupleDiv = document.querySelector(`[data-id="${siege.est_couple_avec}"]`);
            if (siegeCoupleDiv) {
                siegeCoupleDiv.classList.remove('siege-selectionne');
                const indexCouple = selectedSeats.findIndex(s => s.id === parseInt(siege.est_couple_avec));
                if (indexCouple !== -1) {
                    selectedSeats.splice(indexCouple, 1);
                }
            }
        }
    } else {
        // Sélectionner le siège
        selectedSeats.push({
            id: siege.id,
            rangee: siege.rangee,
            numero: siege.numero,
            type: siege.type
        });
        siegeDiv.classList.add('siege-selectionne');
        
        // Si c'est un siège de couple, sélectionner aussi l'autre siège
        if (siege.type === 'Couple' && siege.est_couple_avec) {
            const siegeCoupleDiv = document.querySelector(`[data-id="${siege.est_couple_avec}"]`);
            if (siegeCoupleDiv && !siegeCoupleDiv.classList.contains('siege-reserve')) {
                siegeCoupleDiv.classList.add('siege-selectionne');
                
                // Trouver les détails du siège associé
                const rangee = siegeCoupleDiv.dataset.rangee;
                const numero = siegeCoupleDiv.dataset.numero;
                
                // Ajouter le siège associé à la sélection s'il n'y est pas déjà
                const indexCouple = selectedSeats.findIndex(s => s.id === parseInt(siege.est_couple_avec));
                if (indexCouple === -1) {
                    selectedSeats.push({
                        id: parseInt(siege.est_couple_avec),
                        rangee: rangee,
                        numero: parseInt(numero),
                        type: 'Couple'
                    });
                }
            }
        }
    }
    
    // Mettre à jour les informations de sélection
    updateSelectionInfo();
}

// Mettre à jour les informations de sélection
function updateSelectionInfo() {
    if (selectedSeats.length > 0) {
        selectionInfo.classList.remove('hidden');
        
        // Trier les sièges par rangée et numéro
        selectedSeats.sort((a, b) => {
            if (a.rangee === b.rangee) {
                return a.numero - b.numero;
            }
            return a.rangee.localeCompare(b.rangee);
        });
        
        // Afficher les sièges sélectionnés
        siegesSelectionnes.innerHTML = '';
        selectedSeats.forEach(siege => {
            const li = document.createElement('li');
            li.textContent = `Rangée ${siege.rangee}, Siège ${siege.numero} (${siege.type})`;
            siegesSelectionnes.appendChild(li);
        });
        
        // Calculer le prix total
        let total = 0;
        selectedSeats.forEach(siege => {
            if (siege.type === 'Standard') {
                total += prixStandard;
            } else {
                total += prixVIP;
            }
        });
        
        totalPrice.textContent = `Prix total: ${total.toFixed(2)} €`;
        
        // Activer le bouton de réservation
        reserverBtn.disabled = false;
    } else {
        selectionInfo.classList.add('hidden');
        reserverBtn.disabled = true;
    }
}

// Gérer la réservation
async function handleReservation() {
    if (selectedSeats.length === 0 || !selectedSeance) {
        return;
    }
    
    try {
        // Pour chaque siège sélectionné, créer une réservation
        const reservations = [];
        
        for (const siege of selectedSeats) {
            const response = await fetch(`${API_URL}/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seance_id: selectedSeance.id,
                    siege_id: siege.id,
                    // user_id: userId, // À ajouter si l'authentification est implémentée
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const reservation = await response.json();
            reservations.push(reservation);
        }
        
        // Stocker le code de réservation (utiliser le premier siège)
        if (reservations.length > 0) {
            currentReservationCode = reservations[0].code;
            reservationCode.textContent = currentReservationCode;
            
            // Afficher la confirmation
            reservationContainer.classList.add('hidden');
            confirmationContainer.classList.remove('hidden');
            
            // Sauvegarder le code de réservation dans le localStorage
            const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            savedReservations.push(currentReservationCode);
            localStorage.setItem('reservations', JSON.stringify(savedReservations));
        }
    } catch (error) {
        console.error('Erreur lors de la réservation:', error);
        alert('Erreur lors de la réservation. Veuillez réessayer plus tard.');
    }
}

// Gérer le paiement
async function handlePayment() {
    if (!currentReservationCode) {
        return;
    }
    
    try {
        // Récupérer la réservation par son code
        const response = await fetch(`${API_URL}/reservations/code/${currentReservationCode}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const reservation = await response.json();
        
        // Payer la réservation
        const payResponse = await fetch(`${API_URL}/reservations/${reservation.id}/payer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!payResponse.ok) {
            throw new Error(`Erreur HTTP: ${payResponse.status}`);
        }
        
        alert('Paiement effectué avec succès!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur lors du paiement:', error);
        alert('Erreur lors du paiement. Veuillez réessayer plus tard.');
    }
}

// Formater la durée en heures et minutes
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
}