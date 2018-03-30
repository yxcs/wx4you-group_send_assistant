import React from 'react';
import { connect } from 'react-redux';
import {
  initSocket,
  loginSucceed
} from '../actionCreator.js';
import { Card, Row } from 'antd';
import '../style/login.less';
import PropTypes from 'prop-types';
import io from 'socket.io-client';

class Login extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      uuid: '',
      avatar: '',
    };
  }
  componentWillMount () {
    // let socket = io(`${location.protocol}//${location.hostname}:3030`);
    let socket = io(`${location.protocol}//${location.hostname}:${location.port}`);
    this.props.initSocket(socket);
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.socket && nextProps.status === 'offline') {
      console.log(nextProps.status);
      let socket = nextProps.socket;
      socket.emit('login');
      socket.on('getuuid', data => {
        this.setState({
          uuid: data.uuid
        });
      });
      socket.on('avatar', data => {
        this.setState({
          avatar: data.avatar
        });
        sessionStorage.setItem('avatar', data.avatar)
      });
      socket.on('login-succeed', data => {
        sessionStorage.setItem('wechatId', data.wechatId);
        sessionStorage.setItem('NickName', data.NickName);
        socket.off('getuuid');
        this.props.notifyLogin('online');
        sessionStorage.setItem('status', 'online');
      });
      socket.on('logout-succeed', _ => {
        this.props.notifyLogin('offline');
        sessionStorage.setItem('status', 'offline');
      });
    }
  }
  render () {
    return (
      <Card id='login'>
        <Row>
          <div className="img-wrapper">
            <img src={
              this.state.avatar ? this.state.avatar :
              (this.state.uuid ? `https://login.weixin.qq.com/qrcode/${this.state.uuid}` : '')
            } alt=""/>
          </div>
        </Row>
        <Row>
          {
            this.state.avatar ? (<p className='login-tip'>请在手机上确认登录</p>) : null
          }
        </Row>
      </Card>
    )
  }
}

Login.propTypes = {
  socke: PropTypes.object.isRequired,
  initSocket: PropTypes.func.isRequired,
  notifyLogin: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  console.log(state);
  return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    initSocket: (socket) => {
      dispatch(initSocket(socket));
    },
    notifyLogin: (status) => {
      dispatch(loginSucceed(status));
    }
  }
}

let LoginBox = connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);

export default LoginBox;

