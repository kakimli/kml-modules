import { RouterInfo } from './api/api';
import { 
  InputInfoCollection,
  ValidationRule,
  RuleMap
} from './validation/validation';
import { 
  HandleFail,
  HandleSuccess
} from './auth/auth';
import {
  ErrMsgArray,
  ErrMsgMap
} from './error/handleError';

type DisplayFunc = (
  text: string,
  type: 'success' | 'info' | 'error' | 'warning',
  custom?: (text: string) => string
) => void

export type {
  RouterInfo,
  DisplayFunc,
  InputInfoCollection,
  HandleFail,
  HandleSuccess,
  ValidationRule,
  RuleMap,
  ErrMsgArray,
  ErrMsgMap
}