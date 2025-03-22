// Vérifiez si le fichier config.js existe et contient une clé API
// Si vous clonez ce projet, vous devez créer votre propre fichier config.js
// basé sur config.example.js avec votre propre clé API Flickr
let apiKey = 'VOTRE_CLE_API_FLICKR'; // Valeur par défaut (ne fonctionnera pas)

// Cette partie sera remplacée par la vraie clé si config.js est présent
// Le fichier config.js n'est pas inclus dans le dépôt GitHub pour des raisons de sécurité
try {
    // Essayer de charger la configuration depuis config.js (fichier ignoré par git)
    if (typeof configApiKey !== 'undefined') {
        apiKey = configApiKey;
    }
} catch (error) {
    console.error('⚠️ Le fichier config.js avec votre clé API est manquant.');
    console.error('Veuillez créer un fichier config.js basé sur config.example.js avec votre propre clé API Flickr.');
}

let currentPage = 1;
let currentSearch = '';
let isLoading = false;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeToggle();
    initializeSearchListeners();
    checkLocalTheme();
    initializeInfiniteScroll();
});

function initializeThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        // Change l'icône en fonction du thème
        if (document.body.classList.contains('dark-theme')) {
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    });
}

function checkLocalTheme() {
    // Vérifie si un thème est enregistré dans le localStorage
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.querySelector('.theme-toggle i');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.className = 'fas fa-sun';
    }
}

function initializeSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchImages();
    });
    
    searchButton.addEventListener('click', searchImages);
    
    // Focus sur l'input au chargement
    searchInput.focus();
}

function initializeInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 300 && currentSearch) {
            loadMoreImages();
        }
    });
}

async function searchImages(newSearch = true) {
    const searchInput = document.getElementById('searchInput').value;
    const gallery = document.getElementById('gallery');
    const initialMessage = document.getElementById('initialMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!searchInput.trim()) {
        showError('Veuillez entrer un terme de recherche');
        return;
    }
    
    if (newSearch) {
        currentPage = 1;
        currentSearch = searchInput;
        gallery.innerHTML = '';
    }
    
    showLoading(true);
    errorMessage.style.display = 'none';
    
    if (initialMessage) {
        initialMessage.style.display = 'none';
    }
    
    try {
        const response = await fetch(`https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&text=${currentSearch}&format=json&nojsoncallback=1&per_page=30&page=${currentPage}&sort=relevance`);
        const data = await response.json();
        
        if (data.stat === 'fail') {
            throw new Error(data.message);
        }
        
        if (data.photos.photo.length === 0) {
            if (newSearch) {
                showError('Aucune image trouvée pour cette recherche');
            }
            return;
        }
        
        displayImages(data.photos.photo);
    } catch (error) {
        showError('Une erreur est survenue lors de la recherche');
        console.error('Erreur:', error);
    } finally {
        showLoading(false);
    }
}

async function loadMoreImages() {
    if (!currentSearch || isLoading) return;
    
    currentPage++;
    isLoading = true;
    
    await searchImages(false);
    isLoading = false;
}

function displayImages(photos) {
    const gallery = document.getElementById('gallery');
    
    photos.forEach((photo, index) => {
        const imageCard = createImageCard(photo, index);
        gallery.appendChild(imageCard);
    });
}

function createImageCard(photo, index) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.style.animationDelay = `${0.05 * (index % 10)}s`;
    
    const imgUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`;
    
    card.innerHTML = `
        <img src="${imgUrl}" alt="${photo.title || 'Image Flickr'}" loading="lazy">
        <div class="image-overlay">
            <h3>${photo.title || 'Sans titre'}</h3>
            <div class="image-stats">
                <span><i class="fas fa-heart"></i> ${Math.floor(Math.random() * 1000)}</span>
                <span><i class="fas fa-comment"></i> ${Math.floor(Math.random() * 100)}</span>
                <span><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 5000)}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        window.open(`https://www.flickr.com/photos/${photo.owner}/${photo.id}`, '_blank');
    });
    
    // Ajoute un effet de chargement progressif
    const img = card.querySelector('img');
    img.style.opacity = '0';
    
    img.onload = () => {
        img.style.opacity = '1';
    };
    
    return card;
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.opacity = '0';
        setTimeout(() => {
            errorMessage.style.display = 'none';
            errorMessage.style.opacity = '1';
        }, 300);
    }, 3000);
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
    isLoading = show;
}