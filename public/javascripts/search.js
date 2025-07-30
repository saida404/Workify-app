let selectedFilter = '';

function setFilter(filterType) {
    selectedFilter = filterType;
    const button = document.getElementById("dropdownMenuButton");

    if (filterType === 'naziv') {
        button.textContent = 'Naziv konkursa';
    } else if (filterType === 'firma') {
        button.textContent = 'Firma';
    } else if (filterType === 'pozicija') {
        button.textContent = 'Pozicija';
    }

    document.getElementById("searchInput").value = '';
    searchCards();
}
function searchCards() {
    const searchInput = document.getElementById("searchInput").value.toUpperCase();
    const cards = document.getElementsByClassName("card-item");

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const title = card.querySelector("h2").textContent.toUpperCase();
        const firma = card.querySelector("p:nth-child(3)").textContent.toUpperCase();
        const pozicija = card.querySelector("p:nth-child(4)").textContent.toUpperCase();
        const grad = card.querySelector("p:nth-child(2)").textContent.toUpperCase();

        let matches = false;

        if (selectedFilter === 'naziv' && title.indexOf(searchInput) > -1) {
            matches = true;
        } else if (selectedFilter === 'firma' && firma.indexOf(searchInput) > -1) {
            matches = true;
        } else if (selectedFilter === 'pozicija' && pozicija.indexOf(searchInput) > -1) {
            matches = true;
        }

        if (matches) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    }
}