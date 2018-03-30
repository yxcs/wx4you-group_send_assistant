import React from 'react';
import {
  Modal,
  Button,
  Carousel
} from 'antd';
import send_1_source from '../img/send_1.jpg';
import usage_config_source from '../img/usage_config.jpg';
import select_target_source from '../img/select_target.jpg';
import show_senders_source from '../img/show_senders.jpg';
import task_list_source from '../img/task_list.jpg';
import select_usage_source from '../img/select_usage.jpg';
import show_friends_source from '../img/show_friends.jpg';
import task_start_source from '../img/start_task.jpg';
import task_finished_source from '../img/task_finished.jpg';
import usage_config_update_source from '../img/usage_config_update.jpg';
import get_contacts_source from '../img/get_contacts.png';
import start_update_source from '../img/start_update.png';
export default class UserHelper extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      modalVisible: false
    };
  }
  toggleDisplay = () => {
    this.setState({
      modalVisible: !this.state.modalVisible
    });
  };
  render () {
    return (
      <div style={{position: 'fixed', right: '30px', top: '20px'}}>
        <Button icon='question' shape='circle' title='如何使用?' onClick={this.toggleDisplay}></Button>
        <Modal
          size='large'
          width='1200'
          title='如何使用？'
          footer={null}
          onCancel={this.toggleDisplay}
          visible={this.state.modalVisible}>
          <article style={{padding: '5px 10px'}}>
            <section>
              <h2>功能</h2>
              <ol style={{marginTop: '10px'}}>
                <li>1. 群发功能: 监控指定群的指定群成员，将它发送的消息通过登录到本工具的微信号转发到指定的联系人或群</li>
                <li>2. 分析粉丝与群关系: 分析登录本工具的微信号的所有粉丝和所有群的对应关系，每个粉丝的群关系会提现在昵称上</li>
                <li>3. 二次/多次邀请入群: 通过配置需要邀请的粉丝和要邀请目标群，批量将粉丝邀请到指定群</li>
              </ol>
            </section>
            <section style={{marginTop: '10px'}}>
              <h2>群发功能</h2>
              <p style={{marginTop: '10px'}}>登录微信号->选择群发功能->打开配置面板配置转发对象（要把消息发送给哪些粉丝）和监控群（要转发的消息来自于哪个群）->配置监控对象（要转发的消息来自于监控群的哪个群成员）->点击添加按钮，添加群发任务</p>
              <Carousel autoplay vertical='true'>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={send_1_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={usage_config_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={show_senders_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={select_target_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={task_list_source} /></div>
              </Carousel>
            </section>
            <section>
              <h2 style={{marginTop: '20px'}}>二次/多次邀请</h2>
              <p style={{marginTop: '10px'}}>登录微信号->选择群发功能->切换功能选项为“邀请”->打开配置面板配置邀请入群对象（要把哪些粉丝拉入群或发送入群邀请）和目标群->点击添加按钮，任务开始，按钮状态变为“loading”直到任务结束</p>
              <Carousel autoplay vertical='true'>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={send_1_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={usage_config_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={select_usage_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={show_friends_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={task_start_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={task_finished_source} /></div>
              </Carousel>
            </section>
            <section>
              <h2 style={{marginTop: '20px'}}>同步群关系</h2>
              <p style={{marginTop: '10px'}}>登录微信号->选择同步助手->等待联系人和群组信息加载(默认2分钟后自动停止加载，如果联系人信息很快就加载完成，可以手动停止下载)->选择需要进行匹配的群和粉丝->点击开始按钮，关系匹配开始->匹配完成后，自动跳转到群发助手</p>
              <Carousel autoplay vertical='true'>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={send_1_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={usage_config_update_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={get_contacts_source} /></div>
                <div style={{width: '100%'}}><img alt='' style={{width: '100%', height: '555px'}} src={start_update_source} /></div>
              </Carousel>
            </section>
            <section>
              <h2 style={{marginTop: '20px'}}>注意事项</h2>
              <ul style={{color: 'red'}}>
                <li>同步助手主要是在本地分析群和粉丝的关系，每个粉丝所在的群，都会被附加到粉丝个人昵称上，通过昵称可以知道每个粉丝都在哪个群</li>
                <li>使用群发助手和邀请入群工具，可以先使用同步助手更新粉丝和群关系也可以不使用同步助手，关键是看要使用的群发功能和邀请功能是否针对群内/外用户</li>
              </ul>
            </section>
          </article>
        </Modal>
      </div>
    )
  }
}