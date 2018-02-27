

Y = {
    init: ({ delay, timestamp, ...timer }) =>
        ({ delay, timestamp, ...timer })
}

const a = Symbol("mm");
console.log(Y.init({ delay:10, timestamp:0, [a]:"hello" }));