const PATTERNS = ['uniform', 'weekends', 'cyclic', 'linear']

async function loadModel() {
    return await tf.loadLayersModel('correlator/model/model.json')
}

function findPattern(model, data) {
    const max = Math.max(...data);
    const tensor = tf.tensor(data.map(d => d / max), [1, data.length])
    return model.predict(tensor)
}

function countPerDay(data) {
    let numberPerDay = [];

    const start = Math.min(...(data.map(tally => new Date(tally._startDate))))

    data.forEach(tally => {
        let daysFromStart = daysBetween(start, new Date(tally._startDate))

        if (numberPerDay[daysFromStart] == undefined)
            numberPerDay[daysFromStart] = 1
        else
            numberPerDay[daysFromStart]++
    })

    return numberPerDay;
}

function daysBetween(start, end) {
    return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

function lastN(array, n) {
    if (array.length >= n)
        return array.slice(array.length - n)

    result = new Array(n - array.length)
    result.fill(0)
    result.push(...array)
    return result;
}