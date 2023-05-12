export const cl = (...v) => {
    console.log(v)
}

export const sleep = (time) => {
    return new Promise(r => setTimeout(r, time))
}

export const chunkArray = (arr, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
}