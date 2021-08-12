import {
  RuleMap,
  ValidationRule
} from '../../kml-modules/types';

const reTest = (
  re: RegExp
): ValidationRule => {
  return (value: string) => re.test(value)
}

const ruleMap: RuleMap = new Map(Object.entries({
  'phone': reTest(/^[1][3-8][0-9]{9}$/), 
  // eslint-disable-next-line
  'email': reTest(/^[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+(?:\.[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/i), 
  'password': reTest(/^(?=.*[A-z])(?=.*\d)[^]{8,32}$/), 
  'smsCode': reTest(/^[0-9]{6}$/),
  'new_phone': reTest(/^[1][3-8][0-9]{9}$/),
  'new_smsCode': reTest(/^[0-9]{6}$/),
  'new_password': reTest(/^(?=.*[A-z])(?=.*\d)[^]{8,32}$/),
  'agreement': (val: boolean) => val,
  'confirm': (confirm: string, password: string) => confirm === password,
  'id_card': reTest(/(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}$)/)
}));

export default ruleMap;