import React from 'react';
import { getAllContacts } from '../interface.js';
import {
  Row,
  Col,
  Card,
  Icon,
  Button,
  Layout,
  message,
  Checkbox,
  Spin
} from 'antd';
import {
  getGroupMembers,
} from '../interface.js';
import {
  haveUpdatedRl,
  updateFriends,
  updateGroups
} from '../actionCreator.js';
import { connect } from 'react-redux';
const { Header, Content } = Layout;
const CheckboxGroup = Checkbox.Group;

// function sleep(timeLog) {
//   return new Promise((resolve, reject) => {
//     setTimeout(_ => {
//       resolve();
//     }, timeLog);
//   });
// }

/**
 * @desc 对比当前群及当前用户的用户昵称和群名的关系，生成新的
 *       昵称，并同步到微信服务器
 */
async function startUpdate () {
  this.setState({
    inProgress: true
  });
  let groups = Object.assign([], this.state.targetGp);
  let friends = Object.assign([], this.state.friends);
  for (let i = 0, groupsLen = groups.length; i < groupsLen; i++) {
    let group = groups[i];
    let res = await getGroupMembers(
      sessionStorage.getItem('wechatId'),
      group.UserName
    );
    let members = res.data.data ? res.data.memberList : [];
    group.MemberList = members;
    for (let j = 0, friendsLen = friends.length; j < friendsLen; j++) {
      let friend = friends[j];
      let friendInGp = false;
      for (let k = 0, membersLen = members.length; k < membersLen; k++) {
        let member = members[k];
        // 在群内，更新昵称
        // if (friend.ClientName === )
        if (member.UserName === friend.UserName) {
          friendInGp = true;

          // 分析用户昵称，是否包含有日期数据，如果有日期数据
          // 需要把日期数据保留，只更新群名
          let arr = friend.ClientName.split('_');
          let remarkName = '';

          if (arr.length >= 2) {

            // 情况一：只有日期，没有群名（日期为加粉日期，没有群名
            // 说明不在群内
            // 日期格式校验
            if (/^\d{4}-\d{1,2}-\d{1,2}--\d{2}:\d{2}:\d{2}$/.test(arr[0]) &&
              !(/^\[群\] .*$/.test(arr[1]))) {
              let leftName = [];
              leftName = friend.ClientName.split('_');
              leftName.splice(0, 1);
              remarkName = `${arr[0]}_{group.ClientName}_{leftName.join('_')}`;
            }

            // 情况二：只有群名，没有日期（已在群内，但是加粉时不是
            // 自动拉粉工具操作的）
            if (/^\[群\] .*$/.test(arr[0])) {

              // 群名与当前所在群关系
              // 之前用户所在群与当前用户所在群不匹配，需要先检索原有
              // 关系是否成立
              if (friend.ClientName.indexOf('web马原野') !== -1) {
              }
              let targetGroup = null;
              let oldGroupNms = [];
              let stillInGpNms = [];
              let leftName = [];
              if (arr[0].split('|').indexOf(group.ClientName) === -1) {
                oldGroupNms.push(group.ClientName);
              }
              for (let i = 0, oldGpNmLen = oldGroupNms.length; i < oldGpNmLen; i++) {
                let oldGpName = oldGroupNms[i];
                groups.some(group => {
                  if (group.ClientName === oldGpName) {
                    targetGroup = group;
                    return true;
                  } else {
                    return false;
                  }
                });
                targetGroup && targetGroup.MemberList.some(oldGroupMember => {
                  if (oldGroupMember.UserName === friend.UserName) {
                    stillInGpNms.push(oldGpName);
                    return true;
                  } else {
                    return false;
                  }
                });
              }
              leftName = friend.ClientName.split('_');
              leftName.splice(0, 1);
              remarkName = `${stillInGpNms.concat(arr[0].split('|')).join('|')}_${leftName.join('_')}`
            }

            // 情况三：有群名和日期
            if (/^\d{4}-\d{1,2}-\d{1,2}--\d{2}:\d{2}:\d{2}$/.test(arr[0]) &&
              (/^\[群\] .*$/.test(arr[1]))) {

              // 群名与当前所在群关系
              // 之前用户所在群与当前用户所在群不匹配，需要先检索原有
              // 关系是否成立
              let targetGroup = null;
              let oldGroupNms = [];
              let stillInGpNms = [];
              let leftName = [];
              if (arr[1].split('|').indexOf(group.ClientName) === -1) {
                oldGroupNms.push(group.ClientName);
              }
              oldGroupNms.forEach(oldGpName => {
                groups.some(group => {
                  if (group.ClientName === oldGpName) {
                    targetGroup = group;
                    return true;
                  } else {
                    return false;
                  }
                });
                targetGroup && targetGroup.MemberList.some(oldGroupMember => {
                  if (oldGroupMember.UserName === friend.UserName) {
                    stillInGpNms.push(oldGpName);
                    return true;
                  } else {
                    return false;
                  }
                });
              });
              leftName = friend.ClientName.split('_');
              leftName.splice(0, 2);
              remarkName = `${stillInGpNms.concat(arr[1].split('|')).join('|')} ${leftName.join('_')}`;
            }
          }

          // 情况四：既没有群名，也没有入群日期（非工具拉粉，且之前不
          // 在群内
          if (!(/^\d{4}-\d{1,2}-\d{1,2}--\d{2}:\d{2}:\d{2}$/.test(arr[0])) &&
              !(/^\[群\] .*$/.test(arr[0]))) {
            if (friend.ClientName.indexOf('web马原野') !== -1) {
            }
            remarkName = `${group.ClientName}_${friend.ClientName}`;
          }

          // 更新群名
          // 腾讯接口限制严重，目前不调用借口，只更新本地数据
          friend.ClientName = remarkName;

          // try {
          //   res = await updateRemark(
          //     sessionStorage.getItem('wechatId'),
          //     member.UserName,
          //     remarkName.substring(0, 100)
          //   )
          //   if (res.data.data) {
          //     friend.ClientName = remarkName;
          //   } else if (res.data.status === -1) {
          //     sessionStorage.clear();
          //     location.reload(true);
          //   }
          //   await sleep((Math.random() * 3000) + 27 * 1000);
          // } catch (error) {
          //   errCount++;
          //   this.setState({
          //     errCount
          //   });
          // }
        }
      }
      // 如果该粉不在当前群，需要在昵称中去除当前群信息
      if (!friendInGp) {
        let arr = friend.ClientName.split('_');
        let remarkName = '';
        let leftName = arr;

        // 第一种情况：只有群名
        if (/^\[群\] .*$/.test(arr[0])) {
          let names = arr[0].split('|');
          let nameIndex = names.indexOf(group.ClientName);

          // 去掉当前群名在当前粉丝备注中的信息
          if (nameIndex !== -1) {
            names.splice(nameIndex, 1);
          }
          leftName.splice(0, 1);
          remarkName = names.length > 0 ?
            `${names.join('|')}_${leftName.join('_')}` :
            `${leftName.join('_')}`;
        }

        // 第二种情况：有群名，也有入群日期
        if (/^\d{4}-\d{1,2}-\d{1,2}--\d{2}:\d{2}:\d{2}$/.test(arr[0]) &&
          (/^\[群\] .*$/.test(arr[1]))) {
          let names = arr[1].split('|');
          let nameIndex = names.indexOf(group.ClientName);

          // 去掉当前群名在当前粉丝备注中的信息
          if (nameIndex !== -1) {
            names.splice(nameIndex, 1);
          }
          leftName.splice(0, 1);
          remarkName = names.length > 0 ?
            `${names.join('|')}_${leftName.join('_')}` :
            `${leftName.join('_')}`;
        }

        // 如果存在昵称变更，则需要更新昵称
        if (remarkName) {
          // 更新本地群名
          friend.ClientName = remarkName;

          // try {
          //   res = await updateRemark(
          //     sessionStorage.getItem('wechatId'),
          //     friend.UserName,
          //     remarkName.substring(0, 100)
          //   )
          //   if (res.data.data) {
          //     friend.ClientName = remarkName;
          //   } else if (res.data.status === -1) {
          //     sessionStorage.clear();
          //     location.reload(true);
          //   }
          //   await sleep((Math.random() * 3000) + 27 * 1000);
          // } catch (error) {
          //   errCount++;
          //   this.setState({
          //     errCount
          //   });
          // }
        }
      }
    }

    // res = await getAllContacts(sessionStorage.getItem('wechatId'));
    // if (res.data.status === 1) {
      // groups = res.data.groups;
    // }
  }
  // let res = await getAllContacts(sessionStorage.getItem('wechatId'));
  message.success('更新完成！');
  this.setState({
    groups: Object.assign(this.state.groups, groups),
    friends
  });
  // 防止频繁操作，在更新完后，等待4s解除按钮禁用状态
  setTimeout(_ => {
    this.setState({
      inProgress: false
    });
    this.props.haveUpdatedRl(true);
    this.props.updateFriends(friends);
    this.props.updateGroups(this.state.groups);
  }, 2000);
}

