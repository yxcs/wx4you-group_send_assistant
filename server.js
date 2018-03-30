const express = require('express');
const fs = require('fs');
const Wechat = require('wechat4u');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const async = require('async');

const app = express();
const server = http.createServer(app);
let wechats = [];

app.use(express.static('./build'));
app.use(express.static('./'));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '5mb'}));

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'content-type')
  res.header('Access-Control-Request-Headers', 'X-Requested-with');
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
})

app.get('/getAllGroups', (req, res) => {
  let { wechatId } = req.query;
  let targetWechat = findWechatById(wechatId);
  let groups = [];
  if (targetWechat) {
    Object.keys(targetWechat.contacts).forEach(key => {
      if (targetWechat.Contact.isRoomContact(targetWechat.contacts[key])) {
        groups.push(Object.assign(targetWechat.contacts[key], {
          ClientName: targetWechat.Contact.getDisplayName(targetWechat.contacts[key])
        }));
      }
    });
    res.send({groups});
  } else {
    res.send({status: -1});
  }
});

app.get('/getAllContacts', (req, res) => {
  let { wechatId } = req.query;
  let targetWechat = findWechatById(wechatId);
  let groups = [];
  let friends = [];
  if (targetWechat && targetWechat.contacts) {
    Object.keys(targetWechat.contacts).forEach((key, index) => {
      let currentContact = targetWechat.contacts[key];
      if (currentContact) {
        if (targetWechat.Contact.isRoomContact(currentContact)) {
          groups.push(Object.assign(currentContact, {
            ClientName: targetWechat.Contact.getDisplayName(currentContact)
          }));
        } else if (!targetWechat.Contact.isRoomContact(currentContact)) {
          !targetWechat.contacts[key].isSelf && friends.push(Object.assign(currentContact, {
            ClientName: targetWechat.Contact.getDisplayName(currentContact)
          }));
        }
      }
    });
    friends.sort((itemOne, itemTwo) => {
      return itemOne.ClientName.localeCompare(itemTwo.ClientName)
    })
    res.send({groups, friends});
  } else {
    res.send({status: -1});
  }
});

app.get('/getGroupMembers', (req, res) => {
  let { wechatId, groupId} = req.query;
  let targetWechat = findWechatById(wechatId);
  let memberList = [];
  if (targetWechat) {
    targetWechat.batchGetContact([{UserName: groupId}])
    .then( contacts => {
      memberList = contacts[0].MemberList;
      memberList.forEach((item, index, thisArr) => {
        thisArr[index].ClientName = targetWechat.Contact.getDisplayName(item);
      });
      res.send({data: true, memberList});
    }).catch( e => {
      res.send({data: false, details: e});
    });
  } else {
    res.send({data: false, details: '微信已退出登录，请重新登陆！'});
  }
});

app.get('/updateFriendRemark', (req, res) => {
  let { wechatId, friendId, remarkName } = req.query;
  let targetWechat = findWechatById(wechatId);
  if (targetWechat) {
    targetWechat.updateRemarkName(friendId, remarkName)
    .then(_ => {
      res.send({data: true, status: 1});
    }).catch(e => {
      console.log(e);
      res.send({data: false, status: 1205});
    })
  } else {
    res.send({data: false, status: -1});
  }

});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './build/index.html'));
});
app.get('/taskList', (req, res) => {
  res.sendFile(path.resolve(__dirname, './build/index.html'));
});

app.post('/addTask', (req, res) => {

});

app.get('/tasks', (req, res) => {
  let results = [];
  wechats.forEach(item => {
    if (item.listenerObj && item.listenerTargetObj) {
      results.push({
        wechat: item.Contact.getDisplayName(item.user),
        listener: item.listenerObj.ClientName,
        listenerTarget: item.listenerTargetObj.ClientName,
        senders: item.senderGroups
      });
    }
  });
  res.send({results});
});

let findWechatById = (wechatId) => {
  let targetWechat = null;
  wechats.some(wechat => {
    if (wechat.wechatId === (+wechatId)) {
      targetWechat = wechat;
      return true;
    } else {
      return false;
    }
  });
  return targetWechat;
};

