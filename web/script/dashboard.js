function makePieChart(
    category,
    innerRadiusPieChart = 100,
    outerRadiusPieChart = 200,
    radiusLegenLineStart = 185,
    radiusLegendLineFlexion = 200,
    radiusLabels = 250,
    padAngle = 0.005,
    cornerRadius = 0,
    tensionLegendLine = 1,
    colorLegendLine = 'black',
    offsetXLegendLabels = 10,
    colorLegendLabels = 'black',
    shouldKeepUnifiedColor = false,
    step = 2,
    heightLabelArea = 20,
) {

    const chart = charts[category]

    // Removing existing graph :

    chart.selectAll('path').remove()
    chart.selectAll('text').remove()

    // Early return : 

    if (Object.keys(aggData).length === 0) return

    // Initializing data : 

    const uData = aggData[category]

    let gData = Object.keys(uData['data']).reduce((acc, key) => {
        const proportion = percentageProportion(uData['data'][key], uData['total'])
        if (proportion === 0) { return acc }
        if (proportion < 0.5) {
            acc[0]['details'].push({ category: key, 'proportion': proportion, 'total': uData['data'][key] })
            acc[0]['total'] += uData['data'][key]
            return acc
        }
        acc.push({ category: key, 'total': uData['data'][key], 'details': [{ category: key, 'proportion': proportion, 'total': uData['data'][key] }] })
        return acc
    }, [{ category: 'Autres', 'total': 0, 'details': [] }])

    if (!gData[0].details.length) {
        gData = gData.slice(1)
    }

    // Intializing tools : 

    const pie = d3.sort(d3.pie().padAngle(padAngle).value(d => d['total'])(gData), d => d.index)
    const scC = d3.scaleOrdinal().domain(gData.map(d => d.category)).range(d3.schemeSet3)
    const arcMkr = d3.arc().innerRadius(innerRadiusPieChart).outerRadius(outerRadiusPieChart).cornerRadius(cornerRadius)

    // Initializing label tools : 

    const middleAngles = pie.map((d) => (d['endAngle'] + d['startAngle']) / 2)
    let leftLabelAngles = middleAngles.filter((theta) => theta > Math.PI)
    let rightLabelAngles = middleAngles.filter((theta) => theta < Math.PI)

    function labelAnglesOptimization(angles, side, step, heightLabelArea) {
        let yPosLabels = angles.map((e) => radiusLabels * Math.cos(e))
        if (side === 'right') {
            yPosLabels = yPosLabels.reverse()
        }
        let condition = false
        while (!condition) {
            let stopIndex = 0;
            for (let idx = 0; idx < (yPosLabels.length - 1); idx++) {
                if ((yPosLabels[idx] + heightLabelArea) > yPosLabels[idx + 1]) {
                    stopIndex = idx
                    break
                }
                if (idx === (yPosLabels.length - 2)) {
                    condition = true
                }
            }
            if (!condition) {
                yPosLabels[stopIndex] -= step
            }
        }
        return side === 'right' ?
            yPosLabels.map(e => Math.acos(e / radiusLabels)).reverse()
            : yPosLabels.map(e => (2 * Math.PI) - Math.acos(e / radiusLabels))
    }

    // Initializing label data :

    leftLabelAngles = leftLabelAngles.length > 1 ? labelAnglesOptimization(leftLabelAngles, 'left', step, heightLabelArea) : leftLabelAngles
    rightLabelAngles = rightLabelAngles.length > 1 ? labelAnglesOptimization(rightLabelAngles, 'right', step, heightLabelArea) : rightLabelAngles

    const labelAngles = [...rightLabelAngles, ...leftLabelAngles]

    let labelData = {}

    for (let index = 0; index < pie.length; index++) {
        labelData[pie[index].data.category] = [{ r: radiusLegenLineStart, theta: middleAngles[index] },
        { r: radiusLegendLineFlexion, theta: middleAngles[index] },
        { r: radiusLabels, theta: labelAngles[index] }]
    }

    // Generating elements : 

    chart.selectAll('path').data(pie).enter()
        .append("path").attr('d', arcMkr)
        .attr('id', d => `${d.data.category}_pie_part`)
        .attr('class', 'pie_part')
        .attr('fill', scC)

    if (Object.keys(labelData).length == 1) {
        const key = Object.keys(labelData)[0]
        chart.append('text')
            .attr('id', `${key}_label`)
            .attr('class', 'label')
            .text(propertyMapper[category][key])
            .attr('text-anchor', 'middle')
            .attr('stroke', shouldKeepUnifiedColor ? scC(index) : colorLegendLabels)
    } else {
        for (let index in labelData) {
            chart.append('path')
                .attr('id', `${index}_legend_line`)
                .attr('class', 'legend_line')
                .attr('d', d3.lineRadial().radius(d => d['r']).angle(d => d['theta']).curve(d3.curveCardinal.tension(tensionLegendLine))(labelData[index]))
                .attr('stroke', shouldKeepUnifiedColor ? scC(index) : colorLegendLine)
                .attr('fill', 'none')

            let offsetX = 0
            let textAnchor = null

            const theta = labelData[index][labelData[index].length - 1]['theta']
            const radius = labelData[index][labelData[index].length - 1]['r']

            const x = radius * Math.sin(theta)
            const y = - radius * Math.cos(theta)


            if ((0 <= theta) && (theta < Math.PI)) {
                offsetX += offsetXLegendLabels
                textAnchor = 'start'
            } else {
                offsetX -= offsetXLegendLabels
                textAnchor = 'end'
            }

            chart.append('text')
                .attr('id', `${index}_label`)
                .attr('class', 'label')
                .attr('x', x + offsetX)
                .attr('y', y)
                .text(propertyMapper[category][index] || "Autres")
                .attr('text-anchor', textAnchor)
                .attr('stroke', shouldKeepUnifiedColor ? scC(index) : colorLegendLabels)
        }
    }

    chart.selectAll('.pie_part')
        .each(function (e) {
            for (let k = 0; k < e.data.details.length; k++) {
                e.data.details[k]['total'] = format(e.data.details[k]['total'])
            }
            d3.select(this).call(addHover, chart, e.data.details, category, { "category": 'Categorie', 'proportion': 'Proportion', 'total': 'Montant alloué' })
        })
}

