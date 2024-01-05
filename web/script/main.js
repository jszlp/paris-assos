let state = {}
const clientHeight = document.body.clientHeight
const clientWidth = document.body.clientWidth
const sideBarWidth = document.querySelector('.layout__side-bar').clientWidth
const propertyMapper = {
    'city_committee': {
        'DDCT': 'DDCT', 'DAC': 'DAC', 'DJS': 'DJS', 'DASES': 'DASES', 'DAE': 'DAE', 'DFPE': 'DFPE', 'DASCO': 'DASCO', 'DPSP': 'DPSP', 'DPVI': 'DPVI',
        'DGRI': 'DGRI', 'DEVE': 'DEVE', 'DSOL': 'DSOL', 'DPMP': 'DPMP', 'DPE': 'DPE', 'DSP': 'DSP', 'DVD': 'DVD', 'SG': 'SG', 'DUCT': 'DUCT',
        'DGOM': 'DGOM', 'DLH': 'DLH', 'SG-MI-CINEMA': 'SG-MI-CINEMA', 'DU': 'DU', 'DTEC': 'DTEC', 'DRH': 'DRH', 'DFA': 'DFA', 'DICOM': 'DICOM',
        'CASVP': 'CASVP', 'DAJ': 'DAJ', 'DILT': 'DILT', 'SG-DPMC': 'SG-DPMC', 'SGCP': 'SGCP'
    },
    'township': {
        'unknown': 'Inconnue',
        'paris01': 'PARIS 01',
        'paris02': 'PARIS 02',
        'paris03': 'PARIS 03',
        'paris04': 'PARIS 04',
        'paris05': 'PARIS 05',
        'paris06': 'PARIS 06',
        'paris07': 'PARIS 07',
        'paris08': 'PARIS 08',
        'paris09': 'PARIS 09',
        'paris10': 'PARIS 10',
        'paris11': 'PARIS 11',
        'paris12': 'PARIS 12',
        'paris13': 'PARIS 13',
        'paris14': 'PARIS 14',
        'paris15': 'PARIS 15',
        'paris16': 'PARIS 16',
        'paris17': 'PARIS 17',
        'paris18': 'PARIS 18',
        'paris19': 'PARIS 19',
        'paris20': 'PARIS 20',
        'val_de_marne': 'Val-de-Marne',
        'yvelines': 'Yvelines',
        'seine_et_marne': 'Seine-et-Marne',
        'val_d_oise': "Val d'Oise",
        'hauts_de_seine': 'Hauts-de-Seine',
        'essonne': 'Essonne',
        'seine_saint_denis': "Seine-Saint-Denis"
    },
    'year': {
        '2013': '2013',
        '2014': '2014',
        '2015': '2015',
        '2016': '2016',
        '2017': '2017',
        '2018': '2018',
        '2019': '2019',
        '2020': '2020',
        '2021': '2021',
        '2022': '2022',
        '2023': '2023',
    },
    'activity': {
        'culture_arts': 'Culture & Arts', 'education_formation': 'Education & formation',
        'rights_interests_defense': 'Défense des droits et des intérêts', 'hobbies': 'Loisirs', 'social': 'Social',
        'precarity_exclusion': 'Précarité & Exclusion', 'association_help': 'Aides aux associations', 'sport': 'Sport', 'work': 'Emploi',
        'communication_media': 'Communication & média', 'humanitarian': 'Humanitaire', 'economy': 'Economie',
        'environment_ecology': 'Environnement & écologie', 'health': 'Santé', 'local_life': 'Vie et animation locale',
        'architecture_urban_planning': 'Architecture & urbanisme', 'memory': 'Mémoire', 'travel_means': 'Déplacements et transports',
        'international_relationships': 'Relations internationales', 'ideas_opinions': 'Idée & opinion', 'tourism': 'Tourisme',
        'technology_research': 'Technique & Recherche'
    },
    'aim_subvention': {
        'not_specified': 'Non précisée', 'project': 'Projet', 'operation': 'Fonctionnement', 'investment': 'Investissement'
    }
}
const checkboxes = {}
const locale = d3.formatLocale({
    "decimal": ".",
    "thousands": " ",
    "grouping": [3],
    "currency": ["", "€"]
})
const format = locale.format("$,.0f")
const titles = {
    'city_committee': "Subventions selon les directions sélectionnées",
    "activity": "Subventions selon les activités des associations sélectionnées",
    "township": "Subventions selon les localisations sélectionnées",
    "aim_subvention": "Subventions selon les natures des subventions sélectionnées",
    "year": "Montant des subventions selon les années sélectionnées",
    "rank": "Top 50 des associations les plus subventionnées"
}
const categoryMapper = { 'city_committee': 'Direction', 'activity': 'Activité', 'year': 'Année', 'township': 'Localisation', 'aim_subvention': 'Nature de la subvention' }
let svgs = {}
let charts = {}

for (const category in propertyMapper) {
    state[category] = {}
    checkboxes[category] = document.querySelectorAll(`.inputs__items.${category} input`)

    const chartContainer = document.querySelector(`.dashboard__chart.${category}`)
    const chartHeight = chartContainer.clientHeight
    const chartWidth = chartContainer.clientWidth
    svgs[category] = d3.select(chartContainer).append('svg').attr('class', 'chart')
        .attr('xmlns', "http://www.w3.org/2000/svg")
    addTitle(chartContainer, category)
    if (category === "township") {
        charts[category] = svgs[category]
            .append('g')
            .attr('id', d => `${category}_chart`)
    } else {
        const scaleRatio = clientWidth < 1200 ? (clientWidth < 850 ? clientWidth / 850 : clientWidth / 1200) : 1
        charts[category] = svgs[category]
            .append('g').attr('transform', 'translate(' + chartWidth / 2 + ',' + chartHeight / 2.3 + ')' + ' scale(' + 0.58 * scaleRatio + ')')
            .attr('id', d => `${category}_chart`)
    }

    for (const property in propertyMapper[category]) {
        state[category][property] = true
    }
}

svgs['rank'] = d3.select(`.dashboard__chart.rank`).append('svg').attr('class', 'chart')
    .attr('xmlns', "http://www.w3.org/2000/svg")
charts['rank'] = svgs['rank'].append('g')
    .attr('id', d => `rank_chart`)
addTitle(document.querySelector('.dashboard__chart.rank'), 'rank')

function addTitle(chartContainer, category) {
    const svgWidth = chartContainer.clientWidth
    const svgHeight = chartContainer.clientHeight
    const title = titles[category]
    const widthUnit = 15
    const titleLength = title.split('').length
    const titleSpaceWidth = svgWidth - 80
    const yOffset = 60
    const titleStep = 20
    let subTitles = [title]
    if ((titleLength * widthUnit) > titleSpaceWidth) {
        let splitIndex = Math.floor((svgWidth - 80) / widthUnit)
        while (title[splitIndex] !== " ") {
            splitIndex--
        }
        subTitles = [title.substring(0, splitIndex + 1), title.substring(splitIndex + 1)]
    }

    svgs[category].selectAll('text').data(subTitles).enter().append('text')
        .attr('class', 'chart_title')
        .attr('y', (d, i) => svgHeight - yOffset + titleStep * i)
        .attr('x', svgWidth / 2)
        .attr('text-anchor', 'middle')
        .text(d => d)
} 