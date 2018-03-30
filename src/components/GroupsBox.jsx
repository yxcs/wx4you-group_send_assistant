import React from 'react';
import {
  Checkbox,
  Radio,
  Spin,
  Switch,
  Form,
  Icon,
  Input,
  Collapse,
  message,
  Tabs,
} from 'antd';
import {
  connect
} from 'react-redux';
import '../style/groups.less';
import {
  updateListener,
  updateSenders,
  loginSucceed,
  updateTargetGroups,
} from '../actionCreator.js';
import SearchBox from './SearchBox.jsx';

const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
const FormItem = Form.Item;

class Groups extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      senderOptions: [],
      listenerOptions: [],
      listener: '',
      senders: [],
      checkAll: false,
      groupsCheckAll: false,
      activeKey: 'sender',
      groupPersonNum: 1000,
      personNum: 1000,
      checkedList: [],
      gpCheckedList: [],
      useTips: true,  // 是否开启邀请入群时发送欢迎文案
      tips: '',  // 发送给二次邀请对象的欢迎入群文案
      indeterminate: true
    };
  }
  componentWillMount () {
    this.selectCheck(this.props, this.state.groupPersonNum);
  }
  componentWillReceiveProps (nextProps) {

    // 调用接口获取所有群数据
    // 如果是普通的转发功能，需要在转发对象中包含
    // 联系人和群
    this.selectCheck(nextProps, this.state.groupPersonNum);
  }
  combineGroups = (groups, contacts) => {
    let inGroup = null;
    let result = [];
    contacts.forEach(contact => {
      inGroup = false;
      groups.some(group => {
        if (contact.UserName === group.UserName) {
          inGroup = true;
          return true;
        } else {
          return false;
        }
      });
      if (!inGroup) {
        result.push(contact);
      }
    });
    return result.concat(groups);
  };
  handleListenerChange = (e) => {
    this.props.groups.some(group => {
      if (group.UserName === e.target.value) {
        this.props.updateListener(group);
        return true;
      } else {
        return false;
      }
    });
  };
  handleTargetGroupsChange = (checkedValues) => {
    let checkAll = true;
    let listenerOptions = this.state.listenerOptions;
    if ( checkedValues.length !== listenerOptions.length ) {
      checkAll = false;
    } else {
      listenerOptions.some(item => {
        if ( checkedValues.indexOf(item.value) === -1 ) {
          checkAll = false;
          return true;
        } else {
          return false;
        }
      })
    }
    this.setState({
      groupsCheckAll: checkAll,
      gpCheckedList: checkedValues
    })
    this.props.updateTargetGroups(Object.assign(checkedValues))
  }
  selectCheck = (nextProps, groupNum) => {
    let senderOptions = [];
    let listenerOptions = [];
    let searchKey = nextProps.searchKey;
    let senders = [];
    let senderLabel = [];
    let senderGroup = [];
    let groups = nextProps.groups;
    let friends = nextProps.friends;

    if (nextProps.config === 'send') {
      groups.forEach(item => {
        let inSender = false;


        // 转发对象中不能包含监控对象的群
        if (item.UserName !== nextProps.listener.UserName && this.searchKeyCheck(item.ClientName, searchKey)) {
          senders.push(item);
        }

        // 监听对象中不能包含转发对象的群
        nextProps.senders.some(sender => {
          if (sender.UserName === item.UserName) {
            inSender = true;
            return true;
          } else {
            return false;
          }
        });
        if (!inSender && this.searchKeyCheck(item.ClientName, searchKey)) {
          listenerOptions.push({
            label: item.ClientName,
            value: item.UserName
          });
        }
      });
      friends.forEach(item => {
        // 转发对象不能包含监听群中的监听粉丝
        if (item.UserName !== this.props.listenerTarget.UserName && this.searchKeyCheck(item.ClientName, searchKey)) {
          senders.push(item);
        }
      });
    } else if (nextProps.config === 'invite') {

      // 如果是邀请功能，消息接收者只能是普通粉丝，
      // 目标对象只能是群
      groups.forEach(item => {
        if (this.searchKeyCheck(item.ClientName, searchKey)) {
          listenerOptions.push({
            label: item.ClientName,
            value: item.UserName
          });
        }
      });
      friends.forEach(item => {
        if (this.searchKeyCheck(item.ClientName, searchKey)) {
          senders.push(item);
        }
      });
    }

    senders.forEach((item, index) => {
      senderLabel.push(item.ClientName);
      senderGroup.push(item.UserName);
      if ((index + 1) % groupNum === 0 || index === senders.length - 1) {
        senderOptions.push({
          label:
          (
            <div style={{paddingLeft: '20px'}}>
              <Collapse
                key={index}
                defaultActiveKey={this.state.personNum <= 5 ? index + '1' : ''}>
                <Collapse.Panel
                  key={index + '1'}
                  header={`====第${Math.ceil((index + 1) / groupNum)}组 共${senders.length - 1 === index ?  ( (index + 1) % groupNum === 0 ? groupNum : (index + 1) % groupNum ) : groupNum}人====`}>
                  <div style={{paddingLeft: '20px'}}>
                    {
                      senderLabel.map(item => {
                        return <p title={item} key={item}>{item}</p>;
                      })
                    }
                  </div>
                </Collapse.Panel>
              </Collapse>
            </div>
          ),
          value: senderGroup.join('&')
        })
        senderGroup = [];
        senderLabel = [];
      }
    });

    this.setState({
      senderOptions,
      listenerOptions
    });

    window.groups = groups;
  }
  searchKeyCheck = (originKey, searchKey) => {
    let inKeysCheckPass = false;
    let outKeysCheckPass = false;

    // 拆分搜索关键词
    let keys = searchKey.split('|');
    let inKeys = [];
    let outKeys = [];
    keys.forEach(item => {
      if (item.length >= 1 && item[0] === '[' && item[item.length - 1] === ']') {
        outKeys.push(item.substring(1, item.length - 1));
      } else {
        inKeys.push(item);
      }
    })

    if (inKeys.length === 0) {
      inKeysCheckPass = true;
    }

    if (outKeys.length === 0) {
      outKeysCheckPass = true;
    }

    // 检索包含关键字
    inKeys.some((inKey, index) => {
      if (originKey.indexOf(inKey) !== -1 && index === inKeys.length - 1) {
        inKeysCheckPass = true;
        return true;
      }

      // 不允许有一个关键词不包含
      if (originKey.indexOf(inKey) === -1) {
        inKeysCheckPass = false;
        return true;
      }
    })

    // 检索不包含关键字
    outKeys.some((outKey, index) => {
      if (originKey.indexOf(outKey) === -1 && index === outKeys.length - 1) {
        outKeysCheckPass = true;
        return true;
      }

      // 不允许有一个关键词包含
      if (originKey.indexOf(outKey) !== -1) {
        outKeysCheckPass = false;
        return true;
      }
    })

    if (inKeysCheckPass === true && outKeysCheckPass === true) {
      return true;
    } else {
      return false;
    }
  }
  handleSenderChange = (checkedValues) => {
    let senders = [];
    let contacts = [];
    console.log(this.props);

    // 转发任务的消息接受者可以是群和普通粉丝
    if (this.props.config === 'send') {
      contacts = contacts.concat(this.props.friends);
      contacts = contacts.concat(this.props.groups);
    } else if (this.props.config === 'invite') {

      // 多次邀请的消息接收对象只能是普通粉丝
      contacts = contacts.concat(this.props.friends);
    }
    contacts.forEach(group => {
      checkedValues.forEach(senderGroup => {
        senderGroup.split('&').forEach(item => {
          if (group.UserName === item) {
            senders.push(group);
          }
        })
      });
    });
    this.setState({
      checkedList: checkedValues,
      indeterminate: !!checkedValues.length && (checkedValues.length < this.state.senderOptions.length),
      checkAll: checkedValues.length === this.state.senderOptions.length
    });
    this.props.updateSenders(senders);
  };
  handleGpCheckAllChange = (e) => {
    let checked = e.target.checked;
    let checkedValues = [];
    console.log(this.state.listenerOptions)
    if (checked) {
      this.state.listenerOptions.forEach(item => {
        checkedValues.push(item.value)
      })
    }
    this.setState({
      groupsCheckAll: checked,
      gpCheckedList: checkedValues
    })
    this.props.updateTargetGroups(checkedValues)
  }
  handleCheckAllChange = (e) => {
    let checkedList = [];
    let senders = [];
    let contacts = [];
    if (this.props.config === 'send') {
      contacts = contacts.concat(this.props.friends);
      contacts = contacts.concat(this.props.groups);
    } else {
      contacts = contacts.concat(this.props.friends);
    }
    this.state.senderOptions.forEach(item => {
      checkedList.push(item.value);
    });
    this.setState({
      checkAll: e.target.checked,
      indeterminate: false,
      checkedList: e.target.checked ? checkedList : []
    });
    if (e.target.checked) {
      contacts.forEach(group => {
        checkedList.forEach(senderGroup => {
          senderGroup.split('&').forEach(item => {
            if (group.UserName === item) {
              senders.push(group);
            }
          })
        });
      });
      this.props.updateSenders(senders);
    } else {
      this.props.updateSenders([]);
    }
  };
  handleTabClick = (key) => {
    this.setState({
      activeKey: key
    });
  };
  onUseTipsChange = (checked) => {
    this.setState({
      useTips: checked
    })
    this.props.updateTips({
      useTips: checked,
      tips: this.state.tips
    });
  };
  onTipsChange = (e) => {
    this.setState({
      tips: e.target.value
    })
    this.props.updateTips({
      useTips: this.state.useTips,
      tips: e.target.value
    });
  };
  handlePersonNumChange = (e) => {
    let personNum = e.target.value;
    this.setState({
      personNum,
      indeterminate: false,
      checkedList: [],
      checkAll: false
    })
    this.props.updateSenders([]);
    if (parseInt(personNum)) {
      this.setState({
        groupPersonNum: parseInt(personNum)
      })
      this.selectCheck(this.props, personNum);
    } else {
      personNum.length !== 0 && message.error('输入非法,必须输入合法人数')
    }
  }
  render () {
    return (
      <div style={{paddingTop: '24px'}}>
        <SearchBox />
        {
          this.props.config === 'send' ?
          (
            <Tabs defaultActiveKey='sender'
              activeKey={this.state.activeKey !== 'sender' &&
                this.state.activeKey !== 'listener' ? 'sender' :
                this.state.activeKey}
              onTabClick={this.handleTabClick}>
              <TabPane tab='转发对象' key='sender'>
                <div style={{marginBottom: '10px'}}>
                  <Input
                    type='number'
                    placeholder='请输入分组人数'
                    addonBefore='分组人数'
                    value={this.state.personNum} onChange={this.handlePersonNumChange} />
                </div>
                <div style={{borderBottom: '1px solid #E9E9E9', paddingBottom: '5px'}}>
                  <Checkbox
                    checked={this.state.checkAll}
                    onChange={this.handleCheckAllChange}>
                    <span className="tip">全选 </span>
                    <span className="item">
                      已选：{this.state.checkedList.length}组，共{this.state.checkedList.length > 0 ? this.state.checkedList.join('&').split('&').length : 0}人
                    </span>
                  </Checkbox>
                </div>
                <CheckboxGroup
                  options={this.state.senderOptions}
                  onChange={this.handleSenderChange}
                  value={this.state.checkedList}
                  className='groups'/>
              </TabPane>
              <TabPane tab='监控对象' key='listener'>
                <RadioGroup
                  options={this.state.listenerOptions}
                  onChange={this.handleListenerChange}
                  className='groups radio'/>
              </TabPane>
            </Tabs>
          ) :
          (
            <Tabs defaultActiveKey='invite'
              activeKey={this.state.activeKey !== 'invite' && this.state.activeKey !== 'invite-group'&& this.state.activeKey !== 'others' ?
                'invite' : this.state.activeKey}
              onTabClick={this.handleTabClick}>
              <TabPane tab='邀请对象' key='invite'>
                <div style={{marginBottom: '10px'}}>
                  <Input
                    type='number'
                    placeholder='请输入分组人数'
                    addonBefore='分组人数'
                    value={this.state.personNum} onChange={this.handlePersonNumChange} />
                </div>
                <div style={{borderBottom: '1px solid #E9E9E9', paddingBottom: '5px'}}>
                  <Checkbox
                    checked={this.state.groupsCheckAll}
                    onChange={this.handleCheckAllChange}>
                    <span className="tip">全选 </span>
                    <span className="item">
                      已选：{this.state.checkedList.length}组，共{this.state.checkedList.length > 0 ? this.state.checkedList.join('&').split('&').length : 0}人
                    </span>
                  </Checkbox>
                </div>
                <CheckboxGroup
                  options={this.state.senderOptions}
                  onChange={this.handleSenderChange}
                  value={this.state.checkedList}
                  className='groups'/>
              </TabPane>
              <TabPane tab='目标群' key='invite-group'>
                <div style={{borderBottom: '1px solid #E9E9E9', paddingBottom: '5px'}}>
                  <Checkbox
                    checked={this.state.groupsCheckAll}
                    onChange={this.handleGpCheckAllChange}>
                    <span className="tip">全选 </span>
                    <span className="item">
                      已选：{this.state.gpCheckedList.length}个群
                    </span>
                  </Checkbox>
                </div>
                <CheckboxGroup
                  value={this.props.targetGroups}
                  options={this.state.listenerOptions}
                  onChange={this.handleTargetGroupsChange}
                  className='groups radio'/>
              </TabPane>
              <TabPane tab='其他配置' key='others'>
                <Form>
                  <FormItem
                    label='开启文案'>
                    <Switch defaultChecked={this.state.useTips} onChange={this.onUseTipsChange}></Switch>
                  </FormItem>
                  <FormItem
                    label='发送文案'>
                    <Input type='textarea' placeholder='发送入群邀请之前先发送给好友的文本消息，可以介绍群相关内容、群规等'
                      onChange={this.onTipsChange}
                      style={{height: '200px'}}
                      disabled={!this.state.useTips}></Input>
                  </FormItem>
                </Form>
              </TabPane>
            </Tabs>
          )
        }
        {
          this.props.updateStatus ?
            null :
            (
              <div style={{textAlign: 'center'}}>
                <Spin/>
              </div>
            )
        }
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateListener: (listener) => {
      dispatch(updateListener(listener))
    },
    updateTargetGroups: (targetGroups) =>{
      dispatch(updateTargetGroups(targetGroups))
    },
    updateSenders: (senders) => {
      dispatch(updateSenders(senders))
    },
    notifyLogin: (status) => {
      dispatch(loginSucceed(status))
    }
  }
};

const GroupsBox = connect(
  mapStateToProps,
  mapDispatchToProps
)(Groups);

export default GroupsBox;