function addHover(piePart, chart, data, category, dStructure) {
    const [layout, height, width] = computeDetailsLayout(data, dStructure)
    let scale = 1.2
    if (category === "township") {
        scale = 0.65
    }
    const g = chart.append('g').attr('transform', 'scale(' + scale + ')')
    const heightSVG = svgs[category].node().clientHeight
    const widthSVG = svgs[category].node().clientWidth
    let posX = 0
    if (category === 'rank') {
        posX = piePart.data()[0].x0
    }
    piePart.on('mouseenter', function (event) {
        const pt = d3.pointer(event)
        let xOffset = pt[0] + 50
        if (category === 'rank' || category === 'township') {
            if ((posX + pt[0]) <= (widthSVG / 2)) {
                xOffset = pt[0] + 50
            } else {
                xOffset = pt[0] - 50 - scale * width
            }
        } else {
            if (pt[0] > 0) {
                xOffset = pt[0] - 50 - width
            }
        }
        g.append('rect')
            .attr("x", xOffset)
            .attr("y", pt[1] - (height / 2))
            .attr('height', height)
            .attr('width', width)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', 'white')
            .attr('opacity', 1)
            .attr('stroke', 'black')

        g.selectAll('text')
            .data(layout)
            .enter()
            .append('text')
            .attr('x', d => {
                return xOffset + d['x']
            })
            .attr('y', d => {
                return pt[1] - (height / 2) + d['y']
            })
            .text(d => (category !== 'rank') && propertyMapper[category][d['content']] ? propertyMapper[category][d['content']] : d['content'])
            .attr('stroke', 'black')
    })
        .on('mousemove', function (event) {
            const pt = d3.pointer(event)
            let xOffset = pt[0] + 50
            if (category === 'rank' || category === 'township') {
                if ((posX + pt[0]) <= (widthSVG / 2)) {
                    xOffset = pt[0] + 50
                } else {
                    xOffset = pt[0] - 50 - scale * width
                }
            } else {
                if (pt[0] > 0) {
                    xOffset = pt[0] - 50 - width
                }
            }
            g.select('rect')
                .attr("x", xOffset)
                .attr("y", pt[1] - (height / 2))

            g.selectAll('text')
                .attr('x', d => xOffset + d['x'])
                .attr('y', d => {
                    return pt[1] - (height / 2) + d['y']
                })
        })
        .on('mouseleave', function () {
            g.selectAll('rect').remove()
            g.selectAll('text').remove()
        }
        )
}

