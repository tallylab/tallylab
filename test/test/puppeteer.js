const puppeteer = require('puppeteer');
const { expect } = require('chai');
const fs = require('fs')
const actions = require('./actions');
const liveServer = require('live-server')
const serverConfig = {
    port: 8080,
    host: "127.0.0.1",
    root: "./..",
    open: false,
    ignore: 'test',
    wait: 0,
    logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
}
const puppeteerConfig = {
    headless: true,
    userDataDir: './userData',
}

describe('Test new user', async () => {
    let browser;
    let page;
    const collectionOptions = ["Chores", "Fitness", "Medications", "Civics", "Food", "Menstrual Cycle", "Mood", "Symptoms", "Supplements", "Custom"]
    const choreTallies = [" Replace AC Filter", " Clean Bathroom 1", " Clean Bathroom 2", " Clean Fridge", " Clear Gutters", " Dust", " Mop", " Sweep", " Vaccuum", " Water Plants"]
    const choresToSelect = ['replace-ac-filter', 'clean-fridge', 'mop', 'water-plants']


    before(async function () {
        //make sure that the user data directory is cleared. Otherwise we will appear as a returning user
        if (puppeteerConfig.userDataDir) {
            fs.rmdirSync(puppeteerConfig.userDataDir, { recursive: true })
        }
        //start the server
        liveServer.start(serverConfig)
        browser = await puppeteer.launch(puppeteerConfig)
        page = await browser.newPage()
    })

    after(async () => {
        await page.close()
        await browser.close()
        liveServer.shutdown()
    })

    it('Load Home Page', async () => {
        await actions.loadPage(page, 'http://localhost:8080')
    }).timeout(0)

    it('Choose New Adventure', async () => {
        await actions.clickNewTallier(page)
    })

    it('View Collections', async () => {
        let collectionTitles = await page.$$eval('#collectionSelection span[name=title]', titles => titles.map(title => title.innerText))
        expect(collectionTitles).to.eql(collectionOptions)
    })

    it('Chose Chores Collection', async () => {
        await actions.selectPremadeCollection(page, 'chores')
    })

    it('View Chores', async () => {
        let choreNames = await page.$$eval('.glyph-checkbox', chores => chores.filter(chore => chore.classList.contains('btn-selected')).map(chore => chore.innerText))
        //ensure that each chore matches what we expect and is selected
        expect(choreNames).to.eql(choreTallies)
    })

    it('Deselect All', async () => {
        await actions.toggleAllTallies(page);
        //ensure that no chore is selected
        let choreNames = await page.$$eval('.glyph-checkbox', chores => chores.filter(chore => chore.classList.contains('btn-selected')).map(chore => chore.classList.contains('btn-selected')))
        expect(choreNames).to.eql([])
    })
    
    it('Select Custom', async () => {
        for(i in choresToSelect) {
            await actions.toggleTallySelection(page, choresToSelect[i]);
        }
        let choreSelections = await page.$$eval('.glyph-checkbox', chores => chores.filter(chore => chore.classList.contains('btn-selected')).map(chore => chore.getAttribute('for')))
        expect(choreSelections).to.eql(choresToSelect)
    })

    it('Install Collection', async () => {
        await actions.installSelectedTallies(page)
        //make sure that only the talles we chose were selected
        //this give us a list of classLists that each of the tallies have
        let tallies = await page.$$eval('.tally', tallies => tallies.filter(tally => !tally.classList.contains('new')).map(tally => Array.from(tally.classList)))

        //we can ensure that they match by checking the length
        expect(tallies).to.have.length(choresToSelect.length)

        //then we check that the array has all of the elements
        choresToSelect.forEach(chore => expect(tallies.flat(1)).to.contain(chore))
    }).timeout(0)
})