class Update extends React.Component {
  constructor (state) {
    super(state);
    this.state = {
      groups: [],
      friends: [],
      checked: false,
      indeterminate: true,
      isReady: false,
      errorCount: 0,
      groupOptions: [],
      targetGp: [],
      checkedList: [],
      inProgress: false,
      intervalId: null
    };
  }
  componentWillMount () {
    sessionStorage.removeItem('timeLog');
    sessionStorage.removeItem('groupsLen');
    sessionStorage.removeItem('friendsLen');
    this.setState({
      intervalId: setInterval(_ => {
        getAllContacts(sessionStorage.getItem('wechatId'))
        .then(res => {
          let groupOptions = [];
          if (res.data.status === -1) {
            sessionStorage.clear();
            location.reload(true);
          } else {
            let sessionGroupsLen = sessionStorage.getItem('groupsLen');
            let sessionFriendsLen = sessionStorage.getItem('friendsLen');
            if (sessionFriendsLen === null ||
              sessionGroupsLen === null ||
              (sessionFriendsLen && sessionFriendsLen !== res.data.friends.length) ||
              (sessionGroupsLen && sessionGroupsLen !== res.data.groups.length) ) {
              sessionStorage.setItem('groupsLen', res.data.groups.length);
              sessionStorage.setItem('friendsLen', res.data.friends.length);
              sessionStorage.setItem('timeLog', Date.now());
              res.data.groups.forEach(group => {
                groupOptions.push({
                  label: group.ClientName,
                  value: group.UserName
                });
              });
              this.setState({
                groups: res.data.groups,
                friends: res.data.friends,
                groupOptions
              });
              window.friends = res.data.friends;
            } else {
              // 如果2分钟联系人数量没有变更，则认为联系人更新已完成
              if (Date.now() -
                (+sessionStorage.getItem('timeLog')) >
                2 * 60 * 1000) {
                this.setState({
                  isReady: true
                });
                clearInterval(this.state.intervalId);
              }
            }
          }
        })
        .catch(e => {

        })
      }, 3000)
    })
  }
  stopPolling = () => {
    this.setState({
      isReady: true
    });
    clearInterval(this.state.intervalId);
    this.props.socket.emit('stop-getcontacts')
  };
  reChooseFunction = () => {
    location.reload(true);
  };
  handleTargetGpChange = (checkedValues) => {
    let targetGp = [];
    this.state.groups.forEach(group => {
      if (checkedValues.indexOf(group.UserName) !== -1) {
        targetGp.push(group);
      }
    });
    this.setState({
      checkedList: checkedValues,
      indeterminate: !!checkedValues.length && (checkedValues.length < this.state.groupOptions.length),
      checked: checkedValues.length === this.state.groupOptions.length,
      targetGp
    });
  };
  handleCheckAllChange = (e) => {
    let checkedList = [];
    let targetGp = [];
    this.state.groupOptions.forEach(item => {
      checkedList.push(item.value);
    });
    this.setState({
      checked: e.target.checked,
      indeterminate: false,
      checkedList: e.target.checked ? checkedList : []
    });
    if (e.target.checked) {
      this.state.groups.forEach(group => {
        if (checkedList.indexOf(group.UserName) !== - 1) {
          targetGp.push(group);
        }
      });
    }
    this.setState({
      targetGp
    });
  }
  render () {
    return (
      <Layout style={{height: '100%'}}>
        <Header>
          <div style={{
            position: 'fixed', width: '44px', left: '3px', top: '2px', fontSize: '0', lineHeight: '0'
          }}>
            <img src={sessionStorage.getItem('avatar')} alt="头像" style={{width: '100%'}}/>
            <p style={{
              fontSize: '12px',
              lineHeight: '16px',
              color: 'white',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              width: '44px'}}
              title={sessionStorage.getItem('NickName')}>{sessionStorage.getItem('NickName')}</p>
          </div>
          <h2 style={{color: 'white'}}>同步助手</h2>
        </Header>
        <Content>
          <Row>
            <Col span='8' offset='2'
              style={{marginTop: '40px', marginRight: '16px'}}>
              <Card style={{height: '420px', overflowY: 'auto'}}>
                <div style={{borderBottom: '1px solid #E9E9E9', paddingBottom: '5px'}}>
                  <Checkbox
                    checked={this.state.checked}
                    onChange={this.handleCheckAllChange}>
                    <span className="tip">全选 </span>
                    <span className="item"> 已选：{this.state.checkedList.length}</span>
                  </Checkbox>
                </div>
                <CheckboxGroup
                  options={this.state.groupOptions}
                  onChange={this.handleTargetGpChange}
                  value={this.state.checkedList}
                  className='groups'/>
              </Card>
            </Col>
            <Col span='10'
              style={{marginTop: '40px'}}>
              <Card style={{height: '420px', overflowY: 'auto'}}>
                {
                  this.state.isReady ?
                    null:
                    (
                      <div className="topbar">
                        <Spin tip="Loading...">
                        </Spin>
                      </div>
                    )
                }
                {
                  this.state.friends.length > 0 ? this.state.friends.map(friend => {
                    return (
                      <div key={friend.UserName + '&UpdateUser'} className='group-wrapper'>
                        <p>{friend.ClientName}</p>
                      </div>
                    )
                  }) : <p><Icon type='frown-o'></Icon>暂无联系人数据</p>
                }
              </Card>
            </Col>
          </Row>
          <Row style={{marginTop: '18px'}}>
            <Col span='16' offset='2'>
              <p>成功获取联系人：{this.state.friends.length}</p>
              <p>成功获取群组：{this.state.groups.length}</p>
              <p>同步异常：{this.state.errorCount}</p>
            </Col>
            <Col span='1' offset='1'>
              <Button shape='circle'
                type='danger'
                size='large'
                icon='disconnect'
                disabled={this.state.isReady}
                onClick={this.stopPolling}
                title='停止获取数据'></Button>
            </Col>
            <Col span='2'>
              <Button
                icon={this.state.inProgress ? 'loading' : 'caret-right'}
                type='primary'
                shape='circle'
                size='large'
                disabled={!this.state.isReady || this.state.inProgress}
                onClick={startUpdate.bind(this)}
                title='开始同步'></Button>
            </Col>
            <Col span='1'>
              <Button
                type='primary'
                icon='tool'
                title='返回工具功能选项'
                shape='circle'
                size='large'
                onClick={this.reChooseFunction}
                ></Button>
            </Col>
          </Row>
        </Content>
      </Layout>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return state
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    haveUpdatedRl: (updateStatus) => {
      dispatch(haveUpdatedRl(updateStatus))
    },
    updateGroups: (groups) => {
      dispatch(updateGroups(groups))
    },
    updateFriends: (friends) => {
      dispatch(updateFriends(friends))
    }
  }
}

const UpdateUser = connect(
  mapStateToProps,
  mapDispatchToProps
)(Update);

export default UpdateUser;
