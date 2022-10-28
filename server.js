const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();
app.use(express.json())
app.use(cors())

const { HashKey, HashIV, MerchantID, } = process.env;
const Version = 1.5; 
const RespondType = "JSON";

// 文件 P15 生成請求字串
const genDataChain = (obj) =>{  
    const TimeStamp = Date.now(); 
    const MerchantOrderNo = Date.now();
    return `MerchantID=${MerchantID}&RespondType=${RespondType}&TimeStamp=${TimeStamp}&Version=${Version}&MerchantOrderNo=${MerchantOrderNo}&Amt=${obj.amt}&ItemDesc=${obj.desc}&Email=${obj.email}`
}

// 文件 P16 aes256 字串加密
const aesEncryptFun = (strChain) => {
    const encrypt = crypto.createCipheriv('aes256', HashKey, HashIV);
    const enc = encrypt.update(strChain, 'utf8', 'hex');
    return enc + encrypt.final('hex');
}

// 文件 P17 使用 sha256 加密
const shaEncryptFun = (aesEncrypt) => {
    const sha = crypto.createHash('sha256');
    const plainText = `HashKey=${HashKey}&${aesEncrypt}&HashIV=${HashIV}`;

    return sha.update(plainText).digest('hex').toUpperCase();
}

// 將 aes256 解密
const aesDecryptFun = (aesEncrypt) => {
    const decrypt = crypto.createDecipheriv('aes256', HashKey, HashIV);
    decrypt.setAutoPadding(false);
    const text = decrypt.update(aesEncrypt, 'hex', 'utf8');
    const plainText = text + decrypt.final('utf8');
    const result = plainText.replace(/[\x00-\x20]+/g, '');
    return result
}

app.post('/get-encrypt-data',(req,res)=>{
    const amt = 20;
    const desc = 'nice stuff!';
    const email = 'codewarrior1992@gmail.com'
    let obj = { amt, desc, email }

    // 1. 請求字串
    const str = genDataChain(obj);

    // 2. 使用 aes256 將 字串 加密
    const trade_info = aesEncryptFun(str);

    // 3. 使用 sha256 將 aes 加密
    const trade_sha = shaEncryptFun(trade_info);

    res.send({
        TradeInfo : trade_info,
        TradeSha : trade_sha,
        MerchantID : MerchantID,
        Version : Version,
    })
})

app.post('/redirect',(req,res)=>{
    const URL = `https://codewarrior1992.github.io/newebpay-client/`
    res.redirect(URL)
})

app.listen(port,()=>{
    console.log(`Server listening : ${port} now`);
})