import types from './types.js';

export const initSocket = (socket) => {
  return {
    type: types.INIT_SOCKET,
    socket
  };
};

export const loginSucceed = (status) => {
  return {
    type: types.LOGIN_SUCCEED,
    status
  };
};

export const getAllTasks = (tasks) => {
  return {
    type: types.GET_ALL_TASKS,
    tasks
  };
};

export const getAllGroups = (groups) => {
  return {
    type: types.GET_ALL_GROUPS,
    groups
  };
};

export const updateGroups = (groups) => {
  return {
    type: types.UPDATE_GROUPS,
    groups
  };
};

export const updateFriends = (friends) => {
  return {
    type: types.UPDATE_FRIENDS,
    friends
  };
};

export const getAllFriends = (friends) => {
  return {
    type: types.GET_ALL_FRIENDS,
    friends
  };
};

export const searchGroup = (searchKey) => {
  return {
    type: types.SEARCH_GROUP,
    searchKey
  };
};

export const updateAddTaskStatus = (status) => {
  return {
    type: types.UPDATE_ADD_TASK_STATUS,
    addTaskStatus: status
  };
}

export const updateListener = (listener) => {
  return {
    type: types.UPDATE_LISTENER,
    listener
  };
};

export const updateTargetGroups = (targetGroups) => {
  return {
    type: types.UPDATE_TARGET_GROUPS,
    targetGroups
  };
};

export const updateSenders = (senders) => {
  return {
    type: types.UPDATE_SENDERS,
    senders
  };
};

export const updateMemberList = (memberList) => {
  return {
    type: types.GET_GROUP_MEMBER,
    memberList
  };
};

export const updateListenerTarget = (listenerTarget) => {
  return {
    type: types.UPDATE_LISTENER_TARGET,
    listenerTarget
  };
};

export const updateConfigUsage = (configUsage) => {
  return {
    type: types.UPDATE_CONFIG_USAGE,
    configUsage
  };
};

export const updateSendUsage = (usage) => {
  return {
    type: types.UPDATE_SEND_USAGE,
    config: usage
  };
};

export const haveUpdatedRl = (updateStatus) => {
  return {
    type: types.HAVE_UPDATE_GP_RELATIONSHIP,
    updateStatus
  };
};