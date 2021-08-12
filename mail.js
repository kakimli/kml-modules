'use strict';

const TAG = 'service:mail';
const Service = require('egg').Service;
const nodemailer = require('nodemailer');
const mailHtml = require('./assets/mailHtml');

class MailService extends Service {

  createToken(len) {
    len = len || 32;
    let chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz23456789';
    let token = '';
    for(let i = 0; i < len; ++i) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token;
  }

  sendCodeMail = async (to, token) => {
    const mailText = `<div>绑定邮箱验证码: ${token}</div>`;
    const mailTextNew = mailHtml;
    return new Promise((resolve, reject)=>{
        const transporter = nodemailer.createTransport({
          service: '163', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
          port: 465, // SMTP 端口
          secureConnection: true, // 使用了 SSL
          auth: {
            user: this.config.mailAuthUser,
            // 这里密码不是密码，是你设置的smtp授权码
            pass: this.config.mailAuthPass,
          }
        });
        const mailOptions = {
          from: this.config.mailAuthUser, // sender address
          to: to, // list of receivers
          subject: '【Platform】绑定邮箱验证码',
          html: mailText
        };
        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              ctx.logger.error(`${TAG} transporter sendMail: ${e}}`);
              resolve(false); // or use rejcet(false) but then you will have to handle errors
            } else {
              resolve(true);
            }
        });
    })
  }
}

module.exports = MailService;