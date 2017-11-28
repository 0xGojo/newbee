var lib = require('./src/lib');
var config = require('./src/config');

var wallet = {
    address: '0x3B58e3ed47Da422cFeEFE5eB47ca44e43e3757e6',
    privateKey: 'e307368bafed3ea9f589c426e34514c6105d45a5c4f3272581f1b6131710d7a2'
}
lib.cronJob(wallet);