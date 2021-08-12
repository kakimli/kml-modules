'use strict';

const TAG = 'controller:web';
const Controller = require('egg').Controller;
const crypto = require('crypto');
const Constants = require('../../config/constants');

class WebController extends Controller {

  async registerByPhone() {
    const { ctx } = this;
    try {
      ctx.validate({
        phone: /^[1][3-8][0-9]{9}$/,
        password: /^(?=.*[A-z])(?=.*\d)[^]{8,32}$/,
        type: { type: 'number', required: true, min: Constants.CodeType.register, max: Constants.CodeType.register },
        code: /^[0-9]{6}$/,
      }, ctx.request.body);
      const { phone, password, type, code } = ctx.request.body;
      ctx.logger.info(`${TAG}:registerByPhone phone ${phone}, type ${type}, code ${code}`);
      // 检查是否已存在相同的 phone
      const user = await ctx.model.User.findOne({ phone });
      if (user) {
        return ctx.body = {
          success: false,
          data: 'PHONE_EXIST',
        }
      }
      // 校验验证码
      if (!await ctx.service.user.checkSmsCode(phone, type, code)) {
        return ctx.body = {
          success: false,
          data: 'SMS_CODE_FAIL',
        }
      }
      const encryptPassword = `sha256_${crypto.createHash('sha256').update(password).digest('hex')}`;
      await ctx.model.User.create({
        email: null,
        phone,
        password: encryptPassword,
        nickname: phone,
      });
      return ctx.body = {
        success: true,
        data: '',
      }
    } catch (e) {
      ctx.logger.error(`${TAG} registerByPhone error: ${e}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async loginRegisterByPhone() {
    const { ctx } = this;
    try {
      ctx.validate({
        phone: /^[1][3-8][0-9]{9}$/,
        password: /^(?=.*[A-z])(?=.*\d)[^]{8,32}$/,
        type: { type: 'number', required: true, min: Constants.CodeType.loginRegister, max: Constants.CodeType.loginRegister },
        smsCode: /^[0-9]{6}$/,
      }, ctx.request.body);
      const { phone, password, type, smsCode } = ctx.request.body;
      // 检查是否已存在相同的 phone
      const user = await ctx.model.User.findOne({ phone });
      if (user) {
        return ctx.body = {
          success: false,
          data: 'PHONE_EXIST',
        }
      }
      // 校验验证码
      if (!await ctx.service.user.checkSmsCode(phone, type, smsCode)) {
        return ctx.body = {
          success: false,
          data: 'SMS_CODE_FAIL',
        }
      }
      // 进入注册
      const encryptPassword = `sha256_${crypto.createHash('sha256').update(password).digest('hex')}`;
      const newUser = await ctx.model.User.create({
        email: null,
        phone,
        phoneAreaCode: '+86',
        password: encryptPassword,
        nickname: phone,
        idCard: null,
        realName: null
      });
      ctx.session.uid = newUser.uid;
      ctx.logger.info(`${TAG}:loginRegisterByPhone uid ${newUser.uid}, phone ${phone}, type ${type}, smsCode ${smsCode}`);
      return ctx.body = {
        success: true,
        data: '',
        uid: newUser.uid,
      }
    } catch (e) {
      ctx.logger.error(`${TAG} loginRegisterByPhone error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async reqSmsCode() {
    const { ctx } = this;
    try {
      ctx.validate({
        phone: /^[1][3-8][0-9]{9}$/,
        type: { type: 'number', required: true, min: Constants.CodeType.general, max: Constants.CodeType.reset },
      }, ctx.request.body);
      const { phone, type } = ctx.request.body;
      // 检查距离上一次发送验证码是否过了 60 秒
      const lastTimeSendCode = ctx.session.lastTimeSendCode || 0;
      const lastTimePhone = ctx.session.lastTimePhone || 'initial';
      const now = Date.now();
      if (lastTimePhone === phone && now - 60 * 1000 < lastTimeSendCode) {
        return ctx.body = {
          success: false,
          data: 'TOO_FREQUENT',
        }
      }
      ctx.logger.info(`${TAG}:reqSmsCode phone ${phone}, type ${type}, lastTimeSendCode ${lastTimeSendCode}`);
      let uid = null;
      // 如果非注册方法，获取 uid
      if (type !== Constants.CodeType.loginRegister && type !== Constants.CodeType.register) {
        const user = await ctx.model.User.findOne({ phone });
        if (user && user.uid) {
          uid = user.uid;
        } else {
          return ctx.body = {
            success: false,
            data: 'not find uid',
          }
        }
      }
      const code = await ctx.service.user.generateSmsCode(uid, phone, type);  
      const res = await ctx.service.sms.sendCode(phone, type, code, this.config.sms.validTime);
      if (res.sendStatusSet && res.sendStatusSet[0] && res.sendStatusSet[0].Message === 'the number of sms messages sent from a single mobile number every day exceeds the upper limit')
        return ctx.body = { success: false, data: 'EXCEED_REQ_LIMIT' }
      ctx.session.lastTimeSendCode = Date.now();
      ctx.session.lastTimePhone = phone;
      ctx.body = {
        success: true,
        data: '',
      }
    } catch (e) {
      ctx.logger.error(`${TAG} reqSmsCode error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async checkSmsCode() {
    const { ctx } = this;
    try {
      ctx.validate({
        phone: /^[1][3-8][0-9]{9}$/,
        type: { type: 'number', required: true, min: Constants.CodeType.general, max: Constants.CodeType.reset },
        code: /^[0-9]{6}$/,
      }, ctx.request.body);
      const { phone, type, code } = ctx.body;
      ctx.logger.info(`${TAG}:checkSmsCode phone ${phone}, type ${type}, code ${code}`);
      const result = await ctx.service.user.checkSmsCode(phone, type, code);
      ctx.body = {
        success: result,
        data: '',
      }
    } catch (e) {
      ctx.logger.error(`${TAG} checkSmsCode error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async checkLoginState () {
    const { ctx } = this;
    try {
      let success = false;
      ctx.logger.info(`${TAG}:checkLoginState ctx.session ${ctx.session}`);
      if (ctx.session.uid) success = true;
      ctx.body = {
        success,
        data: '',
      }
    } catch (e) {
      ctx.logger.error(`${TAG} checkLoginState error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async logout () {
    const { ctx } = this;
    try {
      ctx.session.uid = null;
      ctx.body = {
        success: true,
        data: '',
      }
    } catch (e) {
      ctx.logger.error(`${TAG} checkLoginState error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async loginByPassword() {
    const { ctx } = this;
    try {
      ctx.validate({
        username: 'string',
        password: /^(?=.*[A-z])(?=.*\d)[^]{8,32}$/,
      }, ctx.request.body);
      const { username, password } = ctx.request.body;
      let user = null;
      if (/^[1][3-8][0-9]{9}$/.test(username)) {
        // 检查是否已存在 phone
        user = await ctx.model.User.findOne({ phone: username });
      } else {
        // 检查是否存在 email
        user = await ctx.model.User.findOne({ email: username });
      }
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'EMAIL_OR_PHONE_NOT_EXIST',
        }
      }
      const encryptPassword = `sha256_${crypto.createHash('sha256').update(password).digest('hex')}`;
      if (user.password !== encryptPassword) {
        return ctx.body = {
          success: false,
          data: 'USERNAME_OR_PASSWORD_FAIL',
        }
      }
      ctx.session.uid = user.uid;
      ctx.logger.info(`${TAG}:loginByPassword uid ${user.uid}, username ${username}`);
      return ctx.body = {
        success: true,
        data: '',
        uid: user.uid,
      }
    } catch (e) {
      ctx.logger.error(`${TAG} loginByPassword error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async loginByPhone() {
    const { ctx } = this;
    try {
      ctx.validate({
        phone: /^[1][3-8][0-9]{9}$/,
        type: { type: 'number', required: true, min: Constants.CodeType.login, max: Constants.CodeType.login },
        code: /^[0-9]{6}$/,
      }, ctx.request.body);
      const { phone, type, code } = ctx.request.body;
      // 检查是否已存在相同的 phone
      const user = await ctx.model.User.findOne({ phone });
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'PHONE_NOT_EXIST',
        }
      }
      // 校验验证码
      if (!await ctx.service.user.checkSmsCode(phone, type, code)) {
        return ctx.body = {
          success: false,
          data: 'SMS_CODE_FAIL',
        }
      }
      // 进入登录
      ctx.session.uid = user.uid;
      ctx.logger.info(`${TAG}:loginRegisterByPhone uid ${user.uid}, phone ${phone}, type ${type}, code ${code}`);
      return ctx.body = {
        success: true,
        data: '',
        uid: user.uid,
      }
    } catch (e) {
      ctx.logger.error(`${TAG} loginRegisterByPhone error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async getAccountInfo () {
    const { ctx } = this;
    try {
      if (!ctx.session) return ctx.body = { success: false, data: 'SESSION_FAIL' };
      const uid = ctx.session.uid;
      ctx.logger.info(`${TAG}:getAccountInfo uid ${uid}`);
      const user = await ctx.model.User.findOne({ uid }).lean();
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'user not exist',
        }
      }
      const { email, phone, nickname, idCard } = user;
      return ctx.body = {
        success: true,
        data: { uid, email, phone, nickname, idCard }
      }
    } catch (e) {
      ctx.logger.error(`${TAG} getAccountInfo error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async reqEmailCode () {
    const { ctx } = this;
    try {
      ctx.validate({
        toMail: 'email',
        type: 'number'
      }, ctx.query);
      const { toMail, type } = ctx.query;
      if (!ctx.session.uid) return ctx.body = { success: false, data: 'SESSION_FAIL'};
      // 检查距离上一次发送验证码是否过了 60 秒
      const lastTimeSendCodeEmail = ctx.session.lastTimeSendCodeEmail || 0;
      const now = Date.now();
      if (now - 60 * 1000 < lastTimeSendCodeEmail) {
        return ctx.body = {
          success: false,
          data: 'TOO_FREQUENT',
        }
      }
      ctx.logger.info(`${TAG}:reqEmailCode toMail ${toMail}, type ${type}, lastTimeSendCodeEmail ${lastTimeSendCodeEmail}`);
      const token = ctx.service.mail.createToken();
      const res = await ctx.service.mail.sendCodeMail(toMail, token);
      ctx.model.EmailCode.create({
        uid: ctx.session.uid,
        email: toMail,
        code: token,
        type,
        used: false
      })
      ctx.session.lastTimeSendCodeEmail = Date.now();
      return ctx.body = {
        success: true
      };
    } catch (e) {
      ctx.logger.error(`${TAG} reqEmailCode error: ${e}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async checkEmailCode() {
    const { ctx } = this;
    try {
      ctx.validate({
        email: 'email',
        type: { type: 'number', required: true, min: Constants.CodeType.general, max: Constants.CodeType.reset },
        code: 'string',
      }, ctx.request.body);
      const { email, type, code } = ctx.body;
      ctx.logger.info(`${TAG}:checkEmailCode email ${email}, type ${type}, code ${code}`);
      const result = await ctx.service.user.checkEmailCode(email, type, code);
      ctx.body = {
        success: result,
        data: '',
      }
    } catch (e) {
      ctx.logger.error(`${TAG} checkEmailCode error: ${e}}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async bindEmail () {
    const { ctx } = this;
    try {
      ctx.validate({
        email: 'email',
        emailCode: 'string',
        phoneCode: /^[0-9]{6}$/
      }, ctx.request.body);
      if (!ctx.session.uid) return ctx.body = { success: false, data: 'SESSION_FAIL'}
      const uid = ctx.session.uid;
      const user = await ctx.model.User.findOne({ uid });
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'SESSION_FAIL',
        }
      }
      const { email, emailCode, phoneCode } = ctx.request.body;
      const emailSuccess = await ctx.service.user.checkEmailCode(email, 0, emailCode);
      if (!emailSuccess) return ctx.body = { success: false, data: 'EMAIL_CODE_FAIL'};
      const phoneSuccess = await ctx.service.user.checkSmsCode(user.phone, 3, phoneCode);
      if (!phoneSuccess) return ctx.body = { success: false, data: 'SMS_CODE_FAIL'};
      user.email = email;
      await user.save();
      return ctx.body = {
        success: true,
        data: email
      };
    } catch (e) {
      ctx.logger.error(`${TAG} bindEmail error: ${e}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async changePhone () {
    const { ctx } = this;
    try {
      ctx.validate({
        newPhone: /^[1][3-8][0-9]{9}$/,
        phoneCode: /^[0-9]{6}$/,
        newPhoneCode: /^[0-9]{6}$/
      }, ctx.request.body);
      if (!ctx.session.uid) return ctx.body = { success: false, data: 'SESSION_FAIL'}
      const uid = ctx.session.uid;
      const user = await ctx.model.User.findOne({ uid });
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'SESSION_FAIL',
        }
      }
      const { newPhone, phoneCode, newPhoneCode } = ctx.request.body;
      const phoneSuccess = await ctx.service.user.checkSmsCode(user.phone, 3, phoneCode);
      if (!phoneSuccess) return ctx.body = { success: false, data: 'CURR_PHONE_SMS_CODE_FAIL'};
      const newPhoneSuccess = await ctx.service.user.checkSmsCode(newPhone, 3, newPhoneCode);
      if (!newPhoneSuccess) return ctx.body = { success: false, data: 'NEW_PHONE_SMS_CODE_FAIL'};
      user.phone = newPhone;
      await user.save();
      return ctx.body = {
        success: true
      };
    } catch (e) {
      ctx.logger.error(`${TAG} changePhone error: ${e}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async changePassword () {
    const { ctx } = this;
    try {
      ctx.validate({
        newPassword: /^(?=.*[A-z])(?=.*\d)[^]{8,32}$/,
        code: /^[0-9]{6}$/
      }, ctx.request.body);
      if (!ctx.session.uid) return ctx.body = { success: false, data: 'SESSION_FAIL'}
      const uid = ctx.session.uid;
      const user = await ctx.model.User.findOne({ uid });
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'SESSION_FAIL',
        }
      }
      const { newPassword, code } = ctx.request.body;
      const success = await ctx.service.user.checkSmsCode(user.phone, 4, code);
      if (!success) return ctx.body = { success: false, data: 'SMS_CODE_FAIL'};
      const encryptPassword = `sha256_${crypto.createHash('sha256').update(newPassword).digest('hex')}`;
      user.password = encryptPassword;
      await user.save();
      return ctx.body = {
        success: true
      };
    } catch (e) {
      ctx.logger.error(`${TAG} changePassword error: ${e}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  }

  async bindIdCard () {
    const { ctx } = this;
    try {
      ctx.validate({
        idCard: /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}$)/,
        name: 'string',
        smsCode: /^[0-9]{6}$/
      }, ctx.request.body);
      if (!ctx.session.uid) return ctx.body = { success: false, data: 'SESSION_FAIL'}
      const uid = ctx.session.uid;
      const user = await ctx.model.User.findOne({ uid });
      if (!user) {
        return ctx.body = {
          success: false,
          data: 'SESSION_FAIL',
        }
      }
      const { idCard, name, smsCode } = ctx.request.body;
      const success = await ctx.service.user.checkSmsCode(user.phone, 0, smsCode);
      if (!success) return ctx.body = { success: false, data: 'SMS_CODE_FAIL'};
      user.idCard = idCard;
      user.realName = name;
      await user.save();
      return ctx.body = {
        success: true
      };
    } catch (e) {
      ctx.logger.error(`${TAG} bindIdCard error: ${e}`);
      ctx.body = {
        success: false,
        data: e.toString(),
      }
    }
  } 

}

module.exports = WebController;