import config from "../../config";
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

/* 参数信息 */
interface Params {
  username: string,
  password: string
};

/* 路由信息 */
const routerInfo: RouterInfo = {
  url: `${config.mainApi}/auth/loginByPassword`,
  verb: 'POST',
  params: { 
    username: null,
    password: null
  },
  sendCookie: false
}

/* 后端可能传递的错误信息 */
const errMsgArray: ErrMsgArray = [ 
  'EMAIL_OR_PHONE_NOT_EXIST', 
  'USERNAME_OR_PASSWORD_FAIL' 
];

/* 账号密码登录 */
function loginByPassword (
  params: Params,
  display: DisplayFunc
) {
  /* 获取输入 */
  const { username, password } = params;
  /* 输入 */
  const inputCollection: InputInfoCollection = [
    { name: 'username', type: 'email', value: username },
    { name: 'password', type: 'password', value: password }
  ];
  /* 当校验失败后做什么 */
  const handleValidationFail: HandleFail = (_, errMsg) => {
    display(errMsg, 'warning');
  }
  /* 当请求失败后做什么 */
  const handleRequestFail: HandleFail = (_, errMsg) => {
    display(errMsg, 'warning');
  };
  /* 当请求成功后做什么 */
  const handleRequestSuccess: HandleSuccess = () => {
    // params.handleLoginSuccess();
    display('LOGIN_SUCCESS', 'success');
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

export default loginByPassword;