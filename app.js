// When the DOM content is fully loaded, this function is executed
document.addEventListener('DOMContentLoaded', function () {

    // Getting references to various HTML elements
    const pokedexContainer = document.getElementById('pokemonGrid');
    const searchInput = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const paginationContainer = document.getElementById('pagination');
    const showAllBtn = document.getElementById('showAllBtn');

    // Constants and variables for pagination
    const POKEMON_PER_PAGE = 20;
    let currentPage = 1;
    let totalPages = 1;

    // Arrays to store all Pokémon data
    let allPokemon = [];
    let filteredPokemon = [];

    // Fetch all Pokémon data from the API
    async function fetchAllPokemon() {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        return data.results;
    }

    // Fetch detailed data for a specific Pokémon
    async function fetchPokemonData(url) {
        const response = await fetch(url);
        const data = await response.json();

        // Fetch the sprite image for the Pokémon
        const spriteResponse = await fetch(data.sprites.front_default);
        const spriteData = await spriteResponse.blob();
        data.sprites.front_default = URL.createObjectURL(spriteData);

        return data;
    }

    // Render a card for a Pokémon
    function renderPokemonCard(pokemon) {
        // Creating elements for the card
        const card = document.createElement('div');
        card.classList.add('col', 's12', 'm6', 'l3', 'hoverable', 'card');
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('card-image');
        const image = document.createElement('img');
        image.classList.add('poke-image');
        image.src = pokemon.sprites.front_default;
        image.alt = `${pokemon.name} image`;
        imageContainer.appendChild(image);
        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');
        const name = document.createElement('span');
        name.classList.add('card-title');
        name.textContent = pokemon.name;
        cardContent.appendChild(name);
        card.appendChild(imageContainer);
        card.appendChild(cardContent);

        // Add click event listener to display more information about the Pokémon
        card.addEventListener('click', () => {
            displayPokemonInfo(pokemon);
        });

        return card;
    }

    // Display detailed information about a Pokémon in a modal
    function displayPokemonInfo(pokemon) {
        // Get the modal element
        const modal = document.getElementById('modalPokemonInfo');

        // Populate the modal with information about the Pokémon
        modal.innerHTML = `
            <div class="modal-content">
                <h4>${pokemon.name}</h4>
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name} image">
                <p><strong>Type:</strong> ${pokemon.types.map(type => type.type.name).join(', ')}</p>
                <p><strong>Height:</strong> ${(pokemon.height / 10).toFixed(2)} m</p>
                <p><strong>Weight:</strong> ${(pokemon.weight / 10).toFixed(2)} kg</p>
                <p><strong>Abilities:</strong> ${pokemon.abilities.map(ability => ability.ability.name).join(', ')}</p>
                <h5>Basic Stats:</h5>
                <div class="stats-chart">
                    ${pokemon.stats.map(stat => `
                        <div class="stat-bar">
                            <div class="stat-label">${stat.stat.name}</div>
                            <div class="stat-value">${stat.base_stat}</div>
                            <div class="stat-bar-inner" style="width: ${stat.base_stat * 2}px;"></div>
                        </div>
                    `).join('')}
                </div>
                <h5>Moves:</h5>
                <ul>
                    ${pokemon.moves.map(move => `<li>${move.move.name}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-footer">
                <a href="#!" class="modal-close waves-effect waves-green btn-flat">Close</a>
            </div>
        `;

        // Initialize and open the modal
        const instance = M.Modal.init(modal);
        instance.open();
    }

    // Render pagination buttons based on current page and total pages
    function renderPaginationButtons() {
        paginationContainer.innerHTML = '';

        // Create and append previous button
        const prevButton = createPaginationButton('< Prev', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPokemon();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Create and append page buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createPaginationButton(i, () => {
                currentPage = i;
                renderPokemon();
            });
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            paginationContainer.appendChild(pageButton);
        }

        // Create and append next button
        const nextButton = createPaginationButton('Next >', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPokemon();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    // Create a pagination button with specified text and click event handler
    function createPaginationButton(text, onClick) {
        const button = document.createElement('span');
        button.textContent = text;
        button.classList.add('pagination-btn');
        button.addEventListener('click', onClick);
        return button;
    }

    // Render all Pokémon on the page
    async function renderAllPokemon() {
        pokedexContainer.innerHTML = '';
        const allPokemonNames = await fetchAllPokemon();
        allPokemon = await Promise.all(allPokemonNames.map(async pokemon => {
            const pokemonData = await fetchPokemonData(pokemon.url);
            return pokemonData;
        }));
        filteredPokemon = allPokemon;
        totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
        currentPage = 1;
        renderPokemon();
    }

    // Render Pokémon based on current page
    function renderPokemon() {
        pokedexContainer.innerHTML = '';

        const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
        const endIndex = startIndex + POKEMON_PER_PAGE;
        const pokemonToRender = filteredPokemon.slice(startIndex, endIndex);

        // Render Pokémon cards in rows of four
        for (let i = 0; i < pokemonToRender.length; i += 4) {
            const row = document.createElement('div');
            row.classList.add('row');

            for (let j = i; j < i + 4 && j < pokemonToRender.length; j++) {
                const pokemon = pokemonToRender[j];
                const card = renderPokemonCard(pokemon);
                row.appendChild(card);
            }

            pokedexContainer.appendChild(row);
        }

        // Render pagination buttons
        renderPaginationButtons();
    }

    // Filter Pokémon based on search input
    function filterPokemon() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filteredPokemon = allPokemon.filter(pokemon => pokemon.name.includes(searchTerm));
        totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
        currentPage = 1;
        renderPokemon();
    }

    // Debounce function to delay filtering Pokémon on input
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

    // Debounced version of filterPokemon function
    const debouncedFilterPokemon = debounce(filterPokemon, 300);

    // Event listeners for search input and show all button
    searchInput.addEventListener('input', debouncedFilterPokemon);
    searchInputMobile.addEventListener('input', debouncedFilterPokemon);

    showAllBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInputMobile.value = '';
        filteredPokemon = allPokemon;
        totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
        currentPage = 1;
        renderPokemon();
    });

    // Initial rendering of all Pokémon
    renderAllPokemon();

});
