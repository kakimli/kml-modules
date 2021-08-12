import { 
  ErrMsgArray,
  getErrMsgReq
} from '../error/handleError';
import {
  ReqParams,
  RouterInfo,
  sendRequest,
  Response
} from '../api/api';
import { 
  InputInfoCollection, 
  RuleMap,
  ValidationResult,
  validateInputCollection
} from '../validation/validation';

export type HandleFail = (
  data: any,
  errMsg: string
) => void;

export type HandleSuccess = (
  data: any
) => void;

async function authFunc (
  ruleMap: RuleMap,
  errMsgArray: ErrMsgArray,
  routerInfo: RouterInfo,
  inputCollection: InputInfoCollection,
  handleValidationFail: HandleFail,
  handleRequestFail: HandleFail,
  handleRequestSuccess: HandleSuccess
) {
  /* 校验数据 */
  const result: ValidationResult = validateInputCollection(inputCollection, ruleMap);
  /* 如果校验失败，执行校验失败的回调 */
  if (!result.valid) {
    return handleValidationFail(result.name, result.errMsg || '');
  }
  /* 校验成功，更新请求参数 */
  const params: ReqParams = routerInfo.params;
  for (const name in params) {
    const inputInfo = inputCollection.find((el) => el.name === name);
    params[name] = inputInfo?.value;
  }
  routerInfo.params = params;
  /* 发送请求 */
  const response: Response = await sendRequest(routerInfo);
  /* 如果失败, 执行请求失败的回调 */
  if (!response.success) {
    const errMsgReq = getErrMsgReq(response.msg, errMsgArray);
    return handleRequestFail(response.data, errMsgReq);
  }
  /* 执行请求成功的回调 */
  handleRequestSuccess(response.data);
}

export { authFunc }
