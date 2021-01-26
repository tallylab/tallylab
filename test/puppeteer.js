const puppeteer = require('puppeteer');
const { expect } = require('chai');

describe('Test new user', async () => {
    let browser;
    let page;

    before(async function () {
        browser = await puppeteer.launch()
        page = await browser.newPage()
    })

    after(async () => {
        await page.close()
        await browser.close()
    })

    it('Create new tally', async () => {
        await page.goto('http://localhost:8080');

        await page.waitForSelector('#initialAdventure', {visible: true})
        await page.click('.new-tallier')

        await page.waitForSelector('a[data-slug=chores]', {visible: true})
        await page.click('a[data-slug=chores')

        await page.waitForSelector('#installSelectedTallies', {visible: true})
        await page.click('#installSelectedTallies')

        await page.waitForFunction('document.querySelector("#theCollection h1 span[name=title]")?.innerText =="Chores"')

        const tallies = await page.$$eval('#tallies .tally .tally-title', tallies => tallies.map(tally => tally.innerText))

        expect(tallies).to.eql(["Replace AC Filter", "Clean Bathroom 1", "Clean Bathroom 2", "Clean Fridge", "Clear Gutters", "Dust", "Mop", "Sweep", "Vaccuum", "Water Plants"])

    }).timeout(0)
})