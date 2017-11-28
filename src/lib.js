const Web3          =   require('web3');
const Tx            =   require('ethereumjs-tx');
const utils         =   require('ethereumjs-util');
const CronJob       =   require('cron').CronJob;
const config        =   require('./config');
const fs            =   require('fs');
const util          =   require('util');

var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

function web3() {
    return new Web3(new Web3.providers.HttpProvider(config.network.testnet.url));
}

//estimateGas for raw tx
function estimateGas(rawTx){
    return web3().eth.estimateGas(rawTx);
}


function constructNewTx (fromAddress, toAddress, amount, gasLimit, gasPrice, data, chainId) {
    var newTxParams = {
        nonce: "0x" + web3().eth.getTransactionCount(fromAddress).toString("16"),
        gasPrice: "0x" + gasPrice.toString("16"),
        gasLimit: "0x" + gasLimit.toString("16"),
        to: toAddress,
        value: "0x" + Number(web3().toWei(amount, "ether")).toString(16),
        data: data,
        chainId: chainId
    }
    return newTxParams;
}

//sign raw transaction with private key
function signRawTx(rawTx, privateKey) {
    var constructedTx = new Tx(rawTx);
    constructedTx.sign(privateKey);
    var serializedTx = constructedTx.serialize();
    var data = '0x' + serializedTx.toString('hex');
    return data;

}

//submit transaction to blockchain
function submitTransaction(signedTX) {
    return new Promise(function(resolve, reject){
        web3().eth.sendRawTransaction(signedTX, function (err, txId) {
            if (err) reject(err);
            else resolve(txId);
        });
    });
};

//balance of address
function getBalance (address) {
    return new Promise(function(resolve, reject) {
        web3().eth.getBalance(address, function(err, data){
            if (err) reject(err);
            else {
                resolve(data);
            }
        })
    })
};

//send ETH
function sendETH(fromAddress, privateKey, toAddress, amount){
    var tx = constructNewTx(fromAddress, toAddress, amount, config.gasLimit, config.gasPrice, '' , config.network.testnet.chainId);
    var gasLimit = estimateGas(tx);
    var newTx = constructNewTx(fromAddress, toAddress, amount, gasLimit, config.gasPrice, '' , config.network.testnet.chainId);
    var bufferPrivateKey = new Buffer(privateKey, 'hex');
    var signedTx = signRawTx(newTx, bufferPrivateKey);

    return submitTransaction(signedTx);
}

//cron job every 1 min, log balance, if balance > 0.1 ETH send to another address
function cronJob(wallet){
    return new CronJob({
        cronTime: '*/1 * * * *',
        onTick: function () {
            try{
                var balance = getBalance(wallet.address).then(function (data) {
                    _balance = web3().fromWei(data.toNumber(), 'ether');
                    console.log('[INFO]: '+ new Date() +' balance '+ _balance);
                    if(_balance > config.target) {
                        sendETH(wallet.address, wallet.privateKey, config.receiverAddress, 0.1).then(function (txHash) {
                            console.log('[HASH]: '+ new Date() +' transaction hash '+ txHash);
                        });
                    } else {
                        console.log('[WARN]: '+ new Date() +' balance < 0.1');
                    }
                });
            } catch(e){
                console.log('[ERRO]: ' + new Date()+' '+ e.message.toString());
                // throw new Error(e);
            }

        },
        start: true
    })
};

module.exports = {
    cronJob: cronJob,
    sendETH: sendETH,
    balance: getBalance

}