function computeDetailsLayout(data, dStructure) {
    const heightUnit = 10
    const widthUnit = 13
    const padding = 15

    data.splice(0, 0, dStructure)

    let dim = Object.keys(data[0]).reduce((acc, el) => {
        acc[el] = el.length * widthUnit
        return acc
    }, {})

    for (let d of data) {
        dim = Object.keys(d).reduce((acc, el) => {
            if (Object.keys(acc)[0] === 'details') {
                if (d[el].toString().length * widthUnit > acc['details']) {
                    acc['details'] = d[el].toString().length * widthUnit
                }
            }
            if (d[el].toString().length * widthUnit > acc[el]) {
                acc[el] = d[el].toString().length * widthUnit
            }
            return acc
        }, dim)
    }

    const height = padding + (padding + heightUnit) * data.length
    const width = (1 + Object.keys(dim).length) * padding + Object.keys(dim).reduce((acc, el) => {
        acc += dim[el]
        return acc
    }, 0)

    const layout = []

    for (let idxD = 0; idxD < data.length; idxD++) {
        layout[idxD] = []
        d = data[idxD]
        properties = Object.keys(d)
        for (let idxP = 0; idxP < properties.length; idxP++) {
            const coord = {}
            coord['x'] = !idxP ? padding : (layout[idxD][idxP - 1]['x'] + padding + dim[properties[idxP - 1]])
            coord['y'] = (padding + heightUnit) * (idxD + 1)
            coord['content'] = d[properties[idxP]]
            layout[idxD].push(coord)
        }
    }
    return [layout.flat(), height, width]
}

function makeBarChart(category) {

    // Selecting chart : 

    const chart = charts[category]


    // Removing existing graph :

    chart.selectAll('g').remove()
    chart.selectAll('rect').remove()

    // Early return : 

    if (Object.keys(aggData).length === 0) return


    const uData = aggData[category]

    // Prepare data : 

    const gData = Object.keys(uData['data']).map((key) => {
        return { category: key, total: uData['data'][key] }
    })

    // Variables :

    const chartContainer = document.querySelector(`.dashboard__chart.${category}`)
    const chartWidth = chartContainer.clientWidth
    const chartHeight = chartContainer.clientHeight


    // Initializing tools :

    const scX = d3.scaleBand().domain(gData.map(d => d.category)).range([(-4 / 10) * chartWidth, (4 / 10) * chartWidth]).padding(0.3)
    const scC = d3.scaleOrdinal().domain(gData.map(d => d.category)).range(d3.schemeSet3)
    const scY = d3.scaleLinear().domain([0, d3.max(gData, d => d.total)]).range([(4 / 10) * chartHeight, - (4 / 10) * chartHeight]).nice()

    // Creating graph :

    chart.append('g')
        .attr('transform', 'translate(' + 0 + ',' + scY.range()[0] + ')')
        .call(d3.axisBottom(scX))
    chart.append('g')
        .attr('transform', 'translate(' + scX.range()[0] + ',' + 0 + ')')
        .call(d3.axisLeft(scY).ticks(5).tickFormat(d3.format(".2s")))

    chart.selectAll('rect').data(gData).enter()
        .append('rect')
        .attr('x', d =>
            scX(d.category)
        )
        .attr('y', d =>
            scY(d.total)
        )
        .attr('width', scX.bandwidth())
        .attr('height', d => {
            return scY.range()[0] - scY(d.total)
        })
        .attr('fill', d => {
            return scC(d.category)
        })
        .each(function (e) {
            e['total'] = format(e['total'])
            d3.select(this).call(addHover, chart, [e], category, { "category": 'Année', 'total': 'Montant alloué' })
        })
}

