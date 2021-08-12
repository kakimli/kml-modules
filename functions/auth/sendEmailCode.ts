import config from "../../config";
import startTimer from "./startTimer";
import { 
  DisplayFunc, 
  ErrMsgArray, 
  HandleFail,
  HandleSuccess, 
  InputInfoCollection, 
  RouterInfo 
} from "../../kml-modules/types";
import { authFunc } from "../../kml-modules";
import ruleMap from "./ruleMap";

interface Params {
  emailInputId: string,
  codeBtnId: string
};

/* 路由信息 */
const routerInfo: RouterInfo = {
  url: `${config.mainApi}/auth/reqEmailCode`,
  verb: 'POST',
  params: { 
    email: null
  },
  sendCookie: true
}

/* 后端可能传递的错误信息 */
const errMsgArray: ErrMsgArray = [ 
  'exceed_req_limit', 
  'too_frequent', 
  'email_wrong_format' 
];

/* 发送邮箱验证码 */
function sendEmailCode (
  params: Params,
  display: DisplayFunc
) {
  /* 获取输入 */
  const emailInput = (document.getElementById(params.emailInputId)! as HTMLInputElement);
  const codeButton = (document.getElementById(params.codeBtnId)! as HTMLButtonElement);
  codeButton.disabled = true;
  const email = emailInput.value;
  /* 输入 */
  const inputCollection: InputInfoCollection = [
    { name: 'email', type: 'email', value: email }
  ];
  /* 当校验失败后做什么 */
  const handleValidationFail: HandleFail = (_, errMsg) => {
    display(errMsg, 'warning'); 
    codeButton.disabled = false;
  }
  /* 当请求失败后做什么 */
  const handleRequestFail: HandleFail = (_, errMsg) => {
    display(errMsg, 'warning');
    codeButton.disabled = false;
  }
  /* 当请求成功后做什么 */
  const handleRequestSuccess: HandleSuccess = () => {
    display('EMAIL_CODE_SENT', 'success');
    startTimer(codeButton);
  };
  authFunc(
    ruleMap,
    errMsgArray,
    routerInfo,
    inputCollection,
    handleValidationFail,
    handleRequestFail,
    handleRequestSuccess
  );
}

export default sendEmailCode;