document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const titleInput = document.getElementById('songTitle');
    const categoryInput = document.getElementById('songCategory');
    const lyricsInput = document.getElementById('lyrics');
    
    const carolsList = document.getElementById('carolsList');
    const christmasList = document.getElementById('christmasList');
    const searchInput = document.getElementById('searchInput');
    const searchPreview = document.getElementById('searchPreview');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    // Load saved songs when page loads
    loadSavedSongs();

    // Show upload form when upload button is clicked
    uploadBtn.addEventListener('click', function() {
        uploadForm.classList.remove('d-none');
        uploadBtn.classList.add('d-none');
    });

    // Handle cancel button
    cancelBtn.addEventListener('click', function() {
        titleInput.value = '';
        categoryInput.value = '';
        lyricsInput.value = '';
        uploadForm.classList.add('d-none');
        uploadBtn.classList.remove('d-none');
    });

    // Handle form submission
    submitBtn.addEventListener('click', function() {
        const title = titleInput.value.trim();
        const category = categoryInput.value.trim();
        const lyrics = lyricsInput.value.trim();

        if (title && lyrics && category) {
            // Create new song card
            const songCard = createSongCard(title, category, lyrics);
            
            // Add to appropriate list based on category
            if (category === 'carols') {
                carolsList.insertBefore(songCard, carolsList.firstChild);
                // Switch to carols tab
                document.getElementById('carols-tab').click();
            } else if (category === 'christmas') {
                christmasList.insertBefore(songCard, christmasList.firstChild);
                // Switch to christmas tab
                document.getElementById('christmas-tab').click();
            }

            // Save to localStorage
            saveSong(title, category, lyrics);

            // Reset form
            titleInput.value = '';
            categoryInput.value = '';
            lyricsInput.value = '';
            uploadForm.classList.add('d-none');
            uploadBtn.classList.remove('d-none');
        } else {
            alert('Please fill in all fields (title, category, and lyrics)');
        }
    });

    // Add search functionality
    searchInput.addEventListener('input', debounce(function(e) {
        const searchTerm = e.target.value.trim().toLowerCase();
        
        if (searchTerm.length === 0) {
            searchPreview.classList.add('d-none');
            return;
        }

        const songs = JSON.parse(localStorage.getItem('songs') || '[]');
        const matchingSongs = songs.filter(song => 
            song.title.toLowerCase().includes(searchTerm)
        );

        if (matchingSongs.length > 0) {
            searchPreview.innerHTML = matchingSongs
                .map(song => {
                    const highlightedTitle = highlightMatch(song.title, searchTerm);
                    return `
                        <div class="search-result-item" data-category="${song.category}">
                            ${highlightedTitle}
                            <small class="text-muted ms-2">(${song.category})</small>
                        </div>
                    `;
                })
                .join('');
            searchPreview.classList.remove('d-none');
        } else {
            searchPreview.innerHTML = `
                <div class="search-result-item text-muted">
                    No songs found
                </div>
            `;
            searchPreview.classList.remove('d-none');
        }
    }, 300));

    // Handle click on search result
    searchPreview.addEventListener('click', function(e) {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const category = resultItem.dataset.category;
            // Switch to appropriate tab
            document.getElementById(`${category}-tab`).click();
            // Clear search
            searchInput.value = '';
            searchPreview.classList.add('d-none');
        }
    });

    // Close search preview when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchPreview.contains(e.target) && e.target !== searchInput) {
            searchPreview.classList.add('d-none');
        }
    });

    // Debounce function to limit how often the search runs
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to highlight matching text
    function highlightMatch(text, searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function createSongCard(title, category, lyrics) {
        const div = document.createElement('div');
        div.className = 'song-card';
        div.draggable = true; // Make card draggable
        div.dataset.title = title;
        div.dataset.category = category;
        div.dataset.lyrics = lyrics;
        
        div.innerHTML = `
            <div class="song-header">
                <div class="drag-handle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16">
                        <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                </div>
                <div class="song-title">${title}</div>
                <span class="song-category badge bg-secondary">${category}</span>
            </div>
            <div class="song-lyrics">${lyrics}</div>
        `;

        // Add drag and drop event listeners
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('drop', handleDrop);

        return div;
    }

    // Add these new functions for drag and drop
    function handleDragStart(e) {
        this.classList.add('dragging');
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        // Save the new order to localStorage
        saveNewOrder();
    }

    function handleDragOver(e) {
        e.preventDefault();
        const draggingCard = document.querySelector('.dragging');
        const list = this.parentNode;
        const cards = [...list.querySelectorAll('.song-card:not(.dragging)')];
        
        const cardAfter = cards.find(card => {
            const box = card.getBoundingClientRect();
            const dragY = e.clientY;
            return dragY < box.top + box.height / 2;
        });

        if (cardAfter) {
            list.insertBefore(draggingCard, cardAfter);
        } else {
            list.appendChild(draggingCard);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
    }

    // Function to save the new order to localStorage
    function saveNewOrder() {
        const songs = [];
        const carolsCards = [...document.querySelectorAll('#carolsList .song-card')];
        const christmasCards = [...document.querySelectorAll('#christmasList .song-card')];
        
        [...carolsCards, ...christmasCards].forEach(card => {
            songs.push({
                title: card.dataset.title,
                category: card.dataset.category,
                lyrics: card.dataset.lyrics
            });
        });
        
        localStorage.setItem('songs', JSON.stringify(songs));
    }

    // Function to save song to localStorage
    function saveSong(title, category, lyrics) {
        let songs = JSON.parse(localStorage.getItem('songs') || '[]');
        songs.unshift({ title, category, lyrics }); // Add new song at the beginning
        localStorage.setItem('songs', JSON.stringify(songs));
    }

    // Function to load saved songs
    function loadSavedSongs() {
        const songs = JSON.parse(localStorage.getItem('songs') || '[]');
        
        // Clear existing songs
        carolsList.innerHTML = '';
        christmasList.innerHTML = '';
        
        songs.forEach(song => {
            const songCard = createSongCard(song.title, song.category, song.lyrics);
            
            if (song.category === 'carols') {
                carolsList.appendChild(songCard);
            } else if (song.category === 'christmas') {
                christmasList.appendChild(songCard);
            }
        });
    }

    // Add this to handle the search input changes
    searchInput.addEventListener('input', function(e) {
        // Show/hide clear button based on input value
        if (e.target.value) {
            clearSearchBtn.classList.remove('d-none');
        } else {
            clearSearchBtn.classList.add('d-none');
        }
    });

    // Add clear button functionality
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchPreview.classList.add('d-none');
        clearSearchBtn.classList.add('d-none');
        searchInput.focus(); // Optional: keep focus on search input after clearing
    });
}); 