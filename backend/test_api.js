const fetch = require('node-fetch');
(async () => {
    const api = 'http://localhost:4000';
    try {
        console.log('GET /rts');
        console.log(await (await fetch(api + '/rts')).json());
    } catch (e) { console.error(e) }
})();
