import axios from 'axios';

// const host = `http://${location.hostname}:3030`;
const host = `http://${location.hostname}:${location.port}`;

export const getAllGroups = (wechatId) => {
  return axios.get(`${host}/getAllGroups?wechatId=${wechatId}`);
};

export const getAllContacts = (wechatId) => {
  return axios.get(`${host}/getAllContacts?wechatId=${wechatId}`);
};

export const getGroupMembers = (wechatId, groupId) => {
  return axios.get(`${host}/getGroupMembers?groupId=${groupId}&wechatId=${wechatId}`);
};

export const updateRemark = (wechatId, friendId, remarkName) => {
  return axios.get(`${host}/updateFriendRemark?wechatId=${wechatId}&friendId=${friendId}&remarkName=${remarkName}`);
};

export const addTask = (params) => {
  return axios.post(`${host}/addTask`, {
    ...params
  });
};

export const getAllTasks = () => {
  return axios.get(`${host}/tasks`);
};