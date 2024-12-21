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

    const HIDDEN_SONGS_KEY = 'hiddenSongs';

    // Load saved songs when page loads
    loadSavedSongs().catch(error => {
        console.error('Error in loadSavedSongs:', error);
    });

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
                    const isHidden = document.querySelector(
                        `.song-card[data-title="${song.title}"].d-none`
                    );
                    
                    return `
                        <div class="search-result-item" data-category="${song.category}" 
                             data-title="${song.title}" data-lyrics="${song.lyrics}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    ${highlightedTitle}
                                    <small class="text-muted ms-2">(${song.category})</small>
                                </div>
                                ${isHidden ? `
                                    <button class="btn btn-sm btn-outline-primary show-song-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                                        </svg>
                                        Show in Home
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                })
                .join('');
            searchPreview.classList.remove('d-none');

            // Add event listeners to show buttons
            const showButtons = searchPreview.querySelectorAll('.show-song-btn');
            showButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const resultItem = this.closest('.search-result-item');
                    const title = resultItem.dataset.title;
                    const category = resultItem.dataset.category;
                    const lyrics = resultItem.dataset.lyrics;

                    // Find and show the hidden song card
                    const hiddenCard = document.querySelector(
                        `.song-card[data-title="${title}"].d-none`
                    );
                    if (hiddenCard) {
                        hiddenCard.classList.remove('d-none');
                        // Remove from hidden songs list
                        let hiddenSongs = JSON.parse(localStorage.getItem(HIDDEN_SONGS_KEY) || '[]');
                        hiddenSongs = hiddenSongs.filter(songTitle => songTitle !== title);
                        localStorage.setItem(HIDDEN_SONGS_KEY, JSON.stringify(hiddenSongs));
                        
                        // Switch to appropriate tab
                        document.getElementById(`${category}-tab`).click();
                        // Clear search
                        searchInput.value = '';
                        searchPreview.classList.add('d-none');
                        clearSearchBtn.classList.add('d-none');
                    }
                });
            });
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
        div.draggable = true;
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
                <button class="btn btn-link text-danger remove-btn ms-2" title="Remove from view">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708"/>
                    </svg>
                </button>
            </div>
            <div class="song-lyrics">${lyrics}</div>
        `;

        // Add event listener for remove button
        const removeBtn = div.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            div.classList.add('d-none');
            // Save hidden state
            let hiddenSongs = JSON.parse(localStorage.getItem(HIDDEN_SONGS_KEY) || '[]');
            if (!hiddenSongs.includes(title)) {
                hiddenSongs.push(title);
                localStorage.setItem(HIDDEN_SONGS_KEY, JSON.stringify(hiddenSongs));
            }
        });

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
    async function saveNewOrder() {
        try {
            const songs = [];
            const carolsCards = [...document.querySelectorAll('#carolsList .song-card')];
            const christmasCards = [...document.querySelectorAll('#christmasList .song-card')];
            
            [...carolsCards, ...christmasCards].forEach(card => {
                if (!card.classList.contains('d-none')) {
                    songs.push({
                        title: card.dataset.title,
                        category: card.dataset.category,
                        lyrics: card.dataset.lyrics
                    });
                }
            });
            
            // Save to localStorage
            localStorage.setItem('songs', JSON.stringify(songs));
            console.log('Updated songs order:', JSON.stringify({ songs: songs }, null, 2));
        } catch (error) {
            console.error('Error saving order:', error);
            alert('Error saving order. Please try again.');
        }
    }

    // Update the saveSong function
    async function saveSong(title, category, lyrics) {
        try {
            // Get current songs from songs.txt
            const response = await fetch('songs.txt');
            const text = await response.text();
            const data = JSON.parse(text);
            let songs = data.songs || [];

            // Add new song at the beginning
            songs.unshift({ title, category, lyrics });

            // Create the updated songs data
            const songsData = JSON.stringify({ songs: songs }, null, 2);

            try {
                // Request permission to access files
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'songs.txt',
                    types: [{
                        description: 'Text Files',
                        accept: {'text/plain': ['.txt']},
                    }],
                });

                // Create a FileSystemWritableFileStream to write to
                const writable = await handle.createWritable();

                // Write the contents
                await writable.write(songsData);
                await writable.close();

                // Also update localStorage
                localStorage.setItem('songs', JSON.stringify(songs));
                
                alert('Song added successfully and saved to songs.txt!');
            } catch (writeError) {
                console.error('Error writing to file:', writeError);
                alert('Could not save to songs.txt. Please check console for details.');
            }
        } catch (error) {
            console.error('Error saving song:', error);
            alert('Error saving song. Please try again.');
        }
    }

    // Function to load saved songs
    async function loadSavedSongs() {
        try {
            // Load from songs.txt first
            const response = await fetch('songs.txt');
            const text = await response.text();
            const data = JSON.parse(text);
            const songs = data.songs;
            
            // Save to localStorage
            localStorage.setItem('songs', JSON.stringify(songs));
            
            // Display songs
            displaySongs(songs);
        } catch (error) {
            console.error('Error loading songs:', error);
            // Fallback to localStorage if songs.txt fails
            const songs = JSON.parse(localStorage.getItem('songs') || '[]');
            displaySongs(songs);
        }
    }

    // Add new function to display songs
    function displaySongs(songs) {
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