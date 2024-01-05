let data = null
let tmpData = {}
let aggData = {}
let geoData = null
let orderedCategories = ['township', 'year', 'city_committee', 'activity', 'aim_subvention']
let ranking = { 'name': 'Total', 'children': [] }
let assoData = null

function populateAggData(d, categories, depth) {
    if (!depth) {
        for (let key in d) {
            if (state[categories[depth]][key]) {
                aggData[categories[depth]]['total'] += parseInt(d[key]['total'])
                aggData[categories[depth]]['data'][key] += parseInt(d[key]['total'])
                populateAggData(d[key], categories, depth + 1)
            }
        }
    }
    if (depth == categories.length - 1) {
        for (let key in d) {
            if (state[categories[depth]][key]) {
                aggData[categories[depth]]['total'] += parseInt(d[key]['total'])
                aggData[categories[depth]]['data'][key] += parseInt(d[key]['total'])
            }
        }
        return
    }
    if (depth) {
        for (let key in d) {
            if (state[categories[depth]][key]) {
                aggData[categories[depth]]['total'] += parseInt(d[key]['total'])
                aggData[categories[depth]]['data'][key] += parseInt(d[key]['total'])
                populateAggData(d[key], categories, depth + 1)
            }
        }
    }
}

function prepareAggData() {
    for (let category in state) {
        let oneAtLeastTrue = false
        aggData[category] = { "total": 0, "data": {} }
        for (let property in state[category]) {
            if (state[category][property]) {
                oneAtLeastTrue = true
                aggData[category]['data'][property] = 0
            }
        }
        if (!oneAtLeastTrue) {
            aggData = {}
            isEmpty = true
            return;
        }
    }
}

function prepareTmpData(d, tmpD, categories, depth, ranking) {
    let tot = 0
    if (depth == categories.length - 1) {
        for (let key in d) {
            if (state[categories[depth]][key]) {
                tmpD[key] = d[key]
                tot += parseInt(d[key]['total'])
            }
        }
        return tot
    }
    if (!depth) {
        for (let key in d) {
            if (state[categories[depth]][key]) {
                tmpD[key] = {}
                tmpD[key]['total'] = prepareTmpData(d[key], tmpD[key], categories, depth + 1, ranking)
                tot += tmpD[key]['total']
            }
        }
        tmpD['total'] = tot
    }
    if (depth) {
        for (let key in d) {
            if (state[categories[depth]][key]) {
                tmpD[key] = {}
                tmpD[key]['total'] = prepareTmpData(d[key], tmpD[key], categories, depth + 1, ranking)
                tot += tmpD[key]['total']
            }
        }
        return tot
    }
}

function prepareRankData() {
    function computeVal(cat,prop) {
        for (const [key, val] of Object.entries(propertyMapper[cat])) {
            if ( val === prop) {
                return key
            }
        }
    }

    for (const asso of assoData) {
        asso['tot'] = 0
        const subventions = asso.subventions
        for (const subvention of Object.keys(subventions)) {
            let isSelected = true
            for (const key of Object.keys(subventions[subvention])) {
                if (state[key] !== undefined) {
                    const val = computeVal(key, subventions[subvention][key])
                    if (state[key][val] === false) {
                        isSelected = false
                        break
                    }
                }
            }
            if (isSelected) {
                asso['tot'] += parseInt(subventions[subvention]['subvention_amount'])
            }
        }
    }
    assoData.sort((a,b) => b.tot - a.tot)
    ranking.children = [...assoData.slice(0,100)]
    ranking.children = ranking.children.map(e => {
        return { "association" : e.name, 'subvention_amount': e['tot'], "township": e.subventions[0].township}
    })
}

function sendRequestForData() {
    axios({
        url: './assets/data/asso_data.json', headers: {
            'Accept': 'application/json',
        }
    }).then((res) => {
        assoData = res.data
    }).then(() => {
        return axios({
            url: './assets/data/data.json', headers: {
                'Accept': 'application/json',
            }
        })
    }).then((res) => {
        data = res.data
    }).then(() => {
        return axios({
            url: './assets/data/data.geojson', headers: {
                'Accept': 'application/json',
            }
        })
    }).then((res) => {
        geoData = res.data
        prepareAggData()
        prepareRankData()
        prepareTmpData(data, tmpData, orderedCategories, 0)
        populateAggData(tmpData, orderedCategories, 0)
        makePieChart('city_committee')
        makePieChart('activity')
        makePieChart('aim_subvention')
        makeBarChart('year')
        makeRankChart()
        makeGeoChart('township')
    })
}