function makeGeoChart(category) {

    // Selecting chart : 

    const chart = charts[category]

    // Removing existing graph :

    chart.selectAll('g').remove()


    // Early return : 

    if (Object.keys(aggData).length === 0) return

    // Preparing data :

    const idf_codes = ['essonne', 'yvelines', 'val_d_oise', 'seine_et_marne', 'seine_saint_denis', 'val_de_marne', 'hauts_de_seine', 'unknown']

    const paris_data = {
        "type": "FeatureCollection",
        "features": geoData.features.filter((el) => !idf_codes.includes(el.properties.code))
    }

    let geoAggData = aggData['township'].data
    const tot = aggData['township']['total']
    geoAggData = Object.keys(geoAggData)
        .filter(e => {
            return !idf_codes.includes(e)
        })
        .map(e => {
            const tmp = {}
            tmp[e] = geoAggData[e]
            return tmp
        })
        .toSorted((a, b) => {
            const keyA = Object.keys(a)[0]
            const keyB = Object.keys(b)[0]
            return a[keyA] - b[keyB]
        })
        .map((e, i) => {
            return { ...e, 'index': i }
        })
        .reduce((acc, e) => {
            acc[Object.keys(e)[0]] = e
            return acc
        }, {})

    // Initializing tools :

    const chartWidth = clientWidth < 1400 ? ( clientWidth - 40 ) : clientWidth * 0.8
    const scC = d3.scaleQuantile().domain(d3.extent(Object.keys(geoAggData).map(e => geoAggData[e]['index']))).range(d3.schemeBlues[9])
    const projection_paris = d3.geoMercator().fitSize([chartWidth, 300], paris_data)
    const path_paris = d3.geoPath().projection(projection_paris)

    chart
        .append('g')
        .attr('class', 'paris_chart')
        .attr('transform', 'translate(' + 0 + ',' + (500 - 400) / 2 + ')')
        .selectAll("path")
        .data(paris_data.features)
        .enter()
        .append('path')
        .attr("d", path_paris)
        .attr('stroke', "black")
        .attr('stroke-width', 1.5)
        .attr('fill', d => geoAggData[d.properties.code] ? scC(geoAggData[d.properties.code]['index']) : "white")
        .each(function (e) {
            const code = e.properties.code
            if (state['township'][code]) {
                const t = aggData['township'].data[code]
                const d = { category: code, proportion: percentageProportion(t, tot), total: format(t) }
                d3.select(this).call(addHover, chart, [d], category, { "category": 'Localisation', 'proportion': 'Proportion', 'total': 'Montant alloué' })
            }
        })
}

function makeRankChart() {

    const category = 'rank'
    // Selecting chart : 

    const chart = charts[category]

    // Removing existing graph :

    chart.selectAll('g').remove()

    // Intializing tools :

    const chartWidth = clientWidth < 1400 ? clientWidth : clientWidth * 0.8
    const scaleX = clientWidth < 1400 ? (chartWidth - 120) / chartWidth : (chartWidth - 100) / chartWidth
    const treemap = d3.treemap().tile(d3.treemapSquarify)
        .size([chartWidth, 400])
        .padding(1)
        .round(true)

    const data = d3.hierarchy(ranking).sum(d => d['subvention_amount'])

    const root = treemap(data)

    const scC = d3.scaleOrdinal(d3.schemeSet3).domain(ranking.children.map(d => d.subvention_amount))

    const leaf = chart.attr('transform', 'translate(' + 40 + ',' + ( 500 - root.y1 ) / 2 + ') scale(' + scaleX + "," + 0.75 + ')')
        .selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr("transform", d => `translate(${d.x0},${d.y0})`)

    leaf.append('rect')
        .attr("id", d => `case${d.x0}${d.y0}`)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr('fill', d => scC(d.value))

    leaf.append('clipPath')
        .attr('id', d => `${d.x0}${d.y0}`)
        .append('rect')
        .attr('x', 5)
        .attr('y', 5)
        .attr("width", d => d.x1 - d.x0 - 10)
        .attr("height", d => d.y1 - d.y0 - 10)


    leaf.append('text')
        .attr('clip-path', d => `url(#${d.x0}${d.y0})`)
        .selectAll('tspan')
        .data(d => [d.data.association, format(d.data.subvention_amount)])
        .join('tspan')
        .attr('x', 10)
        .attr('y', (d, i) => 20 * (1 + i))
        .text(d => d)

    function computeInput(d) {
        const map = { 'association': "Association", 'township': 'Localisation', 'year': 'Année', 'city_committee': 'Comité', 'activity': "Activité", "subvention_amount": 'Montant alloué', 'aim_subvention': 'Nature de la subvention' }
        return ['association', 'township', 'subvention_amount'].map(el => {
            const res = {}
            res[el] = `${map[el]} : ${d[el]}`
            return res
        })
    }

    leaf.each(function (e) {
        const d = e.data
        d.subvention_amount = format(d.subvention_amount)
        const input = computeInput(d)
        d3.select(this).call(addHover, chart.append('g').attr('transform', `translate(${e.x0},${e.y0}) scale(0.7)`), input, 'rank', { 'details': 'Détails' })
    })
}