var lib = require('./src/lib');
var config = require('./src/config');

var wallet = {
    address: '0xDEbE34B7Aaf8006777dB1D1F7Af0aC8Ea90F9d0B',
    privateKey: 'b3a7cc5165108e8c965b7132513ceee70b4dbc51a918b54d12acdec2210c2efb'
}
lib.cronJob(wallet);