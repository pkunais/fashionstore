require('dotenv').config()
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOCKEN);
const ServicesID=process.env.TWILIO_SERVICESID

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