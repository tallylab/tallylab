
/**
 * This function waits until the page is loaded.
 * This works by waiting until the loading image is hidden.
 * If a better criterion becomes evident this function can be easily changed.
 */
const waitUntilLoaded = async (page) => {
    await page.waitForSelector('#appLoader', {hidden: true})
}

exports.loadPage = async (page, url) => {
    await page.goto(url)
    await waitUntilLoaded(page)
}

/**
 * Presses the new tallier button
 */
exports.clickNewTallier = async page => {
    await page.click('.new-tallier')
    await waitUntilLoaded(page)
}

/**
 * Selects a collection
 */
exports.selectPremadeCollection = async (page, name) => {
    await page.click(`a[data-slug=${name}]`)
    await waitUntilLoaded(page);
}

/**
 * Installs the current tallies on a page
 */
exports.installSelectedTallies = async page =>  {
    await page.click("#installSelectedTallies")
    //here we should also awit until the url changes
    await page.waitForNavigation()
    await waitUntilLoaded(page);
}

/**
 * Toggles a given tally
 */
exports.toggleTallySelection = async (page, name) => {
    await page.click(`label[for=${name}]`)
}

/**
 * Toggles all tallies
 */
exports.toggleAllTallies = async page => {
    await page.click('#toggleCheckboxButtonList')
}

/**
 * Goes back to the collection selection page
 */
exports.backToCollections = async page => {
    await page.click("#backToCollectionTemplates")
    await waitUntilLoaded(page);
}