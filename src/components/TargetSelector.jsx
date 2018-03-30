import React from 'react';
import { connect } from 'react-redux';
import {
  Select
} from 'antd';
import {
  updateListenerTarget
} from '../actionCreator';

const Option = Select.Option;

class Target extends React.Component {
  handleChange = (value) => {
    this.props.memberList.some(item => {
      if (item.UserName === value) {
        this.props.updateListenerTarget(item);
        return true;
      } else {
        return false;
      }
    });
  };
  handleSearch = (input, option) => {
    return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };
  render () {
    return (
      <Select
        size='large'
        style={{width: '100%'}}
        onChange={this.handleChange}
        placeholder='请从配置的监听群中选择要监听的群成员（展开后可搜索）'
        showSearch
        optionFilterProp='children'
        filterOption={this.handleSearch}>
        {
          this.props.memberList.map(contact => {
            return (
              <Option key={contact.UserName + '&TargetSelector'} value={contact.UserName}>{contact.ClientName}</Option>
            );
          })
        }
      </Select>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateListenerTarget: (listenerTarget) => {
      dispatch(updateListenerTarget(listenerTarget));
    }
  }
}

const TargetSelector = connect(
  mapStateToProps,
  mapDispatchToProps
)(Target);

export default TargetSelector;

