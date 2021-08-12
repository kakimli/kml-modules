import { 
  announceHelpers
} from '../kml-modules';
import { Modal, Alert } from 'antd';

const showModal = (
  title: string, 
  content: string, 
  id: string
) => {
  const config = {
    title: title,
    content: (
      <div 
        style={{padding: `25px 0 0px`}} 
        dangerouslySetInnerHTML={{__html: content }} 
      />
    ),
    okText: 'UNDERSTOOD',
    onOk: () => announceHelpers.storeHasRead(id, 'main'),
    className: 'announce-modal'
  };
  Modal.info(config);
}

const renderAnn = (
  title: string, 
  content: string, 
  type: "info" | "success" | "error" | "warning"
) => {
  return (
    <Alert
      message={`${title}: ${content}`}
      type={type}
      closable
    />)
}

export const getAnnounceWrap = async (
  lang: string, 
  key: string, 
  setList: any
) => {
  const url = 'http://localhost:7001/getAnnouncement';
  await announceHelpers.getAnnounce(url, lang, key, setList, showModal, renderAnn);
}