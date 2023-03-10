export const cl = (...v) => {
    console.log(v)
}

export const sleep = (time) => {
    return new Promise(r => setTimeout(r, time))
}