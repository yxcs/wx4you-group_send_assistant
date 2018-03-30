import React from 'react';
import { connect } from 'react-redux';
import {
  Input,
  Row,
  Col
} from 'antd';
import {
  searchGroup
} from '../actionCreator';

const Search = Input.Search;

class SearchEle extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      key: ''
    }
  }
  handleSearchGroup = (e) => {
    let searchKey = e.target.value;
    this.setState({
      key: searchKey
    })
    this.props.searchGroup(searchKey);
  };
  render () {
    return (
      <Row>
        <Col span='24'>
          <Search
            placeholder='关键词用“|”隔开，加“[]”表示不包含，如“越南|[2]”表示包含“越南”同时不包含“2”'
            onChange={this.handleSearchGroup}/>
        </Col>
      </Row>
    );
  }
};

const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    searchGroup: (searchKey) => {
      dispatch(searchGroup(searchKey));
    }
  };
};

const SearchBox = connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchEle);

export default SearchBox;