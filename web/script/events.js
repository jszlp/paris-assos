const numberUncheckedCheckboxes = { 'township': 0, 'year': 0, 'city_committee': 0, 'activity': 0, 'aim_subvention': 0 }
const buttons = document.querySelectorAll('.filter__button')
const layout = document.querySelector('.layout')
const menuButton = document.querySelector('.side-bar__menu-button')
const backButton = document.querySelector('.back-button')
let timeoutIdCheckbox = null
let isEmpty = false
let timer = {}

for (let button of buttons) {
    button.addEventListener('click', clickFilterButton)
}

layout.addEventListener('click', hideInputsItems)

for (let category in checkboxes) {
    for (let checkbox of checkboxes[category]) {
        checkbox.addEventListener("click", checkboxEvent)
    }
}

function clickFilterButton(event) {
    button = event.target
    categoryButton = button.classList[button.classList.length - 1]

    targetInput = null, otherInputs = []
    document.querySelectorAll(`.inputs__items`).forEach(i => {
        if (i.classList.contains(categoryButton)) {
            targetInput = i
        } else {
            otherInputs.push(i)
        }
    })

    targetStyle = targetInput.style
    if (targetStyle.display == 'none' | targetStyle.display == "") {
        targetStyle.display = "grid"
    } else {
        targetStyle.display = "none"
    }

    otherInputs.forEach(i => i.style.display = 'none')
}

function hideInputsItems(event) {
    target = event.target

    if (target.classList.contains('filter') | target.classList.contains('inputs__items')) return

    isFilterChild = parentElementsClassNameSearch(target, 'filter')
    isInputsItemChild = parentElementsClassNameSearch(target, 'inputs__items')

    if (isFilterChild | isInputsItemChild) return

    inputs = document.querySelectorAll('.inputs__items')

    for (let input of inputs) {
        input.style.display = 'none'
    }
}

function checkboxEvent(event) {
    target = event.target
    checked = target.checked
    parent = target.parentElement
    grandParent = parent.parentElement
    property = parent.classList[parent.classList.length - 1]
    category = grandParent.classList[grandParent.classList.length - 1]

    if (property == "all") {
        if (checked == true) {
            for (let checkbox of checkboxes[category]) {
                checkbox.checked = true
            }
            for (let property in state[category]) {
                state[category][property] = true
            }
            numberUncheckedCheckboxes[category] = 0
        } else {
            for (let checkbox of checkboxes[category]) {
                checkbox.checked = false
            }
            for (let property in state[category]) {
                state[category][property] = false
            }
            numberUncheckedCheckboxes[category] = Object.keys(propertyMapper[category]).length
        }
    }
    else {
        state[category][property] = checked ? true : false
        allCheckbox = grandParent.querySelector('.inputs__item.all input')
        numberUncheckedCheckboxes[category] = checked ? numberUncheckedCheckboxes[category] - 1 : numberUncheckedCheckboxes[category] + 1
        allCheckbox.checked = (numberUncheckedCheckboxes[category] == 0) ? true : false
    }

    if (timeoutIdCheckbox) {
        clearTimeout(timeoutIdCheckbox);
    }
    loading(false)
    loading(true)
    updateFilterState()
    timeoutIdCheckbox = setTimeout(() => {
        aggData = {}
        isEmpty = false
        tmpData = {}
        ranking = { 'name': 'Total', 'children': [] }
        prepareAggData()
        prepareRankData()
        prepareTmpData(data, tmpData, ['township', 'year', 'city_committee', 'activity', 'aim_subvention'], 0)
        populateAggData(tmpData, ['township', 'year', 'city_committee', 'activity', 'aim_subvention'], 0)
        loading(false)
        makePieChart('city_committee')
        makePieChart('activity')
        makePieChart('aim_subvention')
        makeBarChart('year')
        makeGeoChart('township')
        makeRankChart()
    }, 2000)
}

function loading(isLoading) {
    if (isLoading) {
        const loaderData = []
        for (let k = 0; k < 12; k++) {
            loaderData.push(1)
        }
        const loaderPie = d3.pie().padAngle(0.2)(loaderData)
        const arcMkr = d3.arc().innerRadius(20).outerRadius(40)

        for (let category in charts) {
            const chart = charts[category]
            chart.selectAll('g').remove()
            chart.selectAll('rect').remove()
            chart.selectAll('path').remove()
            chart.selectAll('text').remove()

            const loader = chart.append('g').attr('class', 'loader')

            if (category === 'rank' || category === 'township') {
                const chartContainer = document.querySelector(`.dashboard__chart.${category}`)
                const chartHeight = chartContainer.clientHeight
                const chartWidth = chartContainer.clientWidth
                loader.attr('transform', 'translate(' + chartWidth / 2 + ',' + chartHeight / 2.3 + ')')
            }

            loader.selectAll('path')
                .data(loaderPie)
                .enter()
                .append('path')
                .attr('d', arcMkr)
                .attr('fill', 'grey')
                .attr('opacity', d => d.index / loaderData.length)
            timer[category] = d3.interval((elapsed) => {
                chart.selectAll('path')
                    .each(function (e) {
                        const loaderPart = d3.select(this)
                        const opacity = loaderPart.attr('opacity')
                        let newOpacity = opacity - (0.7 / loaderData.length)
                        if (newOpacity <= 0) {
                            newOpacity = 1
                        }
                        loaderPart.attr("opacity", newOpacity)
                    })
            }, 50)
        }
    } else {
        for (let category in charts) {
            timer[category]?.stop()
            charts[category].select('.loader').remove()
        }
    }
}

function updateFilterState() {
    const filterState = {}
    for (let category in state) {
        const values = state[category]
        filterState[category] = []
        let isAtLeastOneFalse = false
        for (let value in values) {
            if (values[value]) {
                filterState[category].push(propertyMapper[category][value])
            }
        }
        const filterStateItem = document.querySelector(`.filter-state__item.${category}`)
        if (!filterState[category].length) {
            filterStateItem.textContent = categoryMapper[category] + ' :' + "Aucun"
        } else if (filterState[category].length === Object.keys(propertyMapper[category]).length) {
            filterStateItem.textContent = categoryMapper[category] + ' :' + "Tous"
        } else {
            filterStateItem.textContent = categoryMapper[category] + ' : ' + filterState[category].join(',')
        }
    }
}