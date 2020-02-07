const getPort = require('get-port');

module.exports = {
    getDateString(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth()+1).padStart(2, 0);
        const day = String(d.getDate()).padStart(2, 0);
    
        const hour = String(d.getHours()).padStart(2, 0);
        const minute = String(d.getMinutes()).padStart(2, 0);
        const second = String(d.getSeconds()).padStart(2, 0);
    
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    },

    async getRandomPort(preferredPort = 8000) {
        const port = await getPort({ port: preferredPort });
        return port;
    }
}