// Configure l'URL de ton site Frappe. IMPORTANT : ne change pas 'window.location.origin'
// si ton frontend est servi par Frappe sur le même domaine.
const FRAPPE_SITE_URL = window.location.origin;

// Références aux éléments du DOM
const actesList = document.getElementById('actesList');
const acteTitleInput = document.getElementById('acteTitle');
const acteDescriptionInput = document.getElementById('acteDescription'); // On va réutiliser ceci pour 'contenu_acte'
const addActeBtn = document.getElementById('addActeBtn');

// NOUVEAU : Références pour les champs spécifiques de 'Actes'
const typeActeInput = document.getElementById('typeActe'); // Ajout d'un champ pour le Type d'acte
const affaireNotarialeInput = document.getElementById('affaireNotariale'); // Ajout d'un champ pour l'Affaire Notariale

// --- Fonctions pour gérer les données ---

// Fonction pour récupérer les actes depuis Frappe
async function fetchActes() {
    actesList.innerHTML = '<li>Chargement des actes...</li>'; // Message de chargement
    try {
        // La DocType est maintenant 'Actes'
        const response = await fetch(`${FRAPPE_SITE_URL}/api/resource/Actes?fields=["name", "title", "type_acte", "affaire_notariale"]`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // Si ton API n'est pas publique et nécessite une authentification:
                // 'Authorization': 'Token API_KEY:API_SECRET'
                // Remplace API_KEY et API_SECRET par tes vraies clés
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erreur API: ${response.status} - ${errorData.exception || response.statusText}`);
        }

        const data = await response.json();
        console.log('Actes récupérés:', data);

        displayActes(data.data); // Frappe renvoie souvent les données dans data.data
    } catch (error) {
        console.error('Erreur lors de la récupération des actes:', error);
        actesList.innerHTML = `<li>Erreur lors du chargement des actes: ${error.message}. Vérifiez la console pour plus de détails.</li>`;
    }
}

// Fonction pour récupérer les Types d'acte disponibles (pour le champ Link)
async function fetchTypeActes() {
    try {
        const response = await fetch(`${FRAPPE_SITE_URL}/api/resource/type_acte?fields=["name"]`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error('Impossible de charger les types d\'acte');
        const data = await response.json();
        populateSelect(typeActeInput, data.data);
    } catch (error) {
        console.error('Erreur lors du chargement des types d\'acte:', error);
        typeActeInput.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}

// Fonction pour récupérer les Affaires Notariales disponibles (pour le champ Link)
async function fetchAffairesNotariales() {
    try {
        const response = await fetch(`${FRAPPE_SITE_URL}/api/resource/Affaire notariale?fields=["name", "title"]`, { // Assuming 'title' for display
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error('Impossible de charger les affaires notariales');
        const data = await response.json();
        populateSelect(affaireNotarialeInput, data.data, 'title'); // Utilise 'title' pour l'affichage
    } catch (error) {
        console.error('Erreur lors du chargement des affaires notariales:', error);
        affaireNotarialeInput.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}

// Fonction utilitaire pour remplir un select avec des options
function populateSelect(selectElement, items, displayField = 'name') {
    selectElement.innerHTML = '<option value="">-- Sélectionner --</option>'; // Option par défaut
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name; // La valeur est toujours le 'name' (ID unique) de la DocType liée
        option.textContent = item[displayField] || item.name; // Affiche le champ 'title' ou 'name'
        selectElement.appendChild(option);
    });
}


// Fonction pour afficher les actes
function displayActes(actes) {
    actesList.innerHTML = ''; // Nettoie la liste existante

    if (actes.length === 0) {
        actesList.innerHTML = '<li>Aucun acte trouvé pour le moment.</li>';
        return;
    }

    actes.forEach(acte => {
        const li = document.createElement('li');
        // Affiche les champs pertinents pour ta DocType 'Actes'
        li.innerHTML = `
            <h3>${acte.title || 'Titre non spécifié'}</h3>
            <p>Type d'acte: <strong>${acte.type_acte || 'N/A'}</strong></p>
            <p>Affaire Notariale: <strong>${acte.affaire_notariale || 'N/A'}</strong></p>
            <small>Référence: ${acte.name}</small>
        `;
        actesList.appendChild(li);
    });
}

// Fonction pour ajouter un nouvel acte
async function addActe() {
    const title = acteTitleInput.value.trim();
    const contenuActe = acteDescriptionInput.value.trim(); // Renommé pour correspondre à ta DocType
    const typeActe = typeActeInput.value;
    const affaireNotariale = affaireNotarialeInput.value;

    // Vérifie les champs obligatoires (selon ta DocType Actes)
    if (!title || !contenuActe || !typeActe || !affaireNotariale) {
        alert('Veuillez remplir le Titre, le Contenu, le Type d\'acte et l\'Affaire Notariale.');
        return;
    }

    addActeBtn.disabled = true; // Désactive le bouton pendant le traitement
    addActeBtn.textContent = 'Ajout en cours...';

    try {
        const response = await fetch(`${FRAPPE_SITE_URL}/api/resource/Actes`, { // La DocType est 'Actes'
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // 'Authorization': 'Token API_KEY:API_SECRET' // Si nécessaire
            },
            body: JSON.stringify({
                title: title,
                contenu_acte: contenuActe, // Nom de champ exact de ta DocType
                type_acte: typeActe,       // Nom de champ exact de ta DocType
                affaire_notariale: affaireNotariale, // Nom de champ exact de ta DocType
                // Frappe générera automatiquement acte_reference_number et creation_date
                // Tu peux ajouter d'autres champs avec des valeurs par défaut si nécessaire
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erreur lors de l'ajout: ${response.status} - ${errorData.exception || response.statusText}`);
        }

        const newActe = await response.json();
        console.log('Acte ajouté avec succès:', newActe);

        // Réinitialise les champs du formulaire
        acteTitleInput.value = '';
        acteDescriptionInput.value = '';
        typeActeInput.value = '';
        affaireNotarialeInput.value = '';

        fetchActes(); // Recharger la liste pour voir le nouvel acte
        alert('Acte ajouté avec succès !');

    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'acte:', error);
        alert(`Erreur lors de l'ajout de l'acte: ${error.message}`);
    } finally {
        addActeBtn.disabled = false;
        addActeBtn.textContent = 'Ajouter l\'acte';
    }
}

// --- Initialisation ---

// Écouteur d'événement pour le bouton d'ajout
addActeBtn.addEventListener('click', addActe);

// Chargement initial des actes et des données des champs liés quand la page est prête
document.addEventListener('DOMContentLoaded', () => {
    fetchActes();
    fetchTypeActes();
    fetchAffairesNotariales();
});