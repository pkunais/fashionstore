const client = require('twilio')('AC5cab60f097df896bd94c02f7f6688067', 'fffc57dd6cdf2ac6eed9d986f08ba1ba');
const ServicesID='VA034ff6641f810d45beb555ee8fc10a2b'

module.exports = {
    getotp: (number) => {
        console.log(number);
        let res = {}
        return new Promise((resolve, reject) => {
            client.verify.services(ServicesID).verifications.create({
                to: `+91${number}`,
                channel: 'sms'
            }).then((res) => {
                res.valid = true
                resolve(res)
            })
        })
    },
    otpVerify: (otpData, number) => {
        console.log(number)
        let resp = {}
        return new Promise((resolve, reject) => {
            client.verify.services(ServicesID).verificationChecks.create({
                to:`+91${number}`,
                code:otpData.otp
            }).then((resp)=>{
                resolve(resp)
            })
        })
    }
}