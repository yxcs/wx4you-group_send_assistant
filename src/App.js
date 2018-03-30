import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoginBox from './components/LoginBox.jsx';
import GroupsBox from './components/GroupsBox.jsx';
import TargetSelector from './components/TargetSelector.jsx';
import UsageConfig from './components/UsageConfig.jsx';
import UpdateUser from './components/UpdateUser.jsx';
import UserHelper from './components/UserHelper.jsx';
import {
  Layout,
  Modal,
  Row,
  Card,
  Col,
  Radio,
  message,
  Icon,
  Button
} from 'antd';
import {
  updateMemberList,
  getAllGroups,
  getAllFriends,
  updateSendUsage,
  updateAddTaskStatus,
  loginSucceed
} from './actionCreator';
import * as interfaceService from './interface.js';
import './App.less';

const { Header,
  Content } = Layout;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      modalVisible: false,
      intervalId: null,
      notificationVisible: false,
      tips: '',
      notFriends: 0,
      succeed: 0,
      details: '',
      useTips: true
    };
    this.props.notifyLogin(sessionStorage.getItem('status') || 'offline');
  }
  componentWillReceiveProps (nextProps) {
    // 登录成功后
    if (nextProps.status === 'online' && nextProps.configUsage === 'SEND_ASSISTANT') {
      this.pollingData();
    }
  }
  componentWillUnmount () {
    console.log('component destoryed');
    clearInterval(this.state.intervalId);
  }
  toggleDisplay = () => {
    this.setState({
      modalVisible: !this.state.modalVisible
    });
  };
  hideModal = () => {
    this.setState({
      modalVisible: false
    });
  };
  handleUpdateMemberList = () => {
    console.log(this.props);
    this.setState({
      modalVisible: false
    });
    this.props.updateMemberList(
      sessionStorage.getItem('wechatId'),
      this.props.listener.UserName
    );
  };
  startTask = () => {
    this.props.updateAddTaskStatus(true);
    // 过滤无用数据
    let listenerObj = {
      UserName: this.props.listener.UserName,
      MemberCount: this.props.listener.MemberCount,
      ClientName: this.props.listener.ClientName
    };
    let listenerTargetObj = {
      UserName: this.props.listenerTarget.UserName,
      ClientName: this.props.listenerTarget.ClientName
    };
    let sendersArr = [];
    this.props.senders.forEach(sender => {
      sendersArr.push({
        UserName: sender.UserName,
        ClientName: sender.ClientName
      });
    });
    this.props.socket.emit('add-task', {
      wechatId: sessionStorage.getItem('wechatId'),
      listener: listenerObj,
      targetGroups: this.props.targetGroups,
      listenerTarget: listenerTargetObj,
      config: this.props.config,
      tips: this.state.tips,
      useTips: this.state.useTips,
      senders: sendersArr
    });
    this.props.socket.off('task-finished');
    this.props.socket.off('send-message')
    this.props.socket.on('task-finished', res => {
      let {
        data,
        details,
        status,
        succeed,
        notFriends,
        failure
      } = res;
      if (data) {
        this.setState({
          details,
          succeed,
          notFriends
        })
        if (this.props.config === 'send') {
          sessionStorage.clear();
          location.href = '/taskList';
        } else {
          this.props.updateAddTaskStatus(false);
        }
      } else {
        sessionStorage.clear();
        location.reload(true);
      }
    });
    this.props.socket.on('send-succeed', _ => {
      sessionStorage.clear();
      location.href = '/taskList';
    });
    this.props.socket.on('send-message', res => {
      this.setState({
        details: res.details,
        notFriends: res.notFriends,
        succeed: res.succeed,
        notificationVisible: true
      })
      console.log(`
      成功：${res.succeed}
      非好友：${res.notFriends}
      `)
    })
  };
  pollingData = () => {
    clearInterval(this.state.intervalId);
    let intervalId = setInterval(_ => {
      this.props.getAllContacts(sessionStorage.getItem('wechatId'));
    }, 10000);
    this.setState({
      intervalId
    });
  };
  updateConfig = (e) => {
    this.props.updateSendUsage(e.target.value);
  };
  updateTips = (tipsObj) => {
    this.setState({
      tips: tipsObj.tips,
      useTips: tipsObj.useTips
    });
  };
  render() {
    if (this.props.status === 'offline') {
      return (
        <div style={{height: '100%'}}>
          <LoginBox/>
          <UserHelper />
        </div>
      );
    } else if (this.props.status === 'online' && this.props.configUsage === 'SEND_ASSISTANT' || this.props.updateStatus) {
      return (
        <Layout style={{height: '100%'}}>
          <Button type='primary' icon='setting' shape='circle'
            onClick={this.toggleDisplay}
            style={{position: 'fixed',
              top: '120px',
              left: '120px',
              zIndex: 1}}></Button>
          <Button type='primary' shape='circle'
            icon={this.props.addLoading ? 'loading' : 'plus'}
            onClick={this.startTask}
            disabled={(this.props.senders.length === 0 && !this.props.listener.UserName) ||
              (!this.props.listenerTarget.UserName && this.props.config === 'send') ||
              this.props.addLoading}
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '100px',
              zIndex: 1}}></Button>
          {
            this.state.notificationVisible ?
            (
              <Card title={null} style={{
                position: 'fixed',
                top: '80px',
                right: '24px',
                background: 'rgba(0,0,0, 0.5)',
                color: 'white',
                zIndex: 1000,
                width: '300px'}}>
                <p>{this.state.details}</p>
                <p>总人数：{this.props.senders.length}</p>
              </Card>
            ) : null
          }
          <UserHelper />
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
            <h2 style={{color: 'white'}}>群发助手</h2>
          </Header>
          <Content>
            <Row style={{marginTop: '10px'}}>
              <Col span='14' offset='2'>
                <RadioGroup defaultValue='send' onChange={this.updateConfig}>
                  <RadioButton value='send'>群发</RadioButton>
                  <RadioButton value='invite'>邀请</RadioButton>
                </RadioGroup>
              </Col>
            </Row>
              {
                this.props.config === 'invite' ?
                  null :
                  (
                    <Row>
                      <Col span='14' offset='5'
                        style={{marginTop: '80px'}}>
                        <TargetSelector/>
                      </Col>
                    </Row>
                  )
              }
            <Row>
              <Col span='14' offset='5'
                style={{marginTop: '40px'}}>
                <Card style={{height: '420px', overflowY: 'auto'}}>
                  {
                    this.props.senders.length > 0 ? this.props.senders.map(sender => {
                      return (
                        <div key={sender.UserName + '&App'} className='sender-wrapper'>
                          <p>{sender.ClientName}</p>
                        </div>
                      )
                    }) : <p><Icon type='frown-o'></Icon>暂未选择群发对象</p>
                  }
                </Card>
              </Col>
            </Row>
          </Content>
          <Modal
            onCancel={this.hideModal}
            onOk={this.handleUpdateMemberList}
            visible={this.state.modalVisible}>
            <GroupsBox
              updateTips={this.updateTips}
              updateStatus={this.props.updateStatus}
              style={{height: '100%',
                background: 'white',
                overflowY: 'auto'}}/>
          </Modal>
        </Layout>
      );
    } else if (this.props.status === 'online' && this.props.configUsage === 'NONE') {
      return (
        <div style={{height: '100%'}}>
          <UsageConfig />
          <UserHelper />
        </div>
      );
    } else if (this.props.status === 'online' && this.props.configUsage === 'UPDATE_REMARK') {
      return (
        <div style={{height: '100%'}}>
          <UserHelper />
          <UpdateUser />
        </div>
      );
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateMemberList: (wechatId, groupId) => {
      interfaceService.getGroupMembers(wechatId, groupId)
      .then( res => {
        console.log(res);
        if (res.data.data) {
          dispatch(updateMemberList(res.data.memberList));
        } else {
          message.error(res.data.details);
          sessionStorage.clear();
          location.reload(true);
        }
      }).catch( e => {
        console.log(e);
        message.error(e);
      });
    },
    getAllContacts: (wechatId) => {
      interfaceService.getAllContacts(wechatId)
      .then(res => {
        console.log(res);
        if (res.data.status === -1) {
          sessionStorage.clear();
          location.reload(true);
        } else {
          dispatch(getAllGroups(res.data.groups));
          dispatch(getAllFriends(res.data.friends));
        }
      }).catch(e => {
        message.error(e);
      });
    },
    notifyLogin: (status) => {
      dispatch(loginSucceed(status));
    },
    updateSendUsage: (usage) => {
      dispatch(updateSendUsage(usage));
    },
    updateAddTaskStatus: (status) => {
      dispatch(updateAddTaskStatus(status));
    }
  }
}

const AppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

export default AppContainer;