let attachEvent = (currentSocket) => {
  let wechat = currentSocket.currentWechat;
  wechat.task = [];
  wechat.on('error', err => {
    console.trace(err)
  });
  wechat.on('uuid', uuid => {
    currentSocket.emit('getuuid', {uuid});
  });
  wechat.on('user-avatar', avatar => {
    currentSocket.emit('avatar', {avatar});
  });
  wechat.on('login', _ => {
    wechat.wechatId = Date.now();
    wechat.Seq = null;

    // 登录成功之后，开始轮询
    wechat.intervalId = setInterval(_ => {
      let task = wechat.task;
      if (task.length > 0) {
        let taskIndex = 0;
        let currentTask = task[taskIndex];
        console.log('任务状态');
        console.log(currentTask.status);
        if (currentTask.status === 'RUNNING') {
          currentTask.status = 'WAITING';
          currentTask.senders.forEach((sender, index) => {
            setTimeout(_ => {
              wechat.forwardMsg(currentTask.msg, sender.UserName);
              console.log('index');
              console.log(index);
              if (index === currentTask.senders.length - 1) {
                setTimeout(_ => {
                  task.splice(taskIndex, 1);
                }, 1000);
              }
            }, index * 3 * 1000);
          });
        }
      }
    }, 5 * 1000);

    // 登录之后轮询联系人列表
    async.whilst(
      _ => {
        return wechat.state !== wechat.CONF.STATE.logout && wechat.syncStatus !== 'STOP';
      },
      cb => {
        setTimeout(_ => {
          wechat
          .getContact(wechat.Seq ? wechat.Seq : null)
          .then(res => {
            console.log(res.Seq)
            wechat.Seq = res.Seq;
            cb(null, Date.now())
          })
        }, 10000)
      },
      (err, n) => {
        console.log(n)
      }
    )

    wechats.push(wechat);

    currentSocket.emit('login-succeed', {
      wechatId: wechat.wechatId,
      NickName: wechat.Contact.getDisplayName(wechat.user)
    });
  });
  wechat.on('logout', _ => {
    console.log('logout trigger');
    if (wechat.state === wechat.CONF.STATE.logout) {
      let targetIndex = -1;
      wechats.forEach((item, index) => {
        if (item.wechatId === wechat.wechatId) {
          targetIndex = index;
        }
      });
      let targetWechat = wechats.splice(targetIndex, 1);
      targetWechat.removeAllListeners && targetWechat.removeAllListeners();
      clearInterval(targetWechat.intervalId);
      // 清除调邀请的interval
      clearInterval(targetWechat.inviteInterval);
      currentSocket.emit('logout-succeed');
    }
  });
  wechat.start();
};

