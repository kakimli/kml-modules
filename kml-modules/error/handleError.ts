/* 错误信息的集合 */
export type ErrMsgArray = Array<string>;
/* 功能名称到错误信息集合的映射 */
export type ErrMsgMap = Map<string, ErrMsgArray>;
/**
 * 如果不是已知的错误信息，返回网络或服务器内部错误 
 * @param resMsg 后端返回的错误信息
 * @param errMsgArray 已知的错误信息的集合
 * @returns string 错误信息
 */
export function getErrMsgReq (
  resMsg: string, 
  errMsgArray: ErrMsgArray
) {
  if (errMsgArray.includes(resMsg)) {
    return resMsg;
  }
  return 'network_or_internal_error';
}