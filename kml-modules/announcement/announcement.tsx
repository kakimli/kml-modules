import store from 'store';
import { sendRequest } from '../api/api';
import { RouterInfo } from '../api/api';

/* localhost:7890/getAnnounce?key=main */
export interface Announcement {
  type: 'modal' | 'success' | 'warning' | 'error',
  id: string,
  list: Array<AnnouncementText>
}

export interface AnnouncementText {
  lang: string,
  title: string,
  content: string
}

export interface displayAnnFuncs {
  showModal: (title: string, content: string, id: string) => any,
  renderAnn: (title: string, content: string, type: 'success' | 'warning' | 'error') => any
}

async function getAnnounceWrap (
  url: string, 
  key: string
) {
  const routerInfo: RouterInfo = {
    url,
    verb: 'GET',
    params: { key }
  };
  return await sendRequest(routerInfo);
}

function storeHasRead (
  id: string, 
  key: string
) {
  store.set(`announcement:${key}`, id);
}

async function processAnnouncement (
  url: string, 
  lang: string, 
  key: string,
  displayFuncs: displayAnnFuncs
) {
  const res = (await getAnnounceWrap(url, key)) || {};
  const arr: Array<Announcement> = res.success ? res.data : [];
  const retList = [];
  for (const ann of arr) {
    if (ann.type === 'modal') {
      const idHasRead: string = await store.get(`announcement:${key}`);
      if (ann.id === idHasRead) continue;
      const annText = ann.list.find(el => el.lang === lang);
      if (!annText) continue;
      displayFuncs.showModal(annText.title, annText.content, ann.id);
    } else {
      const annText = ann.list.find(el => el.lang === lang);
      if (!annText) continue;
      retList.push(displayFuncs.renderAnn(annText.title, annText.content, ann.type));
    }
  }
  return retList;
}

async function getAnnounce (
  url: string,
  lang: string, 
  key: string, 
  setList: any,
  showModal: displayAnnFuncs["showModal"],
  renderAnn: displayAnnFuncs["renderAnn"]
) {
  const list = await processAnnouncement(
    url,
    lang,
    key,
    { showModal, renderAnn }
  );
  setList(list);
}

function showAnnounce (
  list: Array<any>
) {
  return list.map((item, key) => {
    return <div key={key}>{item}</div>;
  })
}

export { getAnnounce, showAnnounce, storeHasRead };