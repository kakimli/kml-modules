/* 一个输入值的信息 */
export interface InputInfo {
  name: string, // 输入值的名称，要与传给后端的参数名一致
  type: string, // 输入值的类型，会在 ruleMap 中查找
  value: any, // 输入值
  dependency?: any, // 输入值校验所依赖的数值
  allowEmpty?: boolean // 是否允许为空，默认不允许
}
/* 输入值的集合 */
export type InputInfoCollection = Array<InputInfo>;
/* 校验规则 */
export type ValidationRule = (value: any, dependency: any) => boolean;
/* 校验规则集，输入值类型到规则的映射 */
export type RuleMap = Map<string, ValidationRule>;
/* 校验结果，用作返回值 */
export interface ValidationResult {
  valid: boolean, // 校验是否成功
  name?: string, // 如果失败返回第一个失败的输入值名称
  errMsg?: string // 返回失败原因
}
/* 默认的校验规则（ruleMap 中找不到输入值类型）：永真式 */
const defaultValidationRule: ValidationRule = () => true;
/* 生成一个校验结果 */
function makeResult (
  valid: boolean,
  name?: string,
  errMsg?: string
): ValidationResult { 
  return { valid, name, errMsg } 
};
/**
 * 校验一个输入值集合
 * @param inputCollection 输入值集合
 * @param ruleMap 规则集
 * @returns ValidationResult
 */
function validateInputCollection (
  inputCollection: InputInfoCollection, 
  ruleMap: RuleMap
): ValidationResult {
  for (const inputInfo of inputCollection) {
    const type = inputInfo.type;
    const rule = ruleMap.get(type) || defaultValidationRule;
    const result = validateInput(inputInfo, rule);
    if (!result.valid) return result;
  }
  return makeResult(true);
}
/**
 * 校验单个输入
 * @param inputInfo 输入值信息
 * @param rule 校验规则
 * @returns ValidationResult
 */
function validateInput (
  inputInfo: InputInfo, 
  rule: ValidationRule
): ValidationResult {
  const dependency = inputInfo.dependency;
  const value = inputInfo.value;
  const type = inputInfo.type;
  const name = inputInfo.name;
  const allowEmpty = inputInfo.allowEmpty;
  /* 如果值为空 */
  if (!allowEmpty && value !== 0 && !value) {
    return makeResult(false, name, `no_${type}_input`);
  }
  /* 根据规则校验输入 */
  const valid = applyValidationRule(value, rule, dependency);
  /* 如果校验失败 */
  if (!valid) return makeResult(false, name, `${type}_wrong_format`);
  /* 校验成功 */
  return makeResult(true);
}
/**
 * 校验值
 * @param value 输入值
 * @param rule 校验规则
 * @param dependency 输入值依赖的值
 * @returns boolean 校验是否通过
 */
function applyValidationRule (
  value: any, 
  rule: ValidationRule, 
  dependency: any
) {
  const valid = rule(value, dependency);
  return valid;
}

export { validateInputCollection };