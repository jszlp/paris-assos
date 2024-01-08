let assoData = {}
let assoToSubventionsMapper = []
const searchInput = document.querySelector('.search__bar-input')
let timeoutId = null
let res = []
const searchResult = document.querySelector('.search__result')
const layout = document.querySelector('.layout');
let resultItems = []
const detailsItems = document.querySelector('.details__items')
const title = document.querySelector('.details__title')
const detailPattern = document.querySelector('.details__item')
const displayedProperties = ['file_object','township', 'year', 'city_committee', 'activity', 'aim_subvention', 'subvention_amount']
const propertyMapper = { 'file_object': "Objet du dossier", "township": "Localisation", "year": "Année", "city_committee": "Direction", "activity": "Activité", "aim_subvention": "Nature de la subvention", "subvention_amount": "Montant de la subvention" }
let displayedIds = []
const locale = d3.formatLocale({
    "decimal": ".",
    "thousands": " ",
    "grouping": [3],
    "currency": ["", "€"]
})
const format = locale.format("$,.0f")

searchInput.addEventListener('input', (e) => search(e, 400))

searchInput.addEventListener('click', (e) => search(e, 0))

function search(e, delay = 400) {
    const val = e.target.value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[ -() "]/g)

    if (timeoutId) {
        clearTimeout(timeoutId)
    }
    clearSearchResult()
    timeoutId = setTimeout(() => { searchAndDisplayAssociation(val) }, delay)
}


function sendRequestForData() {
    axios({
        url: './assets/data/asso_data.json', headers: {
            'Accept': 'application/json',
        }
    }).then((res) => {
        assoData = res.data
        assoData.sort((a, b) => {
            if (a.name > b.name) return 1
            if (a.name <= b.name) return -1
        })
        assoToSubventionsMapper = assoData.map((e, i) => { return { 'name': e.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 'index': i } })
    })
}

function searchAndDisplayAssociation(val) {
    if (val.length === 1 && val[0] === "") {
        res = assoData
    }

    res = assoToSubventionsMapper.reduce((acc, e) => {
        let hasWordNotIncluded = false
        for (let word of val) {
            if (!e.name.includes(word)) {
                hasWordNotIncluded = true
            }
        }
        if (!hasWordNotIncluded) {
            acc.push(assoData[e.index])
        }
        return acc
    }, [])

    res.sort((a, b) => {
        if (a.name > b.name) return 1
        if (a.name <= b.name) return -1
    })

    if (!res.length) return

    resultItems = []

    res.forEach((e, i) => {
        const searchResultItem = document.createElement('div')
        searchResultItem.classList.add('search__result-item')
        if (i === 0) {
            searchResultItem.classList.add('first')
        }

        if (i === (res.length - 1)) {
            searchResultItem.classList.add('last')

        }
        searchResultItem.classList.add(i)
        searchResultItem.textContent = e.name
        searchResult.append(searchResultItem)
        searchResultItem.addEventListener('click', displayDetails)
    })

    searchResult.style.display = "grid"
}

function clearSearchResult() {
    const searchResultItems = searchResult.querySelectorAll('div')
    for (const item of searchResultItems) {
        item.remove()
    }
    searchResult.style.display = "none"
}

layout.addEventListener('click', hideSearchResult)

function hideSearchResult(event) {
    target = event.target
    if (target.classList.contains('search__result') | target.classList.contains('search__result-item')) return

    clearSearchResult()
}

function displayDetails(event) {
    removeDetails()
    const target = event.target
    const idx = target.classList[target.classList.length - 1]
    const data = res[idx]
    title.textContent = data.name + " :"

    for (let key in data.subventions) {
        const subvention = data.subventions[key]
        const base = detailPattern.cloneNode(true)
        base.id = subvention['file_id']
        displayedIds.push(subvention['file_id'])
        const title = base.querySelector('.details__item-title')
        const content = base.querySelector('.details__item-content')

        title.textContent = "Dossier : " + subvention.file_id
        title.style.backgroundColor = subvention["subvention_amount"] === '0' ? 'red' : 'green'

        for (let displayedProperty of displayedProperties) {
            const subContent = document.createElement('div')
            subContent.textContent = propertyMapper[displayedProperty] + " : " + ((displayedProperty === "subvention_amount") ? format(subvention[displayedProperty]) : subvention[displayedProperty])
            subContent.classList.add('subcontent')
            content.append(subContent)
        }
        base.style.display = 'grid'
        base.style.position = 'static'
        detailsItems.appendChild(base)
    }

    searchInput.value = data.name
    clearSearchResult()
}

function removeDetails(event) {
    for (let id of displayedIds) {
        const element = document.getElementById(id)
        element.remove()
    }
    displayedIds = []
}