require('dotenv').config();

const config = {
    token: process.env.TOKEN,
    prefix: process.env.PREFIX,
}

module.exports = { config }; 
