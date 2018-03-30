import React from 'react';
import { connect } from 'react-redux';
import * as interfaceService from '../interface';
import {
  getAllTasks
} from '../actionCreator';
import { message, Table } from 'antd';

class Tasks extends React.Component {
  componentWillMount () {
    this.props.getAllTasks();
  }
  componentWillReceiveProps (nextProps) {
    console.log(nextProps);
  }
  columns = [
  {
    title: '序号',
    width: '5%',
    key: 'index',
    render: (text, record, index) => {
      return index+1;
    }
  }, {
    title: '登录账号',
    width: '8%',
    key: 'wechat',
    dataIndex: 'wechat'
  }, {
    title: '监控群',
    width: '12%',
    key: 'listener',
    dataIndex: 'listener'
  },, {
    title: '监控对象',
    width: '8%',
    key: 'listenerTarget',
    dataIndex: 'listenerTarget'
  }, {
    title: '转发目标',
    key: 'senders',
    dataIndex: 'senders',
    render: (text, record, index) => {
      let str = '';
      record.senders.forEach(item => {
        str += ` {${item}} `;
      });
      return str;
    }
  }];
  render () {
    return (
      <Table
        dataSource={this.props.tasks}
        pagination={false}
        style={{
          width: "80%",
          margin: "80px auto 0",
          background: "white",
          minHeight: "400px"
        }}
        columns={this.columns}></Table>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return state;
};


const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    getAllTasks: () => {
      interfaceService.getAllTasks()
      .then( res => {
        dispatch(getAllTasks(res.data.results));
      }).catch( e => {
        message.error(e);
      });
    }
  }
}

const TaskList = connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);

export default TaskList;