function percentageProportion(element, total) {
    const percentage = element / total * 100
    const truncatedPercentage = Math.trunc(percentage * 100) / 100
    return truncatedPercentage
}

function parentElementsClassNameSearch(element, className) {
    parentElement = element.parentElement

    if (parentElement == null) return false

    if (parentElement.classList.contains(className)) return true

    return parentElementsClassNameSearch(parentElement, className)
}

