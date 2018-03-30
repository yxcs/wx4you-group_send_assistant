import types from '../types.js';
import { combineReducers } from 'redux';

const socket = (state = {}, action) => {
  switch (action.type) {
    case types.INIT_SOCKET:
      return action.socket;
    default:
      return state;
  }
};

/**
 * @desc 登录状态的reducer
 */
const status = (state = 'offline', action) => {
  switch (action.type) {
    case types.LOGIN_SUCCEED:
      return action.status;
    default:
      return state;
  }
};

/**
 * @desc 工具配置状态的reducer
 */
const configUsage = (state = 'UPDATE_REMARK', action) => {
  switch (action.type) {
    case types.UPDATE_CONFIG_USAGE:
      return action.configUsage;
    default:
      return state;
  }
};

const config = (state = 'send', action) => {
  switch (action.type) {
    case types.UPDATE_SEND_USAGE:
      return action.config;
    default:
      return state;
  }
}

const groups = (state = [], action) => {
  switch (action.type) {
    case types.GET_ALL_GROUPS:
      return action.groups;
    case types.UPDATE_GROUPS:
      return action.groups;
    default:
      return state;
  }
};

const friends = (state = [], action) => {
  switch (action.type) {
    case types.GET_ALL_FRIENDS:
      return action.friends;
    case types.UPDATE_FRIENDS:
      return action.friends;
    default:
      return state;
  }
};

const searchKey = (state = '', action) => {
  switch (action.type) {
    case types.SEARCH_GROUP:
      return action.searchKey;
    default:
      return state;
  }
};

const listener = (state = {}, action) => {
  switch (action.type) {
    case types.UPDATE_LISTENER:
      return action.listener;
    default:
      return state;
  }
};

const listenerTarget = (state = {}, action) => {
  switch (action.type) {
    case types.UPDATE_LISTENER_TARGET:
      return action.listenerTarget;
    default:
      return state;
  }
};

const senders = (state = [], action) => {
  switch (action.type) {
    case types.UPDATE_SENDERS:
      return action.senders;
    default:
      return state;
  }
};

const memberList = (state = [], action) => {
  switch (action.type) {
    case types.GET_GROUP_MEMBER:
      return action.memberList;
    default:
      return state;
  }
};

const tasks = (state = [], action) => {
  switch (action.type) {
    case types.GET_ALL_TASKS:
      return action.tasks;
    default:
      return state;
  }
};

const addLoading = (state = false, action) => {
  switch (action.type) {
    case types.UPDATE_ADD_TASK_STATUS:
      return action.addTaskStatus;
    default:
      return state;
  }
};

const updateStatus = (state = false, action) => {
  switch (action.type) {
    case types.HAVE_UPDATE_GP_RELATIONSHIP:
      return action.updateStatus;
    default:
      return state;
  }
};

const targetGroups = (state = [], action) => {
  switch (action.type) {
    case types.UPDATE_TARGET_GROUPS:
      return action.targetGroups;
    default:
      return state;
  }
}

const app = combineReducers({
  socket,
  status,
  configUsage,
  config,
  groups,
  friends,
  listener,
  memberList,
  tasks,
  searchKey,
  updateStatus,
  listenerTarget,
  addLoading,
  senders,
  targetGroups,
});

export default app;


