import axios from 'axios';
/* 一个 API 调用的路由信息 */
export interface RouterInfo {
  url: string, // url
  verb: 'GET' | 'POST', // http 请求方法
  params: ReqParams, // 请求参数
  sendCookie?: boolean // 是否携带 cookie
}
/* 请求参数 */
export interface ReqParams {
  [index: string]: any
}
/* API 调用成功的返回值 */
interface SuccessResponse {
  success: true,
  data: any,
  msg?: string
}
/* API 调用失败的返回值 */
interface FailureResponse {
  success: false,
  data: any,
  msg: string
}
/* API 调用的返回值 */
export type Response = SuccessResponse | FailureResponse;
/**
 * 发送请求
 * @param routerInfo 路由信息
 * @returns Response
 */
async function sendRequest (routerInfo: RouterInfo) {
  try {
    const res = await callApi(routerInfo);
    if (!res) return { success: false, data: {}, msg: 'fail_to_call_api' };
    return res.data;
  } catch (e) {
    console.log(`${routerInfo.verb} ${routerInfo.url} failed: ${e.toString()}`);
  }
}

async function callApi (routerInfo: RouterInfo) {
  const { url, verb, params, sendCookie } = routerInfo;
  if (verb === 'GET') {
    return await axios.get(url, {
      params,
      withCredentials: sendCookie || false
    })
  }
  if (verb ==='POST') {
    return await axios.post(url, params, {
      withCredentials: sendCookie || false
    })
  }
}

export { sendRequest };