server.listen(3030, _ => {
  try {
    console.log('server listeining on port 3030');
    let io = socket(server);
    // 新socket连接
    io.on('connection', currentSocket => {
      let groups = [];
      currentSocket.currentWechat = new Wechat();
      currentSocket.on('login', data => {
        attachEvent(currentSocket);
      });
      currentSocket.on('add-task', data => {
        let {
          wechatId,
          listener,
          listenerTarget,
          config,
          tips,
          useTips,
          senders,
          targetGroups,
        } = data;
        let targetWechat = findWechatById(wechatId);
        if (targetWechat) {

          // 如果是转发任务
          if (config === 'send') {
            targetWechat.senderGroups = [];
            targetWechat.listenerObj = listener;
            targetWechat.listenerTargetObj = listenerTarget;
            senders.forEach(sender => {
              targetWechat.senderGroups.push(
                sender.ClientName
              );
            });
            targetWechat.on('message', msg => {
              if (msg.MsgType !== targetWechat.CONF.MSGTYPE_TEXT &&
                msg.MsgType !== targetWechat.CONF.MSGTYPE_VIDEO &&
                msg.MsgType !== targetWechat.CONF.MSGTYPE_EMOTICON &&
                msg.MsgType !== targetWechat.CONF.MSGTYPE_IMAGE) {
                return -1;
              }
              if (msg.FromUserName === listener.UserName &&
                msg.OriginalContent.indexOf(listenerTarget.UserName) !== -1) {
                let originalContent = msg.OriginalContent;
                let splitIndex = originalContent.indexOf(':');
                if (splitIndex !== -1) {
                  originalContent = originalContent.substring(splitIndex + 6, originalContent.length);
                  originalContent = originalContent.replace(/<br\/>/g, '\n');
                  msg.Content = originalContent;
                }
                targetWechat.task.push({
                  listener: listener.UserName,
                  listenerTarget: listenerTarget.UserName,
                  senders,
                  status: 'RUNNING',
                  msg
                });
              } else if (msg.FromUserName === listenerTarget.UserName &&
                msg.ToUserName === listener.UserName) {
                targetWechat.task.push({
                  listener: listener.UserName,
                  listenerTarget: listenerTarget.UserName,
                  status: 'RUNNING',
                  senders,
                  msg
                });
              }
            });
            currentSocket.emit('send-succeed');
          } else if (config === 'invite') {
            let inviteUsers = [];
            let succeed = 0;
            let failure = [];
            let isFriend = [];
            let notFriends = 0;
            let userNick = targetWechat.user.NickName;
            let listenerIndex = 0;
            async.whilst(
              _ => {
                return listenerIndex < targetGroups.length
              },
              callback => {
                senders.forEach(sender => {

                  // 去重
                  if (inviteUsers.indexOf(sender.UserName) === -1) {
                    inviteUsers.push(sender.UserName);
                  }
                });
                if (useTips) {

                  fs.appendFileSync(
                    `./${userNick}.txt`,
                    `${new Date().toLocaleString()} 拉第${listenerIndex + 1}个群\r\n`
                  )

                  // 先发送消息，看是否是好友
                  let i = 0;
                  let len = inviteUsers.length;
                  let lastIndex = 0;
                  if (len === 0) {
                    return;
                  }
                  let isInviting = false;
                  console.log('set');
                  let intervalId = setInterval(_ => {
                    let cb = () => {
                      // 每49人一组
                      if (i % 49 === 0 && i !== 0) {
                        let currentIndex = i;
                        let currentGroup = isFriend.slice(lastIndex, isFriend.length);
                        console.log(`开始给组${Math.floor(currentIndex / 49)}发送入群邀请`)
                        lastIndex = isFriend.length;
                        if (i < len - 1) {
                          i++
                        } else {
                          clearInterval(intervalId);
                        }
                        isInviting = true;
                        currentSocket.emit('send-message', {
                          data: true,
                          details: `开始给组${Math.floor(currentIndex / 49)}发送入群邀请`,
                          notFriends,
                          succeed: 1 + currentIndex - notFriends
                        })
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 开始给组${Math.floor(currentIndex / 49)}发送入群邀请\r\n`
                        )
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 这些人:${currentGroup.join(',')}\r\n`
                        )
                        targetWechat.updateChatroom(
                          targetGroups[listenerIndex],
                          currentGroup,
                          'invitemember'
                        ).then(res => {
                          notFriends += currentGroup.length - (res.MemberCount - 1);
                          fs.appendFileSync(
                            `./${userNick}.txt`,
                            `${new Date().toLocaleString()} 成功直接拉入群:组${currentIndex / 49}\r\n`
                          )
                          fs.appendFileSync(
                            `./${userNick}.txt`,
                            `${new Date().toLocaleString()} ${res}}\r\n`
                          )
                          succeed += (res.MemberCount - 1 - succeed)
                          isInviting = false;
                        }).catch(e => {
                          fs.appendFileSync(
                            `./${userNick}.txt`,
                            `${new Date().toLocaleString()} ${e}}\r\n`
                          )
                          if (e.actual === 1205) {
                            fs.appendFileSync(
                              `./${userNick}.txt`,
                              `${new Date().toLocaleString()} 请求频繁，接口被限制。发送群邀请失败:组${currentIndex / 49}\r\n`
                            )
                            failure.concat(currentGroup)
                          } else if (e.actual === -2028) {
                            fs.appendFileSync(
                              `./${userNick}.txt`,
                              `${new Date().toLocaleString()} 群主开启了群验证。发送群邀请失败:组${currentIndex / 49}\r\n`
                            )
                            currentSocket.emit('send-message', {
                              data: false,
                              details: `群主开启了群验证。发送群邀请失败:组${currentIndex / 49}`,
                              notFriends,
                              succeed: 1 + currentIndex - notFriends
                            })
                            failure = failure.concat(lastGroup)
                          }  else {
                            isInviting = false;
                            fs.appendFileSync(
                              `./${userNick}.txt`,
                              `${new Date().toLocaleString()} 未知错误。${e.toString()}`
                            )
                          }
                          // })
                        })
                      }
                      // 最后一组
                      if (!isInviting && i === inviteUsers.length - 1) {
                        let lastGroup = isFriend.slice(lastIndex, isFriend.length);
                        console.log(`发送消息给最后一个组`)
                        isInviting = true;
                        let currentIndex = i;
                        currentSocket.emit('send-message', {
                          data: true,
                          details: `发送消息给最后一个组`,
                          notFriends,
                          succeed: 1 + currentIndex - notFriends
                        })
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 发送消息给最后一个组\r\n`
                        )
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 这些人:${lastGroup.join(',')}\r\n`
                        )
                        targetWechat.updateChatroom(
                          targetGroups[listenerIndex],
                          lastGroup,
                          'invitemember'
                        ).then(res => {
                          notFriends += lastGroup.length - (res.MemberCount - 1);
                          fs.appendFileSync(
                            `./${userNick}.txt`,
                            `${new Date().toLocaleString()} 成功发送入群邀请:组${currentIndex}\r\n`
                          )
                          fs.appendFileSync(
                            `./${userNick}.txt`,
                            `${new Date().toLocaleString()} ${res}\r\n`
                          )
                          succeed += (res.MemberCount - 1 - succeed)
                          currentSocket.emit('send-message', {
                            data: true,
                            succeed,
                            notFriends,
                            details: `第${listenerIndex + 1}个群任务完成`,
                            failure
                          })
                          isInviting = false;
                        }).catch(e => {
                          fs.appendFileSync(
                            `./${userNick}.txt`,
                            `${new Date().toLocaleString()} ${e}\r\n`
                          )
                          if (e.actual === 1205) {
                            fs.appendFileSync(
                              `./${userNick}.txt`,
                              `${new Date().toLocaleString()} 请求频繁，接口被限制。发送群邀请失败:组${currentIndex}\r\n`
                            )
                            failure = failure.concat(lastGroup)
                          } else if (e.actual === -2028) {
                            fs.appendFileSync(
                              `./${userNick}.txt`,
                              `${new Date().toLocaleString()} 群主开启了群验证。发送群邀请失败:组${currentIndex}\r\n`
                            )
                            currentSocket.emit('send-message', {
                              data: false,
                              details: `群主开启了群验证。发送群邀请失败:组${currentIndex}`,
                              notFriends,
                              succeed: 1 + currentIndex - notFriends
                            })
                            failure = failure.concat(lastGroup)
                          } else if (e.actual === -34) {
                            clearInterval(intervalId)
                            currentSocket.emit('task-finished', {
                              data: true,
                              details: '超过当日邀请限制，今日请停止群发邀请操作！！！',
                              notFriends,
                              succeed: 1 + currentIndex - notFriends
                            })
                            targetWechat.stop();
                          } else {
                            isInviting = false;
                            fs.appendFileSync(
                              `./${userNick}.txt`,
                              `${new Date().toLocaleString()} 未知错误。${e.toString()}`
                            )
                          }
                          currentSocket.emit('send-message', {
                            data: true,
                            succeed,
                            notFriends,
                            details: `第${listenerIndex}个群任务完成`,
                            failure
                          })
                          // })
                        })
                        if (i < len - 1) {
                          i++
                        } else {
                          clearInterval(intervalId);
                          listenerIndex++;
                          callback(null, Date.now());
                        }
                      }
                      if (!isInviting) {
                        if (i < len - 1) {
                          i++
                        } else {
                          clearInterval(intervalId);
                          if (i !== inviteUsers.length - 1) {
                            listenerIndex++;
                          }
                          callback(null, Date.now());
                        }
                      }
                    };
                    !isInviting && console.log(`发送消息给:${i}`)
                    !isInviting && currentSocket.emit('send-message', {
                      data: true,
                      details: `发送消息给:${i}`,
                      notFriends,
                      succeed: 1 + i - notFriends
                    })
                    !isInviting && fs.appendFileSync(
                      `./${userNick}.txt`,
                      `${new Date().toLocaleString()}发送消息给:${i}\r\n`
                    )
                    !isInviting && targetWechat.sendMsg(tips, inviteUsers[i])
                    .then(res => {
                      if (i === 49) {
                        console.log(i);
                      }
                      isFriend.push(inviteUsers[i]);
                    }).then(_ => {
                      cb();
                    }).catch(e => {
                      notFriends++;
                      cb();
                    });
                  }, 8000);
                  targetWechat.inviteInterval = intervalId;
                } else {
                  // 100人分组
                  let groupLen = inviteUsers.length % 50 === 0 ? inviteUsers.length / 50 : Math.floor(inviteUsers.length / 50) + 1;
                  let i = 0;
                  if (groupLen === 0) {
                    return 0;
                  }
                  let intervalId = setInterval(_ => {
                    console.log(`分组邀请:${i}`)
                    currentSocket.emit('send-message', {
                      data: true,
                      details: `分组邀请:组${i} 群${listenerIndex}`,
                      notFriends,
                      succeed: 1 + i - notFriends
                    })
                    let currentGroup = inviteUsers.splice(0, 50);
                    let targetGp = targetWechat.contacts[targetGroups[listenerIndex]];
                    let gpName = targetWechat.Contact.getDisplayName(targetGp);
                    targetWechat.updateChatroom(
                      targetGroups[listenerIndex],
                      currentGroup,
                      'invitemember'
                    ).then(res => {
                      fs.appendFileSync(
                        `./${userNick}.txt`,
                        `${new Date().toLocaleString()} 成功发送入群邀请:组${i} ${gpName}\r\n`
                      )
                      succeed += (res.MemberCount - 1 - succeed)
                    }).catch(e => {
                      if (e.actual === 1205) {
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 请求频繁，接口被限制。发送群邀请失败:组${i} ${gpName}\r\n`
                        )
                        currentSocket.emit('send-message', {
                          data: false,
                          details: `请求频繁，接口被限制。发送群邀请失败:组${i} ${gpName}`,
                          notFriends,
                          succeed
                        })
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 发送群邀请失败:组${i} ${gpName}，请求频繁，接口被限制。\r\n`
                        )
                      } else if (e.actual === -2028) {
                        currentSocket.emit('send-message', {
                          data: false,
                          details: `发送群邀请失败:组${i}，群主开启了群验证`,
                          notFriends,
                          succeed
                        })
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 发送群邀请失败:组${i} ${gpName}，群主开启了群验证\r\n`
                        )
                      }  else if (e.actual === -34) {
                        currentSocket.emit('send-message', {
                          data: false,
                          details: `发送群邀请失败:组${i} ${gpName}，微信接口限制，危险！机器人将在2s后自动退出登录`,
                          notFriends,
                          succeed
                        })
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 发送群邀请失败:组${i} ${gpName}，微信接口限制，危险！机器人将在2s后自动退出登录\r\n`
                        )
                        setTimeout(_ => {
                          clearInterval(intervalId);
                          targetWechat.stop();
                        }, 2000)
                      } else {
                        currentSocket.emit('send-message', {
                          data: false,
                          details: `发送群邀请部分成功:组${i} ${gpName}，其他不成功的为非好友`,
                          notFriends,
                          succeed
                        })
                        fs.appendFileSync(
                          `./${userNick}.txt`,
                          `${new Date().toLocaleString()} 发送群邀请部分成功:组${i} ${gpName}，其他不成功的为非好友\r\n`
                        )
                      }
                    })
                    if (i < groupLen - 1) {
                      i++;
                    } else {
                      clearInterval(intervalId);
                      setTimeout(_ => {
                        listenerIndex++;
                        callback(null, Date.now());
                      }, 15 * 1000)
                      currentSocket.emit('send-message', {
                        data: true,
                        succeed,
                        notFriends,
                        details: `第${listenerIndex + 1}个群任务完成`,
                        failure
                      })
                    }
                  }, 15 * 1000);
                  targetWechat.inviteInterval = intervalId;
                }
              },
              (err, n) => {
                console.log('finished')
                currentSocket.emit('task-finished', {
                  data: true,
                  succeed,
                  notFriends,
                  details: `任务完成`,
                  failure
                })
                fs.appendFileSync(
                  `./${userNick}.txt`,
                  `${new Date().toLocaleString()} 任务已完成\r\n`
                )
              }
            )
          }
        } else {
          currentSocket.emit('task-finished', {
            data: false,
            details: '微信已退出，请重新登陆！'
          })
        }
      });
      currentSocket.on('disconnect', _ => {
        if (currentSocket.currentWechat.state !== 'login') {
          currentSocket.currentWechat.removeAllListeners && currentSocket.currentWechat.removeAllListeners();
          currentSocket.currentWechat.stop();
        }
      });
      currentSocket.on('stop-getcontacts', data => {
        currentSocket.currentWechat.syncStatus = 'STOP';
      });
    });
  } catch (error) {
    fs.appendFileSync(
      './log.txt',
      error.toString()
    )